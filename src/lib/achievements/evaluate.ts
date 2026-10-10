import type { CartCompat, Platform, Region } from '@/lib/types'
import type { AchievementCode } from './definitions'

/**
 * Pure achievement rules. The memory backend feeds them from its own data; Supabase runs the
 * same rules in SQL (`public.fn_evaluate_achievements`). Keep both in sync.
 */
export type OwnedCopy = {
  gameId: string
  region: Region
  hasCart: boolean
  hasBox: boolean
  hasManual: boolean
  condition: string | null
  purchasePriceCents: number | null
}

export type CatalogGame = {
  id: string
  platform: Platform
  compat: CartCompat
  firstReleaseYear: number | null
  genres: string[]
  series: string | null
  sgbEnhanced: boolean
  rumble: boolean
  /** One entry per release: its region and release year (null when unknown). */
  releases: { region: Region; year: number | null }[]
}

export type AchievementFacts = {
  copies: OwnedCopy[]
  catalog: CatalogGame[]
  playStatuses: string[]
  memoryCount: number
  ratedCount: number
  favoriteCount: number
  wishlistCount: number
  /** Persisted event: a wishlist game was moved into the collection. */
  wishGranted: boolean
}

export function evaluateAchievements(f: AchievementFacts): Set<AchievementCode> {
  const out = new Set<AchievementCode>()
  const give = (code: AchievementCode, cond: boolean) => cond && out.add(code)
  const games = new Map(f.catalog.map((g) => [g.id, g]))

  const ownedIds = new Set(f.copies.map((c) => c.gameId))
  const owned = [...ownedIds].map((id) => games.get(id)).filter((g): g is CatalogGame => !!g)
  const n = ownedIds.size
  const cib = f.copies.filter((c) => c.hasCart && c.hasBox && c.hasManual).length
  const regions = new Set(f.copies.map((c) => c.region))
  const regionsPerGame = new Map<string, Set<Region>>()
  for (const c of f.copies) {
    regionsPerGame.set(c.gameId, (regionsPerGame.get(c.gameId) ?? new Set()).add(c.region))
  }
  const seriesCount = new Map<string, number>()
  for (const g of owned)
    if (g.series) seriesCount.set(g.series, (seriesCount.get(g.series) ?? 0) + 1)
  const completed = f.playStatuses.filter((s) => s === 'completed').length

  give('first_cart', n >= 1)
  give('ten_carts', n >= 10)
  give('twentyfive_carts', n >= 25)
  give('fifty_carts', n >= 50)
  give('cib_first', cib >= 1)
  give('cib_10', cib >= 10)
  give(
    'sealed_first',
    f.copies.some((c) => c.condition === 'sealed'),
  )
  give('price_10', f.copies.filter((c) => c.purchasePriceCents !== null).length >= 10)
  give('gb_10', owned.filter((g) => g.platform === 'gb').length >= 10)
  give('gbc_10', owned.filter((g) => g.platform === 'gbc').length >= 10)
  give(
    'gbc_only_first',
    owned.some((g) => g.compat === 'gbc_only'),
  )
  give('dual_mode_5', owned.filter((g) => g.compat === 'gbc_dual').length >= 5)
  give(
    'launch_year',
    owned.some((g) => g.firstReleaseYear === 1989),
  )
  give('jp_import', regions.has('jp'))
  give('us_import', regions.has('us'))
  give('three_regions', regions.has('eu') && regions.has('us') && regions.has('jp'))
  give(
    'regional_variant',
    [...regionsPerGame.values()].some((s) => s.size >= 2),
  )
  give('year_complete', yearComplete(f.catalog, regionsPerGame))
  give('genres_5', new Set(owned.flatMap((g) => g.genres)).size >= 5)
  give(
    'series_3',
    [...seriesCount.values()].some((v) => v >= 3),
  )
  give('sgb_5', owned.filter((g) => g.sgbEnhanced).length >= 5)
  give(
    'rumble_first',
    owned.some((g) => g.rumble),
  )
  give('completed_first', completed >= 1)
  give('completed_10', completed >= 10)
  give('playing_3', f.playStatuses.filter((s) => s === 'playing').length >= 3)
  give('memory_first', f.memoryCount >= 1)
  give('memory_5', f.memoryCount >= 5)
  give('rated_10', f.ratedCount >= 10)
  give('favorite_first', f.favoriteCount >= 1)
  give('wishlist_first', f.wishlistCount >= 1)
  give('wishlist_granted', f.wishGranted)
  return out
}

/** Every game released in region R in year Y is owned as an R release (for some R, Y). */
function yearComplete(catalog: CatalogGame[], regionsPerGame: Map<string, Set<Region>>): boolean {
  const buckets = new Map<string, Set<string>>()
  for (const g of catalog) {
    for (const r of g.releases) {
      if (r.year === null) continue
      const key = `${r.region}:${r.year}`
      buckets.set(key, (buckets.get(key) ?? new Set()).add(g.id))
    }
  }
  for (const [key, ids] of buckets) {
    const region = key.slice(0, key.indexOf(':')) as Region
    if ([...ids].every((id) => regionsPerGame.get(id)?.has(region))) return true
  }
  return false
}
