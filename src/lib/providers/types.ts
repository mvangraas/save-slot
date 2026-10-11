/**
 * Provider interfaces (master prompt §8). Every external source sits behind one of these so it
 * can be swapped or switched off; the site itself always renders from our own database/seed.
 */
import type { CartCompat, Region } from '@/lib/types'
import type { NewsSourceConfig } from '@/config/news-sources'
import type { ParsedNewsItem } from '@/lib/news/parse'

/** A game as an external catalogue describes it, normalised to our model. */
export type ImportGame = {
  externalId: string
  source: 'igdb'
  title: string
  slug: string
  compat: CartCompat
  description: string | null
  developer: string | null
  publisher: string | null
  genres: string[]
  releases: { region: Region; date: string | null; precision: 'day' | 'month' | 'year' | null }[]
  cover: MediaAsset | null
  /** Fields the importer could not determine reliably; shown for manual review. */
  needsReview: string[]
}

export type MediaAsset = {
  kind: 'boxart_front' | 'screenshot'
  url: string
  width: number | null
  height: number | null
  sourceUrl: string | null
  license: string
  attribution: string
}

export type PriceQuote = {
  grade: 'loose' | 'cib' | 'new'
  valueCents: number
  currency: string
  observedAt: string
}

export interface CatalogImportProvider {
  readonly name: string
  /** Pages through every Game Boy / Game Boy Color game the source knows. */
  listGames(opts: { offset: number; limit: number }): Promise<ImportGame[]>
}

export interface PriceProvider {
  readonly name: string
  /** Prices for one release, looked up by title + platform + region. */
  getPrices(query: { title: string; platform: 'gb' | 'gbc'; region: Region }): Promise<PriceQuote[]>
}

export interface NewsProvider {
  fetchFeed(source: NewsSourceConfig): Promise<ParsedNewsItem[]>
}
