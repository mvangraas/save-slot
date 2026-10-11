import { connection } from 'next/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { retryPaymentAction } from '@/app/actions/shop'
import { ClearCart } from '@/components/shop/ClearCart'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { formatEuro } from '@/lib/format'
import { getShopStore } from '@/lib/shop'
import { getMollie, syncPayment } from '@/lib/shop/payments'
import { orderStatusLabel, type Order } from '@/lib/shop/types'
import { hashToken, isReference } from '@/lib/shop/util'

export const metadata: Metadata = { title: 'Your order', robots: { index: false } }

export default function OrderPage(props: PageProps<'/shop/order/[number]'>) {
  return (
    <Suspense fallback={<LoadingState label="Checking your order" />}>
      <OrderBody {...props} />
    </Suspense>
  )
}

async function OrderBody({ params, searchParams }: PageProps<'/shop/order/[number]'>) {
  await connection()
  const { number } = await params
  const sp = await searchParams
  const token = typeof sp.t === 'string' ? sp.t : ''
  if (!isReference('SS', number) || !token) notFound()
  const store = getShopStore()
  let order: Order | null = await store.getOrderByNumber(number)
  // The private link is the only way in: wrong or missing token = not found.
  if (!order || (order as Order & { tokenHash: string }).tokenHash !== hashToken(token)) notFound()

  // Returning from Mollie: ask Mollie for the real status (the webhook may not have arrived yet).
  const mollie = getMollie()
  if (order.status === 'pending_payment' && order.molliePaymentId && mollie) {
    order =
      (await syncPayment(store, mollie, order.molliePaymentId).catch(() => null))?.order ?? order
  }
  const paid = Boolean(order.paidAt)
  const failed = order.status === 'payment_failed'

  return (
    <div className="space-y-8">
      {paid ? <ClearCart /> : null}
      <LcdPanel as="section" aria-labelledby="order-title" screenClassName="text-center">
        <h1 id="order-title" className="font-pixel text-base leading-relaxed">
          {paid ? 'ORDER CONFIRMED' : failed ? 'PAYMENT NOT COMPLETED' : 'WAITING FOR PAYMENT'}
        </h1>
        <p className="mt-3 text-sm">
          Order number <strong className="font-mono">{order.number}</strong>
        </p>
        <p className="mt-2 text-sm">
          {paid
            ? 'Thank you! We received your payment and will prepare your order.'
            : failed
              ? 'The payment was cancelled or did not go through. Nothing has been charged.'
              : 'We have not received confirmation of your payment yet. This page updates when you reload it.'}
        </p>
        <p className="mt-2 text-xs">
          Keep this page’s link: it is the only way to view this order without an account.
        </p>
        {failed ? (
          <form action={retryPaymentAction} className="mt-4">
            <input type="hidden" name="number" value={order.number} />
            <input type="hidden" name="t" value={token} />
            <PixelButton type="submit" variant="screen">
              Try paying again
            </PixelButton>
          </form>
        ) : null}
      </LcdPanel>

      <section aria-labelledby="summary-title" className="space-y-3 bg-surface p-5">
        <h2 id="summary-title" className="font-display text-sm uppercase">
          Status: {orderStatusLabel[order.status]}
        </h2>
        <ul className="space-y-1 text-sm">
          {order.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-3">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span className="font-mono">{formatEuro(i.unitPriceCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="font-mono">
              {order.shippingCents === 0 ? 'Free' : formatEuro(order.shippingCents)}
            </dd>
          </div>
          <div className="flex justify-between font-display uppercase">
            <dt>Total</dt>
            <dd className="font-mono">{formatEuro(order.totalCents)}</dd>
          </div>
        </dl>
        <p className="text-sm text-fg-muted">
          Shipping to: {order.name}, {order.address.street} {order.address.houseNumber},{' '}
          {order.address.postalCode} {order.address.city}, {order.address.country}
        </p>
      </section>
      <p className="text-sm">
        Questions?{' '}
        <Link href="/contact" className="underline">
          Contact us
        </Link>{' '}
        and mention your order number.
      </p>
    </div>
  )
}
