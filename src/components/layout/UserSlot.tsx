import { PixelButton } from '@/components/retro/PixelButton'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Signed-in state in the header. Reads the session (request-time data), so it must
 * be rendered inside <Suspense>.
 */
export async function UserSlot() {
  const supabase = await createSupabaseServerClient()
  const { data } = supabase ? await supabase.auth.getClaims() : { data: null }
  const email = data?.claims?.email as string | undefined

  if (!email) {
    return (
      <PixelButton href="/login" size="sm" variant="secondary">
        Sign in
      </PixelButton>
    )
  }

  return (
    <span className="max-w-40 truncate font-display text-xs text-fg-muted uppercase" title={email}>
      P1 · {email.split('@')[0]}
    </span>
  )
}

export function UserSlotFallback() {
  return <span aria-hidden className="inline-block h-9 w-20 animate-pulse bg-surface-2" />
}
