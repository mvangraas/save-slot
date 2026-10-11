import 'server-only'
import { headers } from 'next/headers'

/** Best-effort client IP (Vercel sets x-forwarded-for / x-real-ip). Used only as a limiter key. */
export async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}
