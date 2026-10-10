import 'server-only'
import { refresh } from 'next/cache'
import { cookies } from 'next/headers'
import type { UserStore } from '@/lib/backend/types'
import { ACHIEVEMENTS } from './definitions'

/** Short-lived, non-sensitive cookie the layout reads to show an unlock toast once. */
export const UNLOCK_COOKIE = 'ss_unlocked'
const KNOWN = new Set<string>(ACHIEVEMENTS.map((a) => a.code))

export function parseUnlockCookie(value: string | undefined): string[] {
  if (!value) return []
  return [...new Set(value.split('.').filter((c) => KNOWN.has(c)))].slice(0, 10)
}

/**
 * Call after every successful mutation: evaluates achievements server-side, queues any new
 * unlocks for the toast and refreshes the page. Achievements never block a save.
 */
export async function saveProgress(store: UserStore): Promise<string[]> {
  let fresh: string[] = []
  try {
    fresh = await store.evaluateAchievements()
  } catch (error) {
    console.error('[achievements] evaluation failed', error)
  }
  if (fresh.length > 0) {
    const jar = await cookies()
    const queued = parseUnlockCookie(jar.get(UNLOCK_COOKIE)?.value)
    jar.set(UNLOCK_COOKIE, [...new Set([...queued, ...fresh])].join('.'), {
      path: '/',
      maxAge: 120,
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production' && process.env.E2E !== '1',
    })
  }
  refresh()
  return fresh
}
