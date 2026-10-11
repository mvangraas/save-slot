import 'server-only'
import { readShopConfig } from '@/config/shop'
import { centsToMollie, mollieClient, type MolliePayment } from './mollie'
import type { Order, ShopStore } from './types'

export function getMollie() {
  const cfg = readShopConfig().mollie
  return cfg ? mollieClient(cfg) : null
}

/**
 * Brings an order in line with the payment status *as reported by Mollie*. Called by the
 * webhook and when the customer returns to the order page. Idempotent.
 */
export async function syncPayment(
  store: ShopStore,
  mollie: ReturnType<typeof mollieClient>,
  paymentId: string,
): Promise<{ order: Order | null; payment: MolliePayment | null; reason?: string }> {
  const payment = await mollie.getPayment(paymentId)
  const order = await store.getOrderByPayment(payment.id)
  if (!order) return { order: null, payment, reason: 'unknown payment' }
  // Never trust a payment that doesn't match the order it claims to pay for.
  if (
    payment.metadata?.orderId !== order.id ||
    payment.amount.currency !== 'EUR' ||
    payment.amount.value !== centsToMollie(order.totalCents)
  ) {
    console.error('[payments] mismatch for', order.number, payment.id)
    return { order, payment, reason: 'payment does not match order' }
  }
  if (payment.status === 'paid' && !order.paidAt) {
    const res = await store.markOrderPaid(order.id)
    if (res.shortage) console.warn('[payments] stock shortage on', order.number, res.shortage)
  } else if (
    ['canceled', 'expired', 'failed'].includes(payment.status) &&
    order.status === 'pending_payment'
  ) {
    await store.setOrderStatus(order.id, 'payment_failed')
  }
  return { order: await store.getOrder(order.id), payment }
}
