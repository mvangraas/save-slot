import type { NewsSourceConfig } from '@/config/news-sources'
import type { NewsProvider } from '@/lib/providers/types'
import { isGameBoyRelated, parseFeed, type ParsedNewsItem } from './parse'

const TIMEOUT_MS = 10_000
const MAX_BYTES = 2_000_000
const MAX_ITEMS = 30

/** Reads a response body but gives up beyond `max` bytes (feeds are untrusted). */
async function readCapped(res: Response, max: number): Promise<string> {
  if (!res.body) return ''
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > max) {
      await reader.cancel()
      throw new Error(`feed larger than ${max} bytes`)
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

export function rssProvider(fetchImpl: typeof fetch = fetch): NewsProvider {
  return {
    async fetchFeed(source: NewsSourceConfig): Promise<ParsedNewsItem[]> {
      const res = await fetchImpl(source.feedUrl, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          'user-agent': 'SaveSlotNewsBot/1.0 (+https://save-slot-merijn-biz.vercel.app/about)',
          accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
        },
        redirect: 'follow',
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const items = parseFeed(await readCapped(res, MAX_BYTES))
      const relevant = source.relevance === 'all' ? items : items.filter(isGameBoyRelated)
      return relevant.slice(0, MAX_ITEMS)
    },
  }
}
