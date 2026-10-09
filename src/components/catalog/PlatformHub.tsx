import { Suspense } from 'react'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { PlatformBadge } from '@/components/retro/PlatformBadge'
import { getFacets } from '@/lib/catalog'
import type { Platform } from '@/lib/types'
import { GameBrowser, GameBrowserSkeleton } from './GameBrowser'

const copy: Record<Platform, { title: string; text: string }> = {
  gb: {
    title: 'GAME BOY',
    text: 'The original grey cartridges, made for four shades of green.',
  },
  gbc: {
    title: 'GAME BOY COLOR',
    text: 'Black carts play on every Game Boy; clear carts need a Game Boy Color.',
  },
}

export async function PlatformHub({
  platform,
  searchParams,
}: {
  platform: Platform
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const facets = await getFacets()
  return (
    <div className="space-y-8">
      <LcdPanel tone={platform} as="section" aria-labelledby="hub-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 id="hub-title" className="font-pixel text-lg leading-relaxed sm:text-2xl">
              {copy[platform].title}
            </h1>
            <p className="mt-2 max-w-xl">{copy[platform].text}</p>
          </div>
          <PlatformBadge platform={platform} size="md" />
        </div>
        <p className="mt-4 font-pixel text-xs">
          {facets.platformCounts[platform]} GAMES IN THE ARCHIVE
        </p>
      </LcdPanel>
      <Suspense fallback={<GameBrowserSkeleton />}>
        <GameBrowser
          searchParams={searchParams}
          basePath={`/${platform}`}
          presetPlatform={platform}
        />
      </Suspense>
    </div>
  )
}
