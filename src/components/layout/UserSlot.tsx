import Link from 'next/link'
import { PixelButton } from '@/components/retro/PixelButton'
import { getSessionUser } from '@/lib/backend'

/**
 * Signed-in state in the header. Reads the session (request-time data), so it must
 * be rendered inside <Suspense>.
 */
export async function UserSlot() {
  const user = await getSessionUser()
  if (!user) {
    return (
      <PixelButton href="/login" size="sm" variant="secondary">
        Sign in
      </PixelButton>
    )
  }
  const name = user.email.split('@')[0] || 'player'
  return (
    <Link
      href="/settings"
      className="inline-flex min-h-11 max-w-40 items-center gap-2 px-2 font-display text-xs text-fg-muted uppercase hover:text-fg"
      title={`Signed in as ${user.email}`}
    >
      <span aria-hidden className="size-2 rounded-full bg-lcd-200" />
      <span className="truncate">P1 · {name}</span>
      <span className="sr-only">(account settings)</span>
    </Link>
  )
}

export function UserSlotFallback() {
  return <span aria-hidden className="inline-block h-9 w-20 animate-pulse bg-surface-2" />
}
