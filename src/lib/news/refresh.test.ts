import { beforeEach, describe, expect, it } from 'vitest'
import type { NewsSourceConfig } from '@/config/news-sources'
import { rssProvider } from './provider'
import { refreshNews } from './refresh'
import { memoryNewsStore, resetMemoryNews } from './store'

const src = (slug: string, relevance: 'all' | 'gameboy' = 'gameboy'): NewsSourceConfig => ({
  slug,
  name: slug.toUpperCase(),
  siteUrl: `https://${slug}.test`,
  feedUrl: `https://${slug}.test/feed`,
  relevance,
  enabled: true,
})

const feed = (titles: string[]) =>
  `<rss><channel>${titles
    .map(
      (t, i) =>
        `<item><title>${t}</title><link>https://x.test/${encodeURIComponent(t)}${i}</link></item>`,
    )
    .join('')}</channel></rss>`

describe('refreshNews', () => {
  beforeEach(() => resetMemoryNews())

  it('stores relevant items, isolates failing sources and is idempotent', async () => {
    const fake: typeof fetch = async (input) => {
      const url = String(input)
      if (url.startsWith('https://ok.test'))
        return new Response(feed(['Game Boy news', 'Other news']))
      if (url.startsWith('https://all.test')) return new Response(feed(['Jam results']))
      if (url.startsWith('https://down.test')) return new Response('', { status: 503 })
      throw new Error('network down')
    }
    const sources = [src('ok'), src('all', 'all'), src('down'), src('boom')]
    const report = await refreshNews(sources, rssProvider(fake), memoryNewsStore)
    expect(report).toEqual([
      { source: 'ok', ok: true, stored: 1 },
      { source: 'all', ok: true, stored: 1 },
      { source: 'down', ok: false, stored: 0, error: 'HTTP 503' },
      { source: 'boom', ok: false, stored: 0, error: 'network down' },
    ])
    await refreshNews(sources, rssProvider(fake), memoryNewsStore)
    const latest = await memoryNewsStore.latest(10)
    expect(latest.map((n) => n.title).sort()).toEqual(['Game Boy news', 'Jam results'])
    expect(latest.find((n) => n.title === 'Jam results')?.source.name).toBe('ALL')
  })

  it('skips disabled sources', async () => {
    let calls = 0
    const fake: typeof fetch = async () => {
      calls++
      return new Response(feed([]))
    }
    await refreshNews([{ ...src('off'), enabled: false }], rssProvider(fake), memoryNewsStore)
    expect(calls).toBe(0)
  })

  it('rejects oversized feeds', async () => {
    const huge: typeof fetch = async () => new Response('x'.repeat(2_000_001))
    const [r] = await refreshNews([src('big')], rssProvider(huge), memoryNewsStore)
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/larger than/)
  })
})
