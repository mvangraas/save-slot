import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { readSupabasePublicEnv } from '@/lib/env'
import type { Database } from './database.types'

/**
 * Service-role client for trusted server jobs (cron, imports). Bypasses RLS, so it must never
 * be used with user input or in anything that renders for a visitor. Null when not configured.
 */
export function createSupabaseAdminClient() {
  const env = readSupabasePublicEnv()
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!env || !secret) return null
  return createClient<Database>(env.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
