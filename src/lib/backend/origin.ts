import 'server-only'
import { headers } from 'next/headers'

/** Absolute origin of the current request, for auth e-mail links. */
export async function requestOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    return `${proto}://${host}`
  }
  return fromEnv ?? 'http://localhost:3000'
}
