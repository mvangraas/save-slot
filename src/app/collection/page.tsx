import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { GameGrid } from '@/components/catalog/GameGrid'
import { CartridgeShelf } from '@/components/retro/CartridgeShelf'
import { EmptyState } from '@/components/retro/EmptyState'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { PixelProgress } from '@/components/retro/PixelProgress'
import { PlatformBadge } from '@/components/retro/PlatformBadge'
import { requireUser } from '@/lib/backend'
import { groupByGame, ownedPerPlatform, type OwnedGame } from '@/lib/backend/collection'
import type { CollectionItem, PlayEntry } from '@/lib/backend/types'
import { getFacets, getPriceIndex } from '@/lib/catalog'
import { itemValue } from '@/lib/backend/value'
import { CopiesTable } from '@/components/collection/CopiesTable'
import type { GameSummary } from '@/lib/catalog/types'
import { cn } from '@/lib/cn'

export const metadata: Metadata = { title: 'My collection', robots: { index: false } }

const TABS = [
  ['all', 'All'],
  ['gb', 'GB'],
  ['gbc', 'GBC'],
  ['playing', 'Playing'],
  ['completed', 'Completed'],
] as const
type Tab = (typeof TABS)[number][0]
const VIEWS = [
  ['shelf', 'Shelf'],
  ['grid', 'Grid'],
  ['table', 'Table'],
] as const
type View = (typeof VIEWS)[number][0]

export default function CollectionPage({ searchParams }: PageProps<'/collection'>) {
  return (
    <div className="space-y-8">
      <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">MY COLLECTION</h1>
      <Suspense fallback={<LoadingState label="Loading save file" />}>
        <CollectionBody searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

const href = (tab: Tab, view: View) => {
  const p = new URLSearchParams()
  if (tab !== 'all') p.set('tab', tab)
  if (view !== 'shelf') p.set('view', view)
  const s = p.toString()
  return s ? `/collection?${s}` : '/collection'
}

async function CollectionBody({
  searchParams,
}: {
  searchParams: PageProps<'/collection'>['searchParams']
}) {
  const params = await searchParams
  const tab = (TABS.find(([t]) => t === params.tab)?.[0] ?? 'all') as Tab
  const view = (VIEWS.find(([v]) => v === params.view)?.[0] ?? 'shelf') as View

  const { store } = await requireUser(href(tab, view))
  const [items, plays, facets, prices] = await Promise.all([
    store.listCollection(),
    store.listPlayLogs(),
    getFacets(),
    getPriceIndex(),
  ])
  const values = Object.fromEntries(items.map((i) => [i.id, itemValue(i, prices)]))
  const owned = groupByGame(items)
  const perPlatform = ownedPerPlatform(owned)

  if (items.length === 0 && plays.length === 0) {
    return (
      <EmptyState
        title="NO DATA ON THIS SAVE FILE"
        description={<p>Find a game and add your first cartridge.</p>}
        action={
          <PixelButton href="/games" variant="screen">
            Add your first cartridge →
          </PixelButton>
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      <section
        aria-label="Completion"
        className="grid gap-5 rounded-sm bg-surface p-5 sm:grid-cols-2"
      >
        <PixelProgress
          label="Game Boy"
          value={perPlatform.gb}
          max={facets.platformCounts.gb}
          tone="gb"
        />
        <PixelProgress
          label="Game Boy Color"
          value={perPlatform.gbc}
          max={facets.platformCounts.gbc}
          tone="gbc"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Collection filter" className="flex flex-wrap gap-1">
          {TABS.map(([t, label]) => (
            <Link
              key={t}
              href={href(t, view)}
              aria-current={tab === t ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center px-3 font-display text-sm uppercase',
                tab === t ? 'bg-lcd-200 text-lcd-900' : 'bg-surface-2 text-fg-muted hover:text-fg',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-1">
          {tab !== 'playing' && tab !== 'completed'
            ? VIEWS.map(([v, label]) => (
                <Link
                  key={v}
                  href={href(tab, v)}
                  aria-current={view === v ? 'true' : undefined}
                  className={cn(
                    'inline-flex min-h-11 items-center px-3 font-display text-xs uppercase',
                    view === v
                      ? 'bg-lcd-200 text-lcd-900'
                      : 'bg-surface-2 text-fg-muted hover:text-fg',
                  )}
                >
                  {label}
                </Link>
              ))
            : null}
          <a
            href="/collection/export"
            className="inline-flex min-h-11 items-center px-3 font-display text-xs text-fg-muted uppercase underline hover:text-fg"
          >
            Export CSV
          </a>
        </div>
      </div>

      {tab === 'playing' || tab === 'completed' ? (
        <PlayList entries={plays.filter((p) => p.status === tab)} tab={tab} />
      ) : (
        <OwnedView
          games={tab === 'all' ? owned : owned.filter((g) => g.platform === tab)}
          items={tab === 'all' ? items : items.filter((i) => i.platform === tab)}
          view={view}
          tab={tab}
          values={values}
        />
      )}
    </div>
  )
}

function OwnedView({
  games,
  items,
  view,
  tab,
  values,
}: {
  games: OwnedGame[]
  items: CollectionItem[]
  view: View
  tab: Tab
  values: Record<string, number | null>
}) {
  if (games.length === 0) {
    return (
      <EmptyState
        tone={tab === 'gbc' ? 'gbc' : 'gb'}
        title="THIS SHELF IS EMPTY"
        action={
          <PixelButton
            href={tab === 'gbc' ? '/gbc' : tab === 'gb' ? '/gb' : '/games'}
            variant="screen"
          >
            Browse games
          </PixelButton>
        }
      />
    )
  }
  if (view === 'table') return <CopiesTable items={items} values={values} />
  if (view === 'grid') return <GameGrid items={games.map(toSummary)} />

  const byPlatform = (['gb', 'gbc'] as const)
    .map((p) => ({ p, list: games.filter((g) => g.platform === p) }))
    .filter((x) => x.list.length > 0)
  return (
    <div className="space-y-8">
      {byPlatform.map(({ p, list }) => (
        <section key={p} aria-labelledby={`shelf-${p}`} className="space-y-3">
          <h2 id={`shelf-${p}`} className="flex items-center gap-2 font-pixel text-xs">
            <PlatformBadge platform={p} /> {p === 'gb' ? 'GAME BOY' : 'GAME BOY COLOR'} ·{' '}
            {list.length}
          </h2>
          <CartridgeShelf
            label={p === 'gb' ? 'Game Boy shelf' : 'Game Boy Color shelf'}
            games={list.map((g) => ({
              key: g.gameId,
              slug: g.slug,
              title: g.title,
              compat: g.compat,
              year: g.firstReleaseYear,
            }))}
          />
        </section>
      ))}
    </div>
  )
}

const toSummary = (g: OwnedGame): GameSummary => ({
  id: g.gameId,
  slug: g.slug,
  title: g.title,
  platform: g.platform,
  compat: g.compat,
  firstReleaseYear: g.firstReleaseYear,
  regions: g.regions,
  developerName: null,
  publisherNames: [],
  genreNames: [],
  coverUrl: null,
  owned: true,
  wishlisted: false,
})

function PlayList({ entries, tab }: { entries: PlayEntry[]; tab: 'playing' | 'completed' }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title={tab === 'playing' ? 'NOTHING IN THE SLOT' : 'NO CREDITS ROLLED YET'}
        description={<p>Set a play status on any game page.</p>}
      />
    )
  }
  return (
    <CartridgeShelf
      label={tab === 'playing' ? 'Currently playing' : 'Completed games'}
      games={entries.map((e) => ({
        key: e.gameId,
        slug: e.gameSlug,
        title: e.gameTitle,
        compat: e.compat,
        year: e.firstReleaseYear,
      }))}
    />
  )
}
