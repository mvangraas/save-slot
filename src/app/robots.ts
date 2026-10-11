import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site-url'

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/collection',
          '/wishlist',
          '/stats',
          '/settings',
          '/login',
          '/account-deleted',
          '/dev/',
          '/admin',
          '/shop/cart',
          '/shop/checkout',
          '/shop/order/',
          '/shop/image',
          '/repairs/status/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
