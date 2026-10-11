import Link from 'next/link'
import { Suspense } from 'react'
import { LoadingState } from '@/components/retro/LoadingState'
import { formatDate, formatEuro } from '@/lib/format'
import { getShopStore, requireAdmin } from '@/lib/shop'
import { checkoutAvailability, repairAvailability } from '@/lib/shop/availability'
import { orderStatusLabel, repairStatusLabel } from '@/lib/shop/types'

export default function AdminDashboard() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Dashboard />
    </Suspense>
  )
}

async function Dashboard() {
  await requireAdmin('/admin')
  const store = getShopStore()
  const [orders, repairs, products] = await Promise.all([
    store.listOrders({ limit: 8 }),
    store.listRepairs({ open: true, limit: 8 }),
    store.listProducts({ sort: 'newest', page: 1, pageSize: 200 }, { includeInactive: true }),
  ])
  const checkout = checkoutAvailability()
  const repairsOpen = repairAvailability()
  const lowStock = products.items.filter((p) => p.active && p.stock <= 1)
  const attention = orders.filter((o) => o.needsAttention)

  return (
    <div className="space-y-8">
      <h1 className="font-pixel text-lg">DASHBOARD</h1>

      <section aria-labelledby="setup-title" className="space-y-2 bg-surface p-5">
        <h2 id="setup-title" className="font-display text-sm uppercase">
          Setup
        </h2>
        <p>
          Checkout: <strong>{checkout.open ? 'open' : 'closed'}</strong>
          {checkout.missing.length ? ` — missing: ${checkout.missing.join(', ')}` : ''}
        </p>
        <p>
          Repair requests: <strong>{repairsOpen.open ? 'open' : 'closed'}</strong>
          {repairsOpen.missing.length ? ` — missing: ${repairsOpen.missing.join(', ')}` : ''}
        </p>
        <p className="text-xs text-fg-muted">See docs/SHOP_SETUP.md for what to configure.</p>
      </section>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['Products', products.total],
            ['Low stock', lowStock.length],
            ['Open repairs', repairs.length],
            ['Needs attention', attention.length],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="bg-surface p-4">
            <dt className="font-display text-xs text-fg-muted uppercase">{k}</dt>
            <dd className="mt-1 font-pixel text-lg">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-orders" className="space-y-3">
          <h2 id="recent-orders" className="font-display text-sm uppercase">
            Recent orders
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm text-fg-muted">No orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap justify-between gap-2 bg-surface p-3 text-sm"
                >
                  <Link href={`/admin/orders/${o.id}`} className="font-mono underline">
                    {o.number}
                  </Link>
                  <span>{orderStatusLabel[o.status]}</span>
                  <span className="font-mono">{formatEuro(o.totalCents)}</span>
                  <span className="text-fg-muted">{formatDate(o.createdAt)}</span>
                  {o.needsAttention ? (
                    <span className="w-full bg-sticker px-2 text-ink">{o.needsAttention}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="open-repairs" className="space-y-3">
          <h2 id="open-repairs" className="font-display text-sm uppercase">
            Open repairs
          </h2>
          {repairs.length === 0 ? (
            <p className="text-sm text-fg-muted">No open repairs.</p>
          ) : (
            <ul className="space-y-2">
              {repairs.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-wrap justify-between gap-2 bg-surface p-3 text-sm"
                >
                  <Link href={`/admin/repairs/${r.id}`} className="font-mono underline">
                    {r.number}
                  </Link>
                  <span>{r.deviceName}</span>
                  <span>{repairStatusLabel[r.status]}</span>
                  <span className="text-fg-muted">{formatDate(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
