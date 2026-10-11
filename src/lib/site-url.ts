/** Absolute site origin for sitemap/robots/OG: explicit setting → Vercel production URL → local. */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const raw =
    env.NEXT_PUBLIC_SITE_URL ||
    (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
    'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}
