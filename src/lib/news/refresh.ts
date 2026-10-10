import type { NewsSourceConfig } from '@/config/news-sources'
import type { NewsProvider } from '@/lib/providers/types'
import type { NewsStore } from './store'

export type SourceReport = {
  source: string
  ok: boolean
  stored: number
  error?: string
}

/**
 * Fetches every enabled source and stores its items. One broken feed never stops the others:
 * each source is fetched and stored inside its own try/catch, with the provider's timeout.
 */
export async function refreshNews(
  sources: NewsSourceConfig[],
  provider: NewsProvider,
  store: NewsStore,
  now = new Date(),
): Promise<SourceReport[]> {
  const enabled = sources.filter((s) => s.enabled)
  const ids = await store.upsertSources(sources)
  const fetchedAt = now.toISOString()
  return Promise.all(
    enabled.map(async (source): Promise<SourceReport> => {
      try {
        const items = await provider.fetchFeed(source)
        const stored = await store.upsertItems(ids.get(source.slug)!, items, fetchedAt)
        return { source: source.slug, ok: true, stored }
      } catch (error) {
        return {
          source: source.slug,
          ok: false,
          stored: 0,
          error: error instanceof Error ? error.message.slice(0, 200) : 'unknown error',
        }
      }
    }),
  )
}
