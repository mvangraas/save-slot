import { NextResponse, type NextRequest } from 'next/server'
import { safeNext } from '@/lib/backend/safe-next'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/** Landing point for e-mail confirmation and magic links (PKCE code exchange). */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const code = url.searchParams.get('code')
  const next = safeNext(url.searchParams.get('next'))
  const supabase = await createSupabaseServerClient()

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, url.origin))
  }
  return NextResponse.redirect(new URL('/login?error=link', url.origin))
}
