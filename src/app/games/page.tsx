import type { Metadata } from 'next'
import { Suspense } from 'react'
import { GameBrowser, GameBrowserSkeleton } from '@/components/catalog/GameBrowser'

export const metadata: Metadata = {
  title: 'Games',
  description:
    'Every Game Boy and Game Boy Color game: search by title, publisher, genre, year and region.',
}

export default function GamesPage({ searchParams }: PageProps<'/games'>) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">GAME DATABASE</h1>
        <p className="mt-2 text-fg-muted">Game Boy and Game Boy Color, all in one archive.</p>
      </header>
      <Suspense fallback={<GameBrowserSkeleton />}>
        <GameBrowser searchParams={searchParams} basePath="/games" />
      </Suspense>
    </div>
  )
}
