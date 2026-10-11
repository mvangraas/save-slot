import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { setOrderStatusAction } from '@/app/actions/admin'
import { inputCls } from '@/components/forms/fieldStyles'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { formatDate, formatEuro } from '@/lib/format'
import { getShopStore, requireAdmin } from '@/lib/shop'
import { orderStatusLabel, type OrderStatus } from '@/lib/shop/types'

export const metadata = { title: 'Order' }

/** Statuses an admin may set by hand. "Paid" only ever comes from Mollie. */
const MANUAL: OrderStatus[] = ['processing', 'shipped', 'completed', 'cancelled']

export default function AdminOrder(props: PageProps<'/admin/orders/[id]'>) {
  return (
    <Suspense fallback={<LoadingState />}>
      <Body {...props} />
    </Suspense>
  )
}

async function Body({ params }: PageProps<'/admin/orders/[id]'>) {
  const { id } = await params
  await requireAdmin(`/admin/orders/${id}`)
  const o = await getShopStore().getOrder(id)
  if (!o) notFound()
  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-lg">ORDER {o.number}</h1>
      {o.needsAttention ? (
        <p role="alert" className="bg-sticker p-3 text-ink">
          {o.needsAttention}. Contact the customer and refund via Mollie if needed.
        </p>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="cust" className="space-y-1 bg-surface p-5 text-sm">
          <h2 id="cust" className="font-display text-sm uppercase">
            Customer
          </h2>
          <p>{o.name}</p>
          <p>
            <a href={`mailto:${o.email}`} className="underline">
              {o.email}
            </a>
          </p>
          {o.phone ? <p>{o.phone}</p> : null}
          <p>
            {o.address.street} {o.address.houseNumber}
            <br />
            {o.address.postalCode} {o.address.city}, {o.address.country}
          </p>
        </section>
        <section aria-labelledby="pay" className="space-y-1 bg-surface p-5 text-sm">
          <h2 id="pay" className="font-display text-sm uppercase">
            Payment & status
          </h2>
          <p>Status: {orderStatusLabel[o.status]}</p>
          <p>Placed: {formatDate(o.createdAt)}</p>
          <p>Paid: {o.paidAt ? formatDate(o.paidAt) : 'not yet'}</p>
          <p>Mollie payment: {o.molliePaymentId ?? '—'}</p>
          {o.paidAt ? (
            <form action={setOrderStatusAction} className="flex flex-wrap items-end gap-2 pt-2">
              <input type="hidden" name="id" value={o.id} />
              <label className="flex flex-col gap-1">
                <span className="font-display text-xs uppercase">Change status</span>
                <select name="status" defaultValue={o.status} className={inputCls}>
                  {MANUAL.map((s) => (
                    <option key={s} value={s}>
                      {orderStatusLabel[s]}
                    </option>
                  ))}
                </select>
              </label>
              <PixelButton type="submit" size="sm" variant="secondary">
                Update
              </PixelButton>
            </form>
          ) : (
            <p className="pt-2 text-xs text-fg-muted">
              Status can be changed once the order is paid.
            </p>
          )}
        </section>
      </div>
      <section aria-labelledby="items" className="space-y-2 bg-surface p-5 text-sm">
        <h2 id="items" className="font-display text-sm uppercase">
          Items
        </h2>
        <ul className="space-y-1">
          {o.items.map((i, n) => (
            <li key={n} className="flex justify-between">
              <span>
                {i.quantity} × {i.name}
              </span>
              <span className="font-mono">{formatEuro(i.unitPriceCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between border-t border-line pt-2">
          <span>Shipping</span>
          <span className="font-mono">{formatEuro(o.shippingCents)}</span>
        </p>
        <p className="flex justify-between font-display uppercase">
          <span>Total</span>
          <span className="font-mono">{formatEuro(o.totalCents)}</span>
        </p>
      </section>
    </div>
  )
}
