import Link from 'next/link'
import { Suspense } from 'react'
import { LoadingState } from '@/components/retro/LoadingState'
import { formatDate } from '@/lib/format'
import { getShopStore, requireAdmin } from '@/lib/shop'
import { repairStatusSchema } from '@/lib/shop/schemas'
import { deliveryLabel, REPAIR_STATUSES, repairStatusLabel } from '@/lib/shop/types'

export const metadata = { title: 'Repairs' }

export default function AdminRepairs(props: PageProps<'/admin/repairs'>) {
  return (
    <Suspense fallback={<LoadingState />}>
      <Body {...props} />
    </Suspense>
  )
}

async function Body({ searchParams }: PageProps<'/admin/repairs'>) {
  await requireAdmin('/admin/repairs')
  const sp = await searchParams
  const status = repairStatusSchema.safeParse(sp.status)
  const open = sp.open === '1'
  const repairs = await getShopStore().listRepairs({
    status: status.success ? status.data : undefined,
    open,
    limit: 200,
  })
  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-lg">REPAIRS</h1>
      <nav aria-label="Filter repairs" className="flex flex-wrap gap-1">
        <Link
          href="/admin/repairs"
          className="bg-surface-2 px-3 py-2 font-display text-xs uppercase"
        >
          All
        </Link>
        <Link
          href="/admin/repairs?open=1"
          className="bg-surface-2 px-3 py-2 font-display text-xs uppercase"
        >
          Open
        </Link>
        {REPAIR_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/repairs?status=${s}`}
            aria-current={status.success && status.data === s ? 'page' : undefined}
            className="bg-surface-2 px-3 py-2 font-display text-xs uppercase aria-[current=page]:bg-lcd-200 aria-[current=page]:text-lcd-900"
          >
            {repairStatusLabel[s]}
          </Link>
        ))}
      </nav>
      {repairs.length === 0 ? (
        <p className="text-fg-muted">No repair requests.</p>
      ) : (
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <caption className="sr-only">Repair requests</caption>
            <thead className="font-display text-xs uppercase">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-3">
                  Number
                </th>
                <th scope="col" className="py-2 pr-3">
                  Received
                </th>
                <th scope="col" className="py-2 pr-3">
                  Device · problem
                </th>
                <th scope="col" className="py-2 pr-3">
                  Delivery
                </th>
                <th scope="col" className="py-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {repairs.map((r) => (
                <tr key={r.id} className="border-b border-line/50">
                  <td className="py-2 pr-3">
                    <Link href={`/admin/repairs/${r.id}`} className="font-mono underline">
                      {r.number}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{formatDate(r.createdAt)}</td>
                  <td className="py-2 pr-3">
                    {r.deviceName} · {r.issueName}
                  </td>
                  <td className="py-2 pr-3">{deliveryLabel[r.delivery]}</td>
                  <td className="py-2">{repairStatusLabel[r.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
