import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { createSupabasePublicClient } from '@/lib/supabase/public'
import { seedCatalog } from './seed-provider'
import { createSupabaseCatalog } from './supabase-provider'
import type { CatalogProvider, GameQuery } from './types'

/** Supabase when configured, otherwise the in-memory seed catalogue. */
export function getCatalog(): CatalogProvider {
  const db = createSupabasePublicClient()
  return db ? createSupabaseCatalog(db) : seedCatalog
}

// Cached, public catalogue reads. No cookies → safe to share between all visitors.
// Per-user flags (owned / wishlisted) are added on top in later phases.

export async function searchGames(query: GameQuery) {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog')
  return getCatalog().search(query)
}

export async function getFacets() {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog')
  return getCatalog().facets()
}

export async function getGame(slug: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog', `game:${slug}`)
  return getCatalog().getGame(slug)
}

export async function listGameSlugs() {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog')
  return getCatalog().listSlugs()
}

export async function suggestGames(q: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog')
  return getCatalog().suggest(q, 6)
}

export async function getAllGames() {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog')
  return getCatalog().allGames()
}

export async function getPriceIndex() {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog', 'prices')
  return getCatalog().priceIndex()
}

export async function getSourceCounts() {
  'use cache'
  cacheLife('hours')
  cacheTag('catalog')
  return getCatalog().sourceCounts()
}
