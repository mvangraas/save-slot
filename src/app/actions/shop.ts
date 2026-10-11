'use server'

import { redirect } from 'next/navigation'
import { readShopConfig } from '@/config/shop'
import { getSessionUser } from '@/lib/backend'
import { clientIp } from '@/lib/backend/client-ip'
import { requestOrigin } from '@/lib/backend/origin'
import { fieldErrors, type FormState } from '@/lib/backend/schemas'
import { createLimiter } from '@/lib/rate-limit'
import { getShopStore } from '@/lib/shop'
import { checkoutAvailability } from '@/lib/shop/availability'
import { getMollie, syncPayment } from '@/lib/shop/payments'
import { checkoutSchema } from '@/lib/shop/schemas'
import { hashToken, isReference, newAccessToken, orderTotals } from '@/lib/shop/util'

export type CartProduct = {
  id: string
  slug: string
  name: string
  priceCents: number
  stock: number
  imageUrl: string | null
}

/** Current names/prices/stock for the cart. The browser only stores ids and quantities. */
export async function getCartProductsAction(ids: string[]): Promise<CartProduct[]> {
  const clean = [...new Set(ids.filter((id) => typeof id === 'string' && id.length <= 80))].slice(
    0,
    30,
  )
  const products = await getShopStore().getProductsByIds(clean)
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    priceCents: p.priceCents,
    stock: p.stock,
    imageUrl: p.images[0]?.url ?? null,
  }))
}

const checkoutLimiter = createLimiter({
  limit: process.env.E2E === '1' ? 1000 : 10,
  windowMs: 10 * 60_000,
})

export async function checkoutAction(_prev: FormState, form: FormData): Promise<FormState> {
  const availability = checkoutAvailability()
  const mollie = getMollie()
  const cfg = readShopConfig()
  if (!availability.open || !mollie || cfg.shippingCents === null) {
    return { message: 'Ordering is not open yet. Nothing has been charged.' }
  }
  if (!checkoutLimiter.hit(`checkout:${await clientIp()}`)) {
    return { message: 'Too many attempts. Wait a few minutes and try again.' }
  }
  const parsed = checkoutSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const input = parsed.data

  // Re-check every line against the database: price, availability and stock.
  const store = getShopStore()
  const products = await store.getProductsByIds(input.cart.map((l) => l.productId))
  const lines = []
  for (const line of input.cart) {
    const p = products.find((x) => x.id === line.productId)
    if (!p) return { message: 'A product in your cart is no longer available. Check your cart.' }
    if (p.stock < line.quantity) {
      return { message: `Only ${p.stock} × “${p.name}” in stock. Update your cart and try again.` }
    }
    lines.push({
      productId: p.id,
      name: p.name,
      unitPriceCents: p.priceCents,
      quantity: line.quantity,
    })
  }
  const totals = orderTotals(lines, cfg.shippingCents, cfg.freeShippingFromCents)
  const user = await getSessionUser()
  const { token, hash } = newAccessToken()
  const created = await store.createOrder(
    {
      userId: user?.id ?? null,
      email: input.email,
      name: input.name,
      phone: input.phone,
      address: {
        street: input.street,
        houseNumber: input.houseNumber,
        postalCode: input.postalCode,
        city: input.city,
        country: input.country,
      },
      items: lines,
      ...totals,
    },
    hash,
  )
  if (!created.ok) return { message: created.error }

  const origin = await requestOrigin()
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(origin)
  let checkoutUrl: string | null
  try {
    const payment = await mollie.createPayment({
      amountCents: totals.totalCents,
      description: `Save Slot order ${created.data.number}`,
      redirectUrl: `${origin}/shop/order/${created.data.number}?t=${token}`,
      webhookUrl: local && process.env.E2E !== '1' ? null : `${origin}/api/mollie/webhook`,
      orderId: created.data.id,
    })
    await store.attachPayment(created.data.id, payment.id)
    checkoutUrl = payment.checkoutUrl
  } catch (error) {
    console.error('[checkout] payment creation failed', error)
    await store.setOrderStatus(created.data.id, 'payment_failed')
    return {
      message: 'The payment could not be started. Nothing has been charged; please try again.',
    }
  }
  if (!checkoutUrl) return { message: 'The payment could not be started. Please try again.' }
  redirect(checkoutUrl)
}

/** "Try again" on an order whose payment failed or expired. */
export async function retryPaymentAction(form: FormData): Promise<void> {
  const number = String(form.get('number') ?? '')
  const token = String(form.get('t') ?? '')
  const mollie = getMollie()
  if (!mollie || !isReference('SS', number)) redirect('/shop')
  const store = getShopStore()
  const order = await store.getOrderByNumber(number)
  if (!order || order.tokenHash !== hashToken(token) || order.paidAt) {
    redirect(`/shop/order/${number}?t=${encodeURIComponent(token)}`)
  }
  if (order.molliePaymentId) await syncPayment(store, mollie, order.molliePaymentId)
  const fresh = await store.getOrder(order.id)
  if (!fresh || fresh.paidAt || fresh.status === 'cancelled') {
    redirect(`/shop/order/${number}?t=${encodeURIComponent(token)}`)
  }
  const origin = await requestOrigin()
  const payment = await mollie.createPayment({
    amountCents: fresh.totalCents,
    description: `Save Slot order ${fresh.number}`,
    redirectUrl: `${origin}/shop/order/${fresh.number}?t=${token}`,
    webhookUrl: `${origin}/api/mollie/webhook`,
    orderId: fresh.id,
  })
  await store.attachPayment(fresh.id, payment.id)
  await store.setOrderStatus(fresh.id, 'pending_payment')
  redirect(payment.checkoutUrl ?? `/shop/order/${number}?t=${encodeURIComponent(token)}`)
}
