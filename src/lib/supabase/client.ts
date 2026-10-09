'use client'

import { createBrowserClient } from '@supabase/ssr'
import { readSupabasePublicEnv } from '@/lib/env'

/** Supabase client for Client Components. Returns `null` while Supabase is not configured. */
export function createSupabaseBrowserClient() {
  const env = readSupabasePublicEnv()
  if (!env) return null
  return createBrowserClient(env.url, env.publishableKey)
}
