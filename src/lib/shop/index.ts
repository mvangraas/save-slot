import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import { readShopConfig } from '@/config/shop'
import { getSessionUser } from '@/lib/backend'
import type { SessionUser } from '@/lib/backend/types'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabasePublicClient } from '@/lib/supabase/public'
import { memoryShopStore } from './memory-store'
import { createSupabaseShopStore } from './supabase-store'
import type { ShopStore } from './types'

/** Supabase in production; the in-process store only for local development and e2e. */
export function getShopStore(): ShopStore {
  const read = createSupabasePublicClient()
  if (read) return createSupabaseShopStore(read, createSupabaseAdminClient())
  if (process.env.SAVESLOT_MEMORY_BACKEND === '1' && process.env.VERCEL_ENV !== 'production') {
    return memoryShopStore
  }
  throw new Error('The shop needs Supabase to be configured.')
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return readShopConfig().adminEmails.includes(email.toLowerCase())
}

/**
 * Server-side gate for every admin page and action. Signed-out visitors go to the login page;
 * signed-in non-admins get a plain 404 so the admin area isn't advertised.
 */
export async function requireAdmin(next = '/admin'): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  if (!isAdminEmail(user.email)) notFound()
  return user
}

/** Cached product facts for metadata only (stock and price on the page itself are live). */
export async function getProductMeta(slug: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('shop')
  const p = await getShopStore()
    .getProduct(slug)
    .catch(() => null)
  return p
    ? {
        name: p.name,
        description: p.description,
        condition: p.condition,
        image: p.images[0]?.url ?? null,
      }
    : null
}
