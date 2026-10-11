import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy, securityHeaders } from '@/config/security-headers'
import { createLimiter } from './rate-limit'

describe('createLimiter', () => {
  it('allows up to the limit per window, per key', () => {
    const l = createLimiter({ limit: 2, windowMs: 1000 })
    expect([l.hit('a', 0), l.hit('a', 1), l.hit('a', 2)]).toEqual([true, true, false])
    expect(l.hit('b', 2)).toBe(true)
    expect(l.hit('a', 1001)).toBe(true)
  })

  it('caps memory use', () => {
    const l = createLimiter({ limit: 1, windowMs: 1000, maxKeys: 3 })
    for (const k of ['a', 'b', 'c', 'd', 'e']) expect(l.hit(k, 0)).toBe(true)
  })
})

describe('security headers', () => {
  it('locks down framing, objects and foreign scripts', () => {
    const csp = contentSecurityPolicy({ dev: false, supabaseUrl: 'https://x.supabase.co' })
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).toContain("connect-src 'self' https://x.supabase.co wss://x.supabase.co")
    expect(contentSecurityPolicy({ dev: true })).toContain("'unsafe-eval'")
    const keys = securityHeaders({ dev: false }).map((h) => h.key)
    expect(keys).toEqual(
      expect.arrayContaining([
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'X-Frame-Options',
      ]),
    )
  })
})
