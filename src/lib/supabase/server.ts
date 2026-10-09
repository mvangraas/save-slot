import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { readSupabasePublicEnv } from '@/lib/env'

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Returns `null` while Supabase is not configured.
 *
 * Reading cookies is request-time data: with Cache Components, any component that
 * calls this must render inside a <Suspense> boundary.
 */
export async function createSupabaseServerClient() {
  const env = readSupabasePublicEnv()
  if (!env) return null

  const cookieStore = await cookies()

  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Safe to ignore: proxy.ts refreshes the session on every request.
        }
      },
    },
  })
}
