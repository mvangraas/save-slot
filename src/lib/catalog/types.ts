import type { CartCompat, Platform, Region } from '@/lib/types'

export const GAME_SORTS = [
  'title',
  'title_desc',
  'year_asc',
  'year_desc',
  'recent',
  'relevance',
] as const
export type GameSort = (typeof GAME_SORTS)[number]

export const GAME_FEATURES = [
  'sgb_enhanced',
  'rumble',
  'infrared',
  'link_cable',
  'battery_save',
] as const
export type GameFeature = (typeof GAME_FEATURES)[number]

export const featureLabel: Record<GameFeature, string> = {
  sgb_enhanced: 'Super Game Boy enhanced',
  rumble: 'Rumble',
  infrared: 'Infrared',
  link_cable: 'Link cable',
  battery_save: 'Battery save',
}

export const sortLabel: Record<GameSort, string> = {
  title: 'Title A–Z',
  title_desc: 'Title Z–A',
  year_asc: 'Oldest first',
  year_desc: 'Newest first',
  recent: 'Recently added',
  relevance: 'Best match',
}

export type GameFilters = {
  platform?: Platform
  compat?: CartCompat[]
  regions?: Region[]
  genres?: string[]
  yearFrom?: number
  yearTo?: number
  publisher?: string
  developer?: string
  series?: string
  features?: GameFeature[]
}

export type GameQuery = {
  q?: string
  filters: GameFilters
  sort: GameSort
  page: number
  pageSize: number
}

export type GameSummary = {
  id: string
  slug: string
  title: string
  platform: Platform
  compat: CartCompat
  firstReleaseYear: number | null
  regions: Region[]
  developerName: string | null
  publisherNames: string[]
  genreNames: string[]
  coverUrl: string | null
  owned: boolean
  wishlisted: boolean
}

export type SearchResult = {
  items: GameSummary[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export type Facet = { slug: string; name: string; count: number }

export type Facets = {
  genres: Facet[]
  publishers: Facet[]
  developers: Facet[]
  series: Facet[]
  yearMin: number | null
  yearMax: number | null
  platformCounts: Record<Platform, number>
  regionCounts: Record<Region, number>
}

export type PriceGrade = 'loose' | 'cib' | 'new'

/** Latest estimate per grade for one release, in euro cents. */
export type ReleasePrices = {
  gameId: string
  region: Region
  loose: number | null
  cib: number | null
  new: number | null
  source: string
  observedAt: string
}

/** releaseId → prices */
export type PriceIndex = Record<string, ReleasePrices>

export type Named = { slug: string; name: string }

export type ReleaseDetail = {
  id: string
  region: Region
  localTitle: string | null
  releaseDate: string | null
  releaseDatePrecision: 'day' | 'month' | 'year' | null
  productCode: string | null
  publisher: Named | null
}

export type MediaAsset = {
  id: string
  kind: 'boxart_front' | 'boxart_back' | 'cartridge' | 'manual' | 'screenshot' | 'title_screen'
  url: string
  width: number | null
  height: number | null
  license: string
  attribution: string
  sourceUrl: string | null
}

export type GameDetail = {
  id: string
  slug: string
  title: string
  platform: Platform
  compat: CartCompat
  description: string | null
  firstReleaseYear: number | null
  regions: Region[]
  playersMin: number | null
  playersMax: number | null
  /** Only features verified as present. Unknown features are left out. */
  features: GameFeature[]
  series: Named | null
  developer: Named | null
  genres: Named[]
  releases: ReleaseDetail[]
  media: MediaAsset[]
  source: string
}

export type Suggestion = { slug: string; title: string; platform: Platform; year: number | null }

export interface CatalogProvider {
  readonly name: 'supabase' | 'seed'
  search(query: GameQuery): Promise<SearchResult>
  facets(): Promise<Facets>
  getGame(slug: string): Promise<GameDetail | null>
  listSlugs(): Promise<string[]>
  suggest(q: string, limit: number): Promise<Suggestion[]>
  /** Every game as a summary (for stats). */
  allGames(): Promise<GameSummary[]>
  priceIndex(): Promise<PriceIndex>
}
