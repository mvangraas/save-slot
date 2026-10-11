import type { NextConfig } from 'next'
import { securityHeaders } from './src/config/security-headers'

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  experimental: {
    // Photo uploads (≤5 MB, validated server-side) go through a Server Action.
    serverActions: { bodySizeLimit: '6mb' },
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders({
          dev: process.env.NODE_ENV !== 'production',
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        }),
      },
    ]
  },
}

export default nextConfig
