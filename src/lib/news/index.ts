import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabasePublicClient } from '@/lib/supabase/public'
import { memoryNewsStore, type NewsItem, type NewsStore } from './store'
import { supabaseNewsStore } from './supabase-store'

export const NEWS_TAG = 'news'

/** Supabase when configured; otherwise the in-process store (dev/e2e). */
export function getNewsStore(opts: { write?: boolean } = {}): NewsStore {
  const read = createSupabasePublicClient()
  if (!read) return memoryNewsStore
  return supabaseNewsStore(read, opts.write ? createSupabaseAdminClient() : null)
}

/** Cached for visitors; the cron route revalidates the tag after each refresh. */
export async function getLatestNews(limit = 20): Promise<NewsItem[]> {
  'use cache'
  cacheLife('hours')
  cacheTag(NEWS_TAG)
  try {
    return await getNewsStore().latest(limit)
  } catch (error) {
    console.error('[news] read failed', error)
    return []
  }
}
