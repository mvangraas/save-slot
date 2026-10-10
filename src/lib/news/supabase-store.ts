import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { NewsStore } from './store'

type DB = SupabaseClient<Database>

/**
 * Writes need the service-role client (news tables are read-only for visitors);
 * reads work with the public client thanks to the "anyone can read news" policy.
 */
export function supabaseNewsStore(read: DB, write: DB | null): NewsStore {
  const admin = () => {
    if (!write) throw new Error('SUPABASE_SECRET_KEY is not configured')
    return write
  }
  return {
    async upsertSources(sources) {
      const { data, error } = await admin()
        .from('news_sources')
        .upsert(
          sources.map((s) => ({
            name: s.name,
            feed_url: s.feedUrl,
            site_url: s.siteUrl,
            enabled: s.enabled,
          })),
          { onConflict: 'feed_url' },
        )
        .select('id, feed_url')
      if (error) throw new Error(`news_sources: ${error.message}`)
      const byFeed = new Map(data.map((r) => [r.feed_url, r.id]))
      return new Map(sources.map((s) => [s.slug, byFeed.get(s.feedUrl)!]))
    },
    async upsertItems(sourceId, items, fetchedAt) {
      if (items.length === 0) return 0
      const { error, count } = await admin()
        .from('news_items')
        .upsert(
          items.map((it) => ({
            source_id: sourceId,
            title: it.title.slice(0, 300),
            url: it.url,
            excerpt: it.excerpt,
            published_at: it.publishedAt,
            fetched_at: fetchedAt,
          })),
          { onConflict: 'url', count: 'exact' },
        )
      if (error) throw new Error(`news_items: ${error.message}`)
      return count ?? items.length
    },
    async latest(limit) {
      const { data, error } = await read
        .from('news_items')
        .select(
          'id, title, url, excerpt, published_at, fetched_at, source:news_sources!inner ( name, site_url, enabled )',
        )
        .eq('source.enabled', true)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit)
      if (error) throw new Error(`news: ${error.message}`)
      return data.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        excerpt: r.excerpt,
        publishedAt: r.published_at,
        fetchedAt: r.fetched_at,
        source: { name: r.source.name, siteUrl: r.source.site_url },
      }))
    },
  }
}
