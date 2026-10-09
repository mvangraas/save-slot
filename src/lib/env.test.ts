import { describe, expect, it } from 'vitest'
import { readSupabasePublicEnv } from './env'

describe('readSupabasePublicEnv', () => {
  it('returns null when Supabase is not configured', () => {
    expect(readSupabasePublicEnv({})).toBeNull()
  })

  it('returns null for an invalid URL', () => {
    expect(
      readSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
      }),
    ).toBeNull()
  })

  it('returns the config when both values are present', () => {
    expect(
      readSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_x',
      }),
    ).toEqual({ url: 'https://abc.supabase.co', publishableKey: 'sb_publishable_x' })
  })
})
