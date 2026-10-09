import Link from 'next/link'
import { hrefFor, serializeGameQuery } from '@/lib/catalog/params'
import { featureLabel, type Facets, type GameFilters, type GameQuery } from '@/lib/catalog/types'
import { compatLabel, platformLabel, regionLabel } from '@/lib/types'

type Chip = { key: string; label: string; next: GameFilters; nextQ?: string | undefined }

function chips(query: GameQuery, facets: Facets, presetPlatform: boolean): Chip[] {
  const f = query.filters
  const name = (list: { slug: string; name: string }[], slug: string) =>
    list.find((x) => x.slug === slug)?.name ?? slug
  const without = <K extends keyof GameFilters>(k: K, value?: unknown): GameFilters => {
    const copy = { ...f }
    const current = copy[k]
    if (Array.isArray(current) && value !== undefined) {
      const rest = current.filter((v) => v !== value)
      ;(copy as Record<string, unknown>)[k] = rest.length ? rest : undefined
    } else {
      delete copy[k]
    }
    return copy
  }
  const out: Chip[] = []
  if (query.q) out.push({ key: 'q', label: `“${query.q}”`, next: f, nextQ: undefined })
  if (f.platform && !presetPlatform)
    out.push({ key: 'platform', label: platformLabel[f.platform], next: without('platform') })
  f.compat?.forEach((c) =>
    out.push({ key: `compat-${c}`, label: compatLabel[c], next: without('compat', c) }),
  )
  f.regions?.forEach((r) =>
    out.push({ key: `region-${r}`, label: regionLabel[r], next: without('regions', r) }),
  )
  f.genres?.forEach((g) =>
    out.push({ key: `genre-${g}`, label: name(facets.genres, g), next: without('genres', g) }),
  )
  if (f.yearFrom) out.push({ key: 'from', label: `From ${f.yearFrom}`, next: without('yearFrom') })
  if (f.yearTo) out.push({ key: 'to', label: `Until ${f.yearTo}`, next: without('yearTo') })
  if (f.publisher)
    out.push({
      key: 'publisher',
      label: `Publisher: ${name(facets.publishers, f.publisher)}`,
      next: without('publisher'),
    })
  if (f.developer)
    out.push({
      key: 'developer',
      label: `Developer: ${name(facets.developers, f.developer)}`,
      next: without('developer'),
    })
  if (f.series)
    out.push({
      key: 'series',
      label: `Series: ${name(facets.series, f.series)}`,
      next: without('series'),
    })
  f.features?.forEach((k) =>
    out.push({ key: `feature-${k}`, label: featureLabel[k], next: without('features', k) }),
  )
  return out
}

export function ActiveFilters({
  basePath,
  query,
  facets,
  presetPlatform = false,
}: {
  basePath: string
  query: GameQuery
  facets: Facets
  presetPlatform?: boolean
}) {
  const list = chips(query, facets, presetPlatform)
  if (list.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters" role="group">
      {list.map((c) => {
        const params = serializeGameQuery(
          { q: 'nextQ' in c ? c.nextQ : query.q, filters: c.next, sort: query.sort },
          { omitPlatform: presetPlatform },
        )
        return (
          <Link
            key={c.key}
            href={hrefFor(basePath, params)}
            className="inline-flex min-h-9 items-center gap-2 rounded-sm bg-surface-2 px-2.5 text-sm hover:bg-surface"
          >
            {c.label}
            <span aria-hidden className="font-display text-xs">
              ✕
            </span>
            <span className="sr-only">(remove filter)</span>
          </Link>
        )
      })}
      <Link
        href={basePath}
        className="inline-flex min-h-9 items-center px-2 text-sm text-fg-muted underline hover:text-fg"
      >
        Clear all
      </Link>
    </div>
  )
}
