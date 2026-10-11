/**
 * Webshop & repair service configuration. Everything business-specific comes from the owner
 * (environment variables + the legal texts in src/content/legal). Nothing here is invented:
 * while details are missing, checkout and repair intake stay closed and the UI says so.
 */
export type VatMode = 'vat21' | 'margin' | 'kor'

export type BusinessDetails = {
  legalName: string
  kvk: string
  vatId: string | null
  address: string
  email: string
  phone: string | null
  vatMode: VatMode
}

export type ShopConfig = {
  business: BusinessDetails | null
  shippingCents: number | null
  freeShippingFromCents: number | null
  mollie: { apiKey: string; apiBase: string } | null
  adminEmails: string[]
}

const isProdDeploy = (env: Record<string, string | undefined>) => env.VERCEL_ENV === 'production'

/** Only for automated tests outside production: clearly marked test details. */
function testMode(env: Record<string, string | undefined>) {
  return env.SHOP_TEST_MODE === '1' && env.E2E === '1' && !isProdDeploy(env)
}

const cents = (v: string | undefined) => {
  if (v === undefined || v.trim() === '') return null
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n < 1_000_000 ? n : null
}

export function readShopConfig(env: Record<string, string | undefined> = process.env): ShopConfig {
  const test = testMode(env)
  const vatMode = (['vat21', 'margin', 'kor'] as const).find((m) => m === env.SHOP_VAT_MODE)
  const required = {
    legalName: env.SHOP_LEGAL_NAME?.trim(),
    kvk: env.SHOP_KVK?.trim(),
    address: env.SHOP_ADDRESS?.trim(),
    email: env.SHOP_EMAIL?.trim(),
  }
  const business: BusinessDetails | null = test
    ? {
        legalName: 'TEST SHOP (automated tests only)',
        kvk: '00000000',
        vatId: null,
        address: 'Test address — not a real business',
        email: 'shop@example.test',
        phone: null,
        vatMode: 'vat21',
      }
    : required.legalName && required.kvk && required.address && required.email && vatMode
      ? {
          legalName: required.legalName,
          kvk: required.kvk,
          vatId: env.SHOP_VAT_ID?.trim() || null,
          address: required.address,
          email: required.email,
          phone: env.SHOP_PHONE?.trim() || null,
          vatMode,
        }
      : null

  const apiKey = env.MOLLIE_API_KEY?.trim()
  const apiBase = test && env.MOLLIE_API_BASE ? env.MOLLIE_API_BASE : 'https://api.mollie.com/v2'
  return {
    business,
    shippingCents: test ? 495 : cents(env.SHOP_SHIPPING_CENTS),
    freeShippingFromCents: test ? null : cents(env.SHOP_FREE_SHIPPING_FROM_CENTS),
    mollie: apiKey && (test || /^(live|test)_\w{20,}$/.test(apiKey)) ? { apiKey, apiBase } : null,
    adminEmails: (env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  }
}

export const vatNote: Record<VatMode, string> = {
  vat21: 'Prices include 21% VAT.',
  margin: 'Second-hand goods sold under the VAT margin scheme; VAT is not shown separately.',
  kor: 'No VAT is charged (Dutch small business scheme, KOR).',
}
