import { z } from 'zod'

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

export type SupabasePublicEnv = {
  url: string
  publishableKey: string
}

/**
 * Returns the public Supabase config, or `null` when it is not configured yet.
 * The app must keep working (catalogue browsing, design system) without Supabase,
 * so callers decide what to do with `null` instead of crashing.
 *
 * Values are passed in explicitly so `NEXT_PUBLIC_*` vars are inlined at build time.
 */
export function readSupabasePublicEnv(
  source: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
): SupabasePublicEnv | null {
  const parsed = publicSchema.safeParse(source)
  if (!parsed.success) return null
  return {
    url: parsed.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  }
}

export function devPagesEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_DEV_PAGES === '1'
}
