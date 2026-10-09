import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { readSupabasePublicEnv } from '@/lib/env'

/**
 * Refreshes the Supabase auth session on every matched request and writes any
 * updated auth cookies onto the response. No-op while Supabase is not configured.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const env = readSupabasePublicEnv()
  if (!env) return response

  const supabase = createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
      },
    },
  })

  // Validates the JWT and refreshes it when needed. Do not put code between
  // client creation and this call.
  await supabase.auth.getClaims()

  return response
}
