import { Suspense } from 'react'
import { RepairPriceForm } from '@/components/admin/RepairPriceForm'
import { LoadingState } from '@/components/retro/LoadingState'
import { getShopStore, requireAdmin } from '@/lib/shop'

export const metadata = { title: 'Repair prices' }

export default function AdminRepairPrices() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Body />
    </Suspense>
  )
}

async function Body() {
  await requireAdmin('/admin/repair-prices')
  const catalog = await getShopStore().repairCatalog()
  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-lg">REPAIR PRICES</h1>
      <p className="max-w-prose text-sm text-fg-muted">
        Indications shown to customers before they send a request. Leave a cell empty for “on
        request”. These are never final prices: set the final price per repair after inspection.
      </p>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <caption className="sr-only">Repair price indications</caption>
          <thead className="font-display text-xs uppercase">
            <tr className="border-b border-line">
              <th scope="col" className="py-2 pr-3">
                Problem
              </th>
              {catalog.devices.map((d) => (
                <th key={d.id} scope="col" className="py-2 pr-3">
                  {d.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalog.issues.map((i) => (
              <tr key={i.id} className="border-b border-line/50 align-top">
                <th scope="row" className="py-2 pr-3 font-normal">
                  {i.name}
                </th>
                {catalog.devices.map((d) => (
                  <td key={d.id} className="py-2 pr-3">
                    <RepairPriceForm
                      deviceId={d.id}
                      issueId={i.id}
                      label={`${d.name}, ${i.name}`}
                      price={catalog.prices.find((p) => p.deviceId === d.id && p.issueId === i.id)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
