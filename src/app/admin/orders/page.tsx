import Link from 'next/link'
import { Suspense } from 'react'
import { LoadingState } from '@/components/retro/LoadingState'
import { formatDate, formatEuro } from '@/lib/format'
import { getShopStore, requireAdmin } from '@/lib/shop'
import { orderStatusSchema } from '@/lib/shop/schemas'
import { ORDER_STATUSES, orderStatusLabel } from '@/lib/shop/types'

export const metadata = { title: 'Orders' }

export default function AdminOrders(props: PageProps<'/admin/orders'>) {
  return (
    <Suspense fallback={<LoadingState />}>
      <Body {...props} />
    </Suspense>
  )
}

async function Body({ searchParams }: PageProps<'/admin/orders'>) {
  await requireAdmin('/admin/orders')
  const sp = await searchParams
  const status = orderStatusSchema.safeParse(sp.status)
  const orders = await getShopStore().listOrders({
    status: status.success ? status.data : undefined,
    limit: 200,
  })
  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-lg">ORDERS</h1>
      <nav aria-label="Filter orders" className="flex flex-wrap gap-1">
        <Link
          href="/admin/orders"
          className="bg-surface-2 px-3 py-2 font-display text-xs uppercase"
        >
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            aria-current={status.success && status.data === s ? 'page' : undefined}
            className="bg-surface-2 px-3 py-2 font-display text-xs uppercase aria-[current=page]:bg-lcd-200 aria-[current=page]:text-lcd-900"
          >
            {orderStatusLabel[s]}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className="text-fg-muted">No orders.</p>
      ) : (
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">Orders</caption>
            <thead className="font-display text-xs uppercase">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-3">
                  Order
                </th>
                <th scope="col" className="py-2 pr-3">
                  Date
                </th>
                <th scope="col" className="py-2 pr-3">
                  Customer
                </th>
                <th scope="col" className="py-2 pr-3">
                  Total
                </th>
                <th scope="col" className="py-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-line/50">
                  <td className="py-2 pr-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-mono underline">
                      {o.number}
                    </Link>
                    {o.needsAttention ? (
                      <span className="ml-2 bg-sticker px-1 text-xs text-ink">!</span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-3">{formatDate(o.createdAt)}</td>
                  <td className="py-2 pr-3">{o.name}</td>
                  <td className="py-2 pr-3 font-mono">{formatEuro(o.totalCents)}</td>
                  <td className="py-2">{orderStatusLabel[o.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
