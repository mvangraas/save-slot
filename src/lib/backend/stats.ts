import type { Facets, GameSummary } from '@/lib/catalog/types'
import type { Platform, Region } from '@/lib/types'
import { groupByGame } from './collection'
import type { CollectionItem, PlayEntry, PlayStatus } from './types'

export type Completion = { key: string; label: string; owned: number; total: number }
export type YearBucket = { year: number; gb: number; gbc: number }
export type Count = { label: string; count: number }

export type CollectionStats = {
  ownedGames: number
  copies: number
  cibCopies: number
  platform: Completion[]
  region: Completion[]
  genre: Completion[]
  years: YearBucket[]
  publishers: Count[]
  play: Record<PlayStatus, number>
}

const regionNames: Record<Region, string> = { eu: 'Europe', us: 'North America', jp: 'Japan' }

/**
 * Master prompt §9 completion: owned games / total games in a scope.
 * Region scope only counts copies of a release from that region.
 */
export function computeStats(
  items: CollectionItem[],
  plays: PlayEntry[],
  catalogue: GameSummary[],
  facets: Facets,
): CollectionStats {
  const owned = groupByGame(items)
  const ownedSlugs = new Set(owned.map((g) => g.slug))
  const bySlug = new Map(catalogue.map((g) => [g.slug, g]))

  const platform: Completion[] = (['gb', 'gbc'] as Platform[]).map((p) => ({
    key: p,
    label: p === 'gb' ? 'Game Boy' : 'Game Boy Color',
    owned: owned.filter((g) => g.platform === p).length,
    total: facets.platformCounts[p],
  }))

  const region: Completion[] = (['eu', 'us', 'jp'] as Region[]).map((r) => ({
    key: r,
    label: regionNames[r],
    owned: new Set(items.filter((i) => i.region === r).map((i) => i.gameSlug)).size,
    total: facets.regionCounts[r],
  }))

  const genre: Completion[] = facets.genres
    .map((ge) => ({
      key: ge.slug,
      label: ge.name,
      owned: [...ownedSlugs].filter((s) => bySlug.get(s)?.genreNames.includes(ge.name)).length,
      total: ge.count,
    }))
    .sort((a, b) => b.owned / b.total - a.owned / a.total || a.label.localeCompare(b.label))

  const yearMap = new Map<number, YearBucket>()
  for (let y = facets.yearMin ?? 1989; y <= (facets.yearMax ?? 2003); y++)
    yearMap.set(y, { year: y, gb: 0, gbc: 0 })
  for (const g of owned) {
    if (g.firstReleaseYear == null) continue
    const b = yearMap.get(g.firstReleaseYear) ?? { year: g.firstReleaseYear, gb: 0, gbc: 0 }
    b[g.platform]++
    yearMap.set(g.firstReleaseYear, b)
  }

  const pubCounts = new Map<string, number>()
  for (const s of ownedSlugs)
    for (const p of bySlug.get(s)?.publisherNames ?? [])
      pubCounts.set(p, (pubCounts.get(p) ?? 0) + 1)
  const publishers = [...pubCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 10)

  const play: Record<PlayStatus, number> = { backlog: 0, playing: 0, completed: 0, abandoned: 0 }
  for (const p of plays) play[p.status]++

  return {
    ownedGames: owned.length,
    copies: items.length,
    cibCopies: items.filter((i) => i.hasCart && i.hasBox && i.hasManual).length,
    platform,
    region,
    genre,
    years: [...yearMap.values()].sort((a, b) => a.year - b.year),
    publishers,
    play,
  }
}
