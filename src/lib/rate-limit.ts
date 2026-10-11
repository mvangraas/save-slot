/**
 * Fixed-window limiter kept in process memory. On serverless it is per instance, so it is a
 * first line of defence only: Supabase Auth has its own limits for sign-in/sign-up, and user
 * writes are limited in the database (public.check_rate_limit).
 */
export function createLimiter(opts: { limit: number; windowMs: number; maxKeys?: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>()
  const maxKeys = opts.maxKeys ?? 10_000
  return {
    hit(key: string, now = Date.now()): boolean {
      const entry = hits.get(key)
      if (!entry || entry.resetAt <= now) {
        if (hits.size >= maxKeys) {
          for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k)
          if (hits.size >= maxKeys) hits.delete(hits.keys().next().value!)
        }
        hits.set(key, { count: 1, resetAt: now + opts.windowMs })
        return true
      }
      entry.count++
      return entry.count <= opts.limit
    },
    reset() {
      hits.clear()
    },
  }
}
