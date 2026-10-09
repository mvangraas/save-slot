import 'server-only'
import { redirect } from 'next/navigation'
import { readSupabasePublicEnv } from '@/lib/env'
import { memoryBackend } from './memory'
import { supabaseBackend } from './supabase'
import type { Backend, SessionUser, UserStore } from './types'

const noBackend: Backend = {
  mode: 'none',
  auth: {
    supportsMagicLink: false,
    getUser: async () => null,
    signUp: async () => ({ ok: false, error: 'Sign-in is not configured yet.' }),
    signIn: async () => ({ ok: false, error: 'Sign-in is not configured yet.' }),
    sendMagicLink: async () => ({ ok: false, error: 'Sign-in is not configured yet.' }),
    signOut: async () => {},
  },
  store: async () => {
    throw new Error('No backend configured')
  },
}

/**
 * Supabase when configured. The in-memory backend is opt-in for local dev/e2e
 * (SAVESLOT_MEMORY_BACKEND=1) and can never run on a Vercel production deployment.
 */
export function getBackend(): Backend {
  if (readSupabasePublicEnv()) return supabaseBackend
  if (process.env.SAVESLOT_MEMORY_BACKEND === '1' && process.env.VERCEL_ENV !== 'production') {
    return memoryBackend
  }
  return noBackend
}

export async function getSessionUser(): Promise<SessionUser | null> {
  return getBackend().auth.getUser()
}

/** For pages/actions that need a user: returns the user and their store, or redirects to /login. */
export async function requireUser(next: string): Promise<{ user: SessionUser; store: UserStore }> {
  const backend = getBackend()
  const user = await backend.auth.getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return { user, store: await backend.store(user) }
}

/** For optional user context: null when signed out. */
export async function getUserContext(): Promise<{ user: SessionUser; store: UserStore } | null> {
  const backend = getBackend()
  const user = await backend.auth.getUser()
  return user ? { user, store: await backend.store(user) } : null
}

export { safeNext } from './safe-next'
