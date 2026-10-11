import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { readShopConfig } from '@/config/shop'
import { checkoutAvailability, repairAvailability } from './availability'
import { memoryShopStore, resetMemoryShop } from './memory-store'
import { mollieClient } from './mollie'
import { syncPayment } from './payments'
import { checkoutSchema, repairSchema } from './schemas'
import {
  estimateFor,
  hashToken,
  isReference,
  newAccessToken,
  orderTotals,
  referenceNumber,
  REPAIR_DEVICES,
  REPAIR_ISSUES,
} from './util'

describe('reference numbers and tokens', () => {
  it('generates readable, valid references', () => {
    for (let i = 0; i < 50; i++) {
      expect(isReference('SS', referenceNumber('SS'))).toBe(true)
      expect(isReference('RS', referenceNumber('RS'))).toBe(true)
    }
    expect(isReference('RS', 'RS-ABC10O')).toBe(false) // no 0/O/1
    expect(isReference('SS', 'RS-ABCDEF')).toBe(false)
  })
  it('stores only a hash of the access token', () => {
    const { token, hash } = newAccessToken()
    expect(token.length).toBeGreaterThanOrEqual(32)
    expect(hash).toBe(hashToken(token))
    expect(hash).not.toContain(token)
  })
})

describe('orderTotals', () => {
  const lines = [
    { unitPriceCents: 2450, quantity: 2 },
    { unitPriceCents: 1000, quantity: 1 },
  ]
  it('adds shipping below the free threshold', () => {
    expect(orderTotals(lines, 495, null)).toEqual({
      subtotalCents: 5900,
      shippingCents: 495,
      totalCents: 6395,
    })
    expect(orderTotals(lines, 495, 5000)).toEqual({
      subtotalCents: 5900,
      shippingCents: 0,
      totalCents: 5900,
    })
  })
})

describe('estimateFor', () => {
  it('returns null (on request) when no indication is set', () => {
    const prices = [
      {
        deviceId: 'd',
        issueId: 'i',
        priceFromCents: 2500,
        priceToCents: 4000,
        daysMin: 3,
        daysMax: 5,
      },
    ]
    expect(estimateFor({ prices }, 'd', 'i')).toEqual({
      priceFromCents: 2500,
      priceToCents: 4000,
      daysMin: 3,
      daysMax: 5,
    })
    expect(estimateFor({ prices }, 'd', 'x')).toBeNull()
  })
})

describe('shop config and gates', () => {
  it('stays closed without real business details', () => {
    const cfg = readShopConfig({})
    expect(cfg.business).toBeNull()
    expect(checkoutAvailability(cfg).open).toBe(false)
    expect(repairAvailability(cfg).open).toBe(false)
  })
  it('never accepts test mode on a production deployment', () => {
    const env = { SHOP_TEST_MODE: '1', E2E: '1', VERCEL_ENV: 'production' }
    expect(readShopConfig(env).business).toBeNull()
  })
  it('requires every business field and a valid Mollie key format', () => {
    const env = {
      SHOP_LEGAL_NAME: 'X',
      SHOP_KVK: '123',
      SHOP_ADDRESS: 'Street 1',
      SHOP_EMAIL: 'a@b.nl',
      SHOP_VAT_MODE: 'kor',
      MOLLIE_API_KEY: 'live_shortkey',
      ADMIN_EMAILS: ' Admin@Example.com , other@x.nl',
    }
    const cfg = readShopConfig(env)
    expect(cfg.business?.vatMode).toBe('kor')
    expect(cfg.mollie).toBeNull()
    expect(cfg.adminEmails).toEqual(['admin@example.com', 'other@x.nl'])
    expect(readShopConfig({ ...env, SHOP_VAT_MODE: 'nope' }).business).toBeNull()
    expect(
      readShopConfig({ ...env, MOLLIE_API_KEY: 'test_abcdefghijklmnopqrstuvwxyz' }).mollie,
    ).not.toBeNull()
  })
})

describe('validation', () => {
  const base = {
    name: 'Jan Jansen',
    email: 'JAN@example.nl',
    street: 'Straat',
    houseNumber: '1',
    postalCode: '1234 ab',
    city: 'Stad',
    country: 'NL',
    acceptTerms: 'on',
    cart: JSON.stringify([{ productId: 'p1', quantity: 2 }]),
  }
  it('checks postcodes per country and terms acceptance', () => {
    expect(checkoutSchema.safeParse(base).success).toBe(true)
    expect(checkoutSchema.safeParse({ ...base, postalCode: '12345' }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...base, country: 'BE', postalCode: '1000' }).success).toBe(
      true,
    )
    expect(checkoutSchema.safeParse({ ...base, acceptTerms: undefined }).success).toBe(false)
    expect(checkoutSchema.safeParse({ ...base, cart: '[]' }).success).toBe(false)
    expect(
      checkoutSchema.safeParse({
        ...base,
        cart: JSON.stringify([{ productId: 'p', quantity: 50 }]),
      }).success,
    ).toBe(false)
    expect(checkoutSchema.safeParse({ ...base, cart: 'not json' }).success).toBe(false)
  })
  it('requires consent and a future preferred date for repairs', () => {
    const r = {
      name: 'Jan',
      email: 'a@b.nl',
      phone: '0612345678',
      deviceId: 'd',
      issueId: 'i',
      description: 'Screen has lines on it.',
      delivery: 'mail_in',
      consent: 'on',
    }
    expect(repairSchema.safeParse(r).success).toBe(true)
    expect(repairSchema.safeParse({ ...r, consent: undefined }).success).toBe(false)
    expect(repairSchema.safeParse({ ...r, preferredDate: '2000-01-01' }).success).toBe(false)
    expect(repairSchema.safeParse({ ...r, phone: 'call me' }).success).toBe(false)
  })
})

describe('payments (memory store + fake Mollie)', () => {
  beforeEach(() => resetMemoryShop())

  async function setup(status: string, amount = '24.50') {
    const store = memoryShopStore
    const saved = await store.saveProduct(null, {
      slug: 'p',
      name: 'P',
      description: '',
      categoryId: null,
      priceCents: 2450,
      stock: 1,
      condition: 'used',
      specs: [],
      active: true,
    })
    if (!saved.ok) throw new Error()
    const order = await store.createOrder(
      {
        userId: null,
        email: 'a@b.nl',
        name: 'A',
        phone: null,
        address: { street: 's', houseNumber: '1', postalCode: '1234 AB', city: 'c', country: 'NL' },
        items: [{ productId: saved.data.id, name: 'P', unitPriceCents: 2450, quantity: 1 }],
        subtotalCents: 2450,
        shippingCents: 0,
        totalCents: 2450,
      },
      'hash',
    )
    if (!order.ok) throw new Error()
    await store.attachPayment(order.data.id, 'tr_test1')
    const fake: typeof fetch = async () =>
      Response.json({
        id: 'tr_test1',
        status,
        amount: { value: amount, currency: 'EUR' },
        metadata: { orderId: order.data.id },
      })
    return {
      store,
      mollie: mollieClient({ apiKey: 'k', apiBase: 'https://x' }, fake),
      orderId: order.data.id,
      productId: saved.data.id,
    }
  }

  it('marks paid once and takes stock once (idempotent webhook)', async () => {
    const { store, mollie, orderId, productId } = await setup('paid')
    await syncPayment(store, mollie, 'tr_test1')
    await syncPayment(store, mollie, 'tr_test1')
    expect((await store.getOrder(orderId))?.status).toBe('paid')
    expect((await store.getProductById(productId))?.stock).toBe(0)
  })

  it('ignores a payment whose amount does not match the order', async () => {
    const { store, mollie, orderId } = await setup('paid', '0.01')
    const res = await syncPayment(store, mollie, 'tr_test1')
    expect(res.reason).toBe('payment does not match order')
    expect((await store.getOrder(orderId))?.paidAt).toBeNull()
  })

  it('marks cancelled payments as failed', async () => {
    const { store, mollie, orderId } = await setup('canceled')
    await syncPayment(store, mollie, 'tr_test1')
    expect((await store.getOrder(orderId))?.status).toBe('payment_failed')
  })

  it('flags stock shortages for the admin', async () => {
    const { store, orderId, productId } = await setup('paid')
    await store.saveProduct(productId, {
      slug: 'p',
      name: 'P',
      description: '',
      categoryId: null,
      priceCents: 2450,
      stock: 0,
      condition: 'used',
      specs: [],
      active: true,
    })
    const res = await store.markOrderPaid(orderId)
    expect(res.shortage).toContain('P')
  })

  it('refuses malformed payment ids before calling Mollie', async () => {
    const m = mollieClient({ apiKey: 'k', apiBase: 'https://x' }, async () => {
      throw new Error('should not be called')
    })
    await expect(m.getPayment('../../admin')).rejects.toThrow('invalid payment id')
  })
})

describe('migration parity', () => {
  it('seeds the same repair devices and problems as the app', () => {
    const dir = join(process.cwd(), 'supabase/migrations')
    const sql = readFileSync(
      join(
        dir,
        readdirSync(dir).find((f) => f.endsWith('_shop_and_repairs.sql'))!,
      ),
      'utf8',
    )
    for (const d of REPAIR_DEVICES) expect(sql).toContain(`('${d.slug}', '${d.name}'`)
    for (const i of REPAIR_ISSUES)
      expect(sql).toContain(`('${i.slug}', '${i.name}', '${i.description}'`)
  })
})
