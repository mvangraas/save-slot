import { connection } from 'next/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { EstimateText } from '@/components/repairs/Estimate'
import { RepairTimeline } from '@/components/repairs/RepairTimeline'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { LoadingState } from '@/components/retro/LoadingState'
import { formatEuro } from '@/lib/format'
import { getShopStore } from '@/lib/shop'
import { deliveryLabel } from '@/lib/shop/types'
import { hashToken, isReference } from '@/lib/shop/util'

export const metadata: Metadata = { title: 'Your repair', robots: { index: false } }

export default function RepairStatusPage(props: PageProps<'/repairs/status/[number]'>) {
  return (
    <Suspense fallback={<LoadingState label="Checking your repair" />}>
      <Body {...props} />
    </Suspense>
  )
}

async function Body({ params, searchParams }: PageProps<'/repairs/status/[number]'>) {
  await connection()
  const { number } = await params
  const sp = await searchParams
  const token = typeof sp.t === 'string' ? sp.t : ''
  if (!isReference('RS', number) || !token) notFound()
  const r = await getShopStore().getRepairByNumber(number)
  if (!r || r.tokenHash !== hashToken(token)) notFound()
  const isNew = sp.new === '1'

  return (
    <div className="space-y-8">
      <LcdPanel as="section" aria-labelledby="repair-title" screenClassName="text-center">
        <h1 id="repair-title" className="font-pixel text-base leading-relaxed">
          {isNew ? 'REQUEST RECEIVED' : 'YOUR REPAIR'}
        </h1>
        <p className="mt-3 text-sm">Your repair number</p>
        <p className="mt-1 font-pixel text-lg">{r.number}</p>
        <p className="mt-3 text-xs">
          Save this number (or bookmark this page). With it and your e-mail address you can follow
          the status at{' '}
          <Link href="/repairs/status" className="underline">
            Track your repair
          </Link>
          .
        </p>
      </LcdPanel>

      <section aria-labelledby="details-title" className="space-y-2 bg-surface p-5 text-sm">
        <h2 id="details-title" className="font-display text-sm uppercase">
          {r.deviceName} · {r.issueName}
        </h2>
        <p>{r.description}</p>
        <p>
          <strong>Delivery:</strong> {deliveryLabel[r.delivery]}
          {r.preferredDate ? ` · preferred date ${r.preferredDate}` : ''}
        </p>
        <p>
          {r.finalPriceCents !== null ? (
            <>
              <strong>Final price:</strong> {formatEuro(r.finalPriceCents)}
            </>
          ) : (
            <EstimateText estimate={r.estimate} />
          )}
        </p>
        <p className="text-xs text-fg-muted">
          An indication is not a quote. We confirm the final price with you before repairing, and
          you never pay before you agree.
        </p>
      </section>

      <section aria-labelledby="progress-title" className="space-y-3">
        <h2 id="progress-title" className="font-display text-sm uppercase">
          Progress
        </h2>
        <RepairTimeline status={r.status} events={r.events} />
      </section>
    </div>
  )
}
