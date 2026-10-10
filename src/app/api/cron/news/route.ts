import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { revalidateTag } from 'next/cache'
import { NEWS_SOURCES } from '@/config/news-sources'
import { cronGuard } from '@/lib/cron/auth'
import { getNewsStore, NEWS_TAG } from '@/lib/news'
import { refreshNews } from '@/lib/news/refresh'
import { rssProvider } from '@/lib/news/provider'
import type { NewsProvider } from '@/lib/providers/types'

export const maxDuration = 60

/** Local/e2e only: read feeds from e2e/fixtures/news/<slug>.xml instead of the network. */
function fixtureProvider(): NewsProvider {
  return rssProvider(async (input) => {
    const source = NEWS_SOURCES.find((s) => s.feedUrl === String(input))
    if (!source) return new Response('not found', { status: 404 })
    try {
      const xml = await readFile(join(process.cwd(), 'e2e/fixtures/news', `${source.slug}.xml`))
      return new Response(xml)
    } catch {
      return new Response('missing fixture', { status: 404 })
    }
  })
}

export async function GET(request: Request) {
  const denied = cronGuard(request)
  if (denied) return denied

  const useFixtures = process.env.NEWS_FIXTURES === '1' && process.env.VERCEL_ENV !== 'production'
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.SUPABASE_SECRET_KEY) {
    return Response.json({ error: 'SUPABASE_SECRET_KEY is not configured' }, { status: 503 })
  }
  const store = getNewsStore({ write: true })

  try {
    const report = await refreshNews(
      NEWS_SOURCES,
      useFixtures ? fixtureProvider() : rssProvider(),
      store,
    )
    revalidateTag(NEWS_TAG, { expire: 0 })
    const stored = report.reduce((n, r) => n + r.stored, 0)
    console.info('[cron/news]', JSON.stringify(report))
    return Response.json({ ok: report.some((r) => r.ok), stored, sources: report })
  } catch (error) {
    console.error('[cron/news] failed', error)
    return Response.json({ error: 'News refresh failed' }, { status: 500 })
  }
}
