import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  ChartFrame,
  HBars,
  PlatformLegend,
  SimpleTable,
  YearAxis,
  YearBars,
} from '@/components/stats/Charts'
import { EmptyState } from '@/components/retro/EmptyState'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { PixelProgress } from '@/components/retro/PixelProgress'
import { requireUser } from '@/lib/backend'
import { computeStats, type Completion } from '@/lib/backend/stats'
import { playStatusLabel, PLAY_STATUSES } from '@/lib/backend/types'
import { collectionValue } from '@/lib/backend/value'
import { getAllGames, getFacets, getPriceIndex } from '@/lib/catalog'
import { formatEuro } from '@/lib/format'

export const metadata: Metadata = { title: 'Stats', robots: { index: false } }

export default function StatsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">COLLECTION STATS</h1>
        <Link
          href="/achievements"
          className="inline-flex min-h-11 items-center font-display text-xs text-fg-muted uppercase hover:text-fg"
        >
          Achievements →
        </Link>
      </div>
      <Suspense fallback={<LoadingState label="Crunching numbers" />}>
        <StatsBody />
      </Suspense>
    </div>
  )
}

const pct = (c: Completion) => (c.total ? Math.round((c.owned / c.total) * 100) : 0)
const completionRows = (list: Completion[]) =>
  list.map((c) => [c.label, c.owned, c.total, `${pct(c)}%`])

async function StatsBody() {
  const { store } = await requireUser('/stats')
  const [items, plays, games, facets, prices] = await Promise.all([
    store.listCollection(),
    store.listPlayLogs(),
    getAllGames(),
    getFacets(),
    getPriceIndex(),
  ])

  if (items.length === 0 && plays.length === 0) {
    return (
      <EmptyState
        title="NO DATA ON THIS SAVE FILE"
        description={<p>Add a few cartridges and your stats appear here.</p>}
        action={
          <PixelButton href="/games" variant="screen">
            Add your first cartridge →
          </PixelButton>
        }
      />
    )
  }

  const s = computeStats(items, plays, games, facets)
  const value = collectionValue(items, prices)
  const cibPct = s.copies ? Math.round((s.cibCopies / s.copies) * 100) : 0

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Games owned" value={String(s.ownedGames)} />
        <Tile
          label="Copies"
          value={String(s.copies)}
          sub={`${s.cibCopies} complete in box (${cibPct}%)`}
        />
        <Tile
          label="Estimated value"
          value={formatEuro(value.totalCents) ?? '€0'}
          sub={[
            value.demo ? 'Demo prices — not real market data' : 'Estimate — not a quote',
            value.unpricedCount ? `${value.unpricedCount} without price data` : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        />
        <Tile
          label="You paid"
          value={formatEuro(value.paidCents) ?? '€0'}
          sub="Sum of purchase prices you entered"
        />
      </dl>

      <section aria-labelledby="completion-title" className="space-y-5 rounded-sm bg-surface p-5">
        <h2 id="completion-title" className="font-display text-sm uppercase">
          Completion
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {s.platform.map((c) => (
            <PixelProgress
              key={c.key}
              label={c.label}
              value={c.owned}
              max={c.total}
              tone={c.key === 'gbc' ? 'gbc' : 'gb'}
            />
          ))}
        </div>
        <h3 className="pt-2 font-display text-xs text-fg-muted uppercase">Per region</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          {s.region.map((c) => (
            <PixelProgress key={c.key} label={c.label} value={c.owned} max={c.total} blocks={12} />
          ))}
        </div>
        <h3 className="pt-2 font-display text-xs text-fg-muted uppercase">Per genre</h3>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.genre.map((c) => (
            <PixelProgress key={c.key} label={c.label} value={c.owned} max={c.total} blocks={10} />
          ))}
        </div>
      </section>

      <ChartFrame
        id="years-title"
        title="Owned games per release year"
        legend={<PlatformLegend />}
        table={
          <SimpleTable
            head={['Year', 'Game Boy', 'Game Boy Color', 'Total']}
            rows={s.years.map((y) => [y.year, y.gb, y.gbc, y.gb + y.gbc])}
          />
        }
      >
        <YearBars years={s.years} />
        <YearAxis years={s.years} />
      </ChartFrame>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartFrame
          id="publishers-title"
          title="Top publishers"
          table={
            <SimpleTable
              head={['Publisher', 'Games']}
              rows={s.publishers.map((p) => [p.label, p.count])}
            />
          }
        >
          <HBars rows={s.publishers.map((p) => ({ label: p.label, count: p.count }))} />
        </ChartFrame>
        <ChartFrame
          id="play-title"
          title="Play status"
          table={
            <SimpleTable
              head={['Status', 'Games']}
              rows={PLAY_STATUSES.map((p) => [playStatusLabel[p], s.play[p]])}
            />
          }
        >
          <HBars
            rows={PLAY_STATUSES.map((p) => ({ label: playStatusLabel[p], count: s.play[p] }))}
          />
        </ChartFrame>
      </div>

      <details className="rounded-sm bg-surface p-5 text-sm">
        <summary className="min-h-11 cursor-pointer content-center font-display text-xs uppercase">
          Completion as tables
        </summary>
        <div className="mt-3 grid gap-6 lg:grid-cols-3">
          <SimpleTable
            head={['Platform', 'Owned', 'Total', '%']}
            rows={completionRows(s.platform)}
          />
          <SimpleTable head={['Region', 'Owned', 'Total', '%']} rows={completionRows(s.region)} />
          <SimpleTable head={['Genre', 'Owned', 'Total', '%']} rows={completionRows(s.genre)} />
        </div>
      </details>
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="font-display text-xs text-fg-muted uppercase">{label}</dt>
      <dd className="mt-1 font-pixel text-base sm:text-lg">{value}</dd>
      {sub ? <dd className="mt-1 text-xs text-fg-muted">{sub}</dd> : null}
    </div>
  )
}
