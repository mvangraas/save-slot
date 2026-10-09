import { CartridgeCard } from '@/components/retro/CartridgeCard'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { PixelButton } from '@/components/retro/PixelButton'
import { PlatformBadge } from '@/components/retro/PlatformBadge'
import Link from 'next/link'
import { getFacets, searchGames } from '@/lib/catalog'

const loop = [
  { step: 'Discover', text: 'Browse every Game Boy and Game Boy Color release.' },
  { step: 'Collect', text: 'Log the carts, boxes and manuals you own.' },
  { step: 'Complete', text: 'See what is missing per platform and region.' },
  { step: 'Play', text: 'Track your backlog and the games you finished.' },
  { step: 'Wishlist', text: 'Keep a list of grails with a max price.' },
  { step: 'Remember', text: 'Write down the memories behind each cartridge.' },
]

export default async function HomePage() {
  const [facets, shelf] = await Promise.all([
    getFacets(),
    searchGames({ filters: {}, sort: 'year_asc', page: 1, pageSize: 8 }),
  ])
  return (
    <div className="space-y-14">
      <LcdPanel as="section" bezelLabel="Collector archive" aria-labelledby="hero-title">
        <div className="animate-pixel-in py-6 sm:py-10">
          <h1
            id="hero-title"
            className="font-pixel text-lg leading-relaxed sm:text-3xl sm:leading-relaxed"
          >
            YOUR GAME BOY
            <br />
            COLLECTION
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg">
            Rediscover the games that started it all.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <PixelButton href="/login" size="lg" variant="screen">
              Press start
            </PixelButton>
            <PixelButton
              href="/games"
              size="lg"
              variant="ghost"
              className="text-lcd-900 hover:bg-lcd-400/40"
            >
              Browse games
            </PixelButton>
          </div>
        </div>
      </LcdPanel>

      <section aria-labelledby="platforms-title">
        <h2 id="platforms-title" className="sr-only">
          Platforms
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <Link href="/gb" className="group block">
            <LcdPanel tone="gb" className="transition-transform group-hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="font-pixel text-sm">GAME BOY</p>
                <PlatformBadge platform="gb" size="md" />
              </div>
              <p className="mt-3 text-sm">Four shades of green. Where it all began.</p>
              <p className="mt-3 font-pixel text-[0.625rem]">{facets.platformCounts.gb} GAMES</p>
            </LcdPanel>
          </Link>
          <Link href="/gbc" className="group block">
            <LcdPanel tone="gbc" className="transition-transform group-hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <p className="font-pixel text-sm">GAME BOY COLOR</p>
                <PlatformBadge platform="gbc" size="md" />
              </div>
              <p className="mt-3 text-sm">Black dual-mode carts and clear colour-only carts.</p>
              <p className="mt-3 font-pixel text-[0.625rem]">{facets.platformCounts.gbc} GAMES</p>
            </LcdPanel>
          </Link>
        </div>
      </section>

      <section aria-labelledby="shelf-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 id="shelf-title" className="font-pixel text-sm sm:text-base">
            ON THE SHELF
          </h2>
          <Link
            href="/games?sort=year_asc"
            className="font-display text-xs text-fg-muted uppercase hover:text-fg"
          >
            The first cartridges →
          </Link>
        </div>
        <div className="rounded-sm bg-surface-2 px-4 pt-6 pb-0 shadow-[inset_0_-10px_0_0_var(--color-shell-950)]">
          {/* focusable so keyboard users can scroll the shelf */}
          <ul
            tabIndex={0}
            className="flex gap-4 overflow-x-auto pt-1 pb-6"
            aria-label="On the shelf"
          >
            {shelf.items.map((g) => (
              <li key={g.id}>
                <CartridgeCard
                  title={g.title}
                  compat={g.compat}
                  year={g.firstReleaseYear}
                  href={`/games/${g.slug}`}
                  size="sm"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="loop-title" className="rounded-sm bg-paper p-6 text-ink sm:p-8">
        <h2 id="loop-title" className="font-pixel text-sm">
          HOW TO PLAY
        </h2>
        <ol className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {loop.map((item, i) => (
            <li key={item.step} className="flex gap-3">
              <span aria-hidden className="font-pixel text-xs text-lcd-700">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="font-display text-sm uppercase">{item.step}</p>
                <p className="text-sm text-[#45454c]">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
