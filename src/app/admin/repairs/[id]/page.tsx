import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { FinalPriceForm, NoteForm, RepairStatusForm } from '@/components/admin/RepairAdminForms'
import { EstimateText } from '@/components/repairs/Estimate'
import { RepairTimeline } from '@/components/repairs/RepairTimeline'
import { LoadingState } from '@/components/retro/LoadingState'
import { formatDate } from '@/lib/format'
import { getShopStore, requireAdmin } from '@/lib/shop'
import { deliveryLabel } from '@/lib/shop/types'

export const metadata = { title: 'Repair' }

export default function AdminRepair(props: PageProps<'/admin/repairs/[id]'>) {
  return (
    <Suspense fallback={<LoadingState />}>
      <Body {...props} />
    </Suspense>
  )
}

async function Body({ params }: PageProps<'/admin/repairs/[id]'>) {
  const { id } = await params
  await requireAdmin(`/admin/repairs/${id}`)
  const store = getShopStore()
  const r = await store.getRepair(id)
  if (!r) notFound()
  const notes = await store.listRepairNotes(r.id)
  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-lg">REPAIR {r.number}</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="req" className="space-y-1 bg-surface p-5 text-sm">
          <h2 id="req" className="font-display text-sm uppercase">
            Request
          </h2>
          <p>
            <strong>
              {r.deviceName} · {r.issueName}
            </strong>
          </p>
          {r.brand || r.model || r.serial ? (
            <p>{[r.brand, r.model, r.serial && `S/N ${r.serial}`].filter(Boolean).join(' · ')}</p>
          ) : null}
          <p className="whitespace-pre-line">{r.description}</p>
          <p>
            Delivery: {deliveryLabel[r.delivery]}
            {r.preferredDate ? ` · preferred ${r.preferredDate}` : ''}
          </p>
          <p>Received: {formatDate(r.createdAt)}</p>
          <p>
            <EstimateText estimate={r.estimate} />
          </p>
        </section>
        <section aria-labelledby="cust" className="space-y-1 bg-surface p-5 text-sm">
          <h2 id="cust" className="font-display text-sm uppercase">
            Customer
          </h2>
          <p>{r.name}</p>
          <p>
            <a href={`mailto:${r.email}`} className="underline">
              {r.email}
            </a>
          </p>
          <p>
            <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="underline">
              {r.phone}
            </a>
          </p>
        </section>
      </div>

      {r.photoPaths.length > 0 ? (
        <section aria-labelledby="photos" className="space-y-2">
          <h2 id="photos" className="font-display text-sm uppercase">
            Photos
          </h2>
          <ul className="flex flex-wrap gap-3">
            {r.photoPaths.map((path, i) => (
              <li key={path}>
                <a
                  href={`/admin/repairs/photo?path=${encodeURIComponent(path)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- private, admin-only */}
                  <img
                    src={`/admin/repairs/photo?path=${encodeURIComponent(path)}`}
                    alt={`Customer photo ${i + 1}`}
                    className="size-32 object-cover"
                  />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="status" className="space-y-3 bg-surface p-5">
          <h2 id="status" className="font-display text-sm uppercase">
            Status
          </h2>
          <RepairStatusForm id={r.id} status={r.status} />
          <FinalPriceForm id={r.id} cents={r.finalPriceCents} />
        </section>
        <section aria-labelledby="notes" className="space-y-3 bg-surface p-5">
          <h2 id="notes" className="font-display text-sm uppercase">
            Internal notes
          </h2>
          <NoteForm id={r.id} />
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="bg-surface-2 p-3 text-sm">
                <p className="text-xs text-fg-muted">
                  {n.author} · {formatDate(n.createdAt)}
                </p>
                <p className="whitespace-pre-line">{n.body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="history" className="space-y-3">
        <h2 id="history" className="font-display text-sm uppercase">
          Customer-visible history
        </h2>
        <RepairTimeline status={r.status} events={r.events} />
      </section>
    </div>
  )
}
