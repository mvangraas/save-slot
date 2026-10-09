import { createClient } from '@supabase/supabase-js'
import { readSupabasePublicEnv } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Cookie-less client for public catalogue reads. Safe to use inside `'use cache'`
 * because it never touches request data. Returns null when Supabase isn't configured.
 */
export function createSupabasePublicClient() {
  const env = readSupabasePublicEnv()
  if (!env) return null
  return createClient<Database>(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
