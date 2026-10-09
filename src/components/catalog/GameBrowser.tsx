import { EmptyState } from '@/components/retro/EmptyState'
import { PixelButton } from '@/components/retro/PixelButton'
import { getFacets, searchGames } from '@/lib/catalog'
import { hasActiveFilters, parseGameQuery, serializeGameQuery } from '@/lib/catalog/params'
import type { Platform } from '@/lib/types'
import { ActiveFilters } from './ActiveFilters'
import { FilterForm } from './FilterForm'
import { GameGrid, GameGridSkeleton } from './GameGrid'
import { GameList } from './GameList'
import { Pagination } from './Pagination'

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
  basePath: string
  presetPlatform?: Platform
}

/** Search + filters + results. Reads searchParams, so render it inside <Suspense>. */
export async function GameBrowser({ searchParams, basePath, presetPlatform }: Props) {
  const params = await searchParams
  const query = parseGameQuery(params, { platform: presetPlatform })
  const view = params.view === 'list' ? 'list' : 'grid'
  const [facets, result] = await Promise.all([getFacets(), searchGames(query)])
  const filtersActive = hasActiveFilters(query.filters, { ignorePlatform: !!presetPlatform })
  const formKey = serializeGameQuery(query).toString() + view

  return (
    <div className="space-y-6">
      <FilterForm
        key={formKey}
        basePath={basePath}
        query={query}
        facets={facets}
        view={view}
        presetPlatform={presetPlatform}
        filtersOpen={filtersActive}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="font-pixel text-xs">
          {result.total} {result.total === 1 ? 'GAME' : 'GAMES'}
          {result.pageCount > 1 ? (
            <span className="ml-2 font-display text-fg-muted">
              · page {result.page} of {result.pageCount}
            </span>
          ) : null}
        </p>
      </div>
      <ActiveFilters
        basePath={basePath}
        query={query}
        facets={facets}
        presetPlatform={!!presetPlatform}
      />

      {result.items.length === 0 ? (
        <EmptyState
          tone={presetPlatform ?? 'gb'}
          title="NO GAMES FOUND"
          description={<p>Try fewer filters or a different spelling.</p>}
          action={
            <PixelButton href={basePath} variant="screen">
              Clear search
            </PixelButton>
          }
        />
      ) : view === 'list' ? (
        <GameList items={result.items} />
      ) : (
        <GameGrid items={result.items} />
      )}

      <Pagination
        basePath={basePath}
        query={query}
        pageCount={result.pageCount}
        omitPlatform={!!presetPlatform}
        extra={view === 'list' ? { view: 'list' } : undefined}
      />
    </div>
  )
}

export function GameBrowserSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-12 animate-pulse bg-surface-2" />
      <div className="h-11 animate-pulse bg-surface" />
      <GameGridSkeleton />
    </div>
  )
}
