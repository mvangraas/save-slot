/**
 * Security headers for every response (master prompt §11).
 *
 * CSP note: pages are statically prerendered / partially prerendered (Cache Components), so a
 * per-request nonce would force every page dynamic. Scripts are therefore limited to our own
 * origin plus inline scripts (Next's RSC payload and the theme boot script); everything else
 * (objects, frames, base URIs, form targets, foreign script hosts) is locked down.
 */
export function contentSecurityPolicy(opts: { dev: boolean; supabaseUrl?: string }): string {
  const supabase = opts.supabaseUrl ? new URL(opts.supabaseUrl).origin : ''
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...(opts.dev ? ["'unsafe-eval'"] : [])],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://images.igdb.com',
      ...(supabase ? [supabase] : []),
    ],
    'font-src': ["'self'"],
    'connect-src': [
      "'self'",
      ...(supabase ? [supabase, supabase.replace('https://', 'wss://')] : []),
      ...(opts.dev ? ['ws:'] : []),
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
  }
  // No upgrade-insecure-requests: HSTS + Vercel's HTTPS redirect cover production, and the
  // directive would break the local production build used by the e2e tests (http://localhost).
  return Object.entries(directives)
    .map(([k, v]) => `${k} ${v.join(' ')}`)
    .join('; ')
}

export function securityHeaders(opts: { dev: boolean; supabaseUrl?: string }) {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(opts) },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
    },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ]
}
