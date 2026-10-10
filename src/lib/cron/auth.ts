import 'server-only'
import { timingSafeEqual } from 'node:crypto'

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Returns an error Response when the
 * request may not run the job, or null when it may.
 */
export function cronGuard(request: Request): Response | null {
  const secret = process.env.CRON_SECRET
  if (!secret || secret.length < 16) {
    return Response.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }
  const given = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
