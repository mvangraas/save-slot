import type { NewsSourceConfig } from '@/config/news-sources'
import type { ParsedNewsItem } from './parse'

export type NewsItem = {
  id: string
  title: string
  url: string
  excerpt: string | null
  publishedAt: string | null
  fetchedAt: string
  source: { name: string; siteUrl: string }
}

export interface NewsStore {
  /** Inserts or updates the configured sources; returns their ids by slug. */
  upsertSources(sources: NewsSourceConfig[]): Promise<Map<string, string>>
  /** Upserts by URL; returns how many rows were written. */
  upsertItems(sourceId: string, items: ParsedNewsItem[], fetchedAt: string): Promise<number>
  latest(limit: number): Promise<NewsItem[]>
}

/** In-process store for local development and e2e (no Supabase). */
type MemoryState = {
  sources: Map<string, { id: string; cfg: NewsSourceConfig }>
  items: Map<string, NewsItem & { sourceId: string }>
}
const g = globalThis as unknown as { __saveslotNews?: MemoryState }
const mem: MemoryState = (g.__saveslotNews ??= { sources: new Map(), items: new Map() })

export const memoryNewsStore: NewsStore = {
  async upsertSources(sources) {
    const ids = new Map<string, string>()
    for (const cfg of sources) {
      const row = mem.sources.get(cfg.slug) ?? { id: `news:${cfg.slug}`, cfg }
      row.cfg = cfg
      mem.sources.set(cfg.slug, row)
      ids.set(cfg.slug, row.id)
    }
    return ids
  },
  async upsertItems(sourceId, items, fetchedAt) {
    const src = [...mem.sources.values()].find((s) => s.id === sourceId)
    if (!src) return 0
    for (const it of items) {
      const prev = mem.items.get(it.url)
      mem.items.set(it.url, {
        id: prev?.id ?? `item:${mem.items.size + 1}`,
        ...it,
        fetchedAt,
        sourceId,
        source: { name: src.cfg.name, siteUrl: src.cfg.siteUrl },
      })
    }
    return items.length
  },
  async latest(limit) {
    return [...mem.items.values()]
      .sort((a, b) => (b.publishedAt ?? b.fetchedAt).localeCompare(a.publishedAt ?? a.fetchedAt))
      .slice(0, limit)
      .map(({ sourceId: _s, ...rest }) => (void _s, rest))
  },
}

export function resetMemoryNews() {
  mem.sources.clear()
  mem.items.clear()
}
