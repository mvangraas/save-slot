import type { MetadataRoute } from 'next'
import { listGameSlugs } from '@/lib/catalog'
import { siteUrl } from '@/lib/site-url'

/** Public pages only. Personal pages (collection, wishlist, stats, settings) are never listed. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/games`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/gb`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/gbc`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/news`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${base}/achievements`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.3 },
  ]
  const slugs = await listGameSlugs()
  return [
    ...pages,
    ...slugs.map((slug) => ({
      url: `${base}/games/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
