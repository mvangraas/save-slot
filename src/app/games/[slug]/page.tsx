import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { GameGrid } from '@/components/catalog/GameGrid'
import { CartridgeCard } from '@/components/retro/CartridgeCard'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { ManualSection } from '@/components/retro/ManualSection'
import { PixelButton } from '@/components/retro/PixelButton'
import { PlatformBadge } from '@/components/retro/PlatformBadge'
import { RegionTag } from '@/components/retro/RegionTag'
import { Sticker } from '@/components/retro/Sticker'
import { getGame, listGameSlugs, searchGames } from '@/lib/catalog'
import { PAGE_SIZE } from '@/lib/catalog/params'
import { formatReleaseDate } from '@/lib/catalog/text'
import { featureLabel, type GameDetail } from '@/lib/catalog/types'
import { compatLabel } from '@/lib/types'

export async function generateStaticParams() {
  const slugs = await listGameSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/games/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const game = await getGame(slug)
  if (!game) return { title: 'Game not found' }
  return {
    title: game.title,
    description:
      game.description ??
      `${game.title} for ${compatLabel[game.compat]}${game.firstReleaseYear ? ` (${game.firstReleaseYear})` : ''}.`,
  }
}

export default async function GamePage({ params }: PageProps<'/games/[slug]'>) {
  const { slug } = await params
  const game = await getGame(slug)
  if (!game) notFound()

  const related = game.series
    ? (
        await searchGames({
          filters: { series: game.series.slug },
          sort: 'year_asc',
          page: 1,
          pageSize: PAGE_SIZE,
        })
      ).items
        .filter((g) => g.slug !== game.slug)
        .slice(0, 5)
    : []

  return (
    <article className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/games" className="hover:text-fg">
              Games
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/${game.platform}`} className="hover:text-fg">
              {game.platform === 'gb' ? 'Game Boy' : 'Game Boy Color'}
            </Link>
          </li>
        </ol>
      </nav>

      <Header game={game} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ManualSection number={1} title="Releases">
          <Releases game={game} />
        </ManualSection>

        <ManualSection number={2} title="Cartridge features">
          {game.features.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {game.features.map((k) => (
                <li
                  key={k}
                  className="border-2 border-ink px-2 py-1 font-display text-xs uppercase"
                >
                  {featureLabel[k]}
                </li>
              ))}
            </ul>
          ) : (
            <p>No verified features recorded yet.</p>
          )}
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="font-display uppercase">Cartridge</dt>
            <dd>{compatLabel[game.compat]}</dd>
            {game.playersMax ? (
              <>
                <dt className="font-display uppercase">Players</dt>
                <dd>
                  {game.playersMin && game.playersMin !== game.playersMax
                    ? `${game.playersMin}–${game.playersMax}`
                    : game.playersMax}
                </dd>
              </>
            ) : null}
          </dl>
          <p className="mt-4 text-xs text-[#45454c]">Only features we could verify are listed.</p>
        </ManualSection>

        <ManualSection number={3} title="Box art & screenshots" className="lg:col-span-2">
          {game.media.length > 0 ? (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {game.media.map((m) => (
                <li key={m.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- external, licensed sources */}
                  <img
                    src={m.url}
                    alt={`${game.title} — ${m.kind.replace('_', ' ')}`}
                    className="pixelated w-full"
                  />
                  <p className="mt-1 text-xs text-[#45454c]">
                    {m.attribution} · {m.license}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              No licensed images yet. We only show box art and screenshots from sources that allow
              it, always with credit.
            </p>
          )}
        </ManualSection>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-title" className="space-y-4">
          <h2 id="related-title" className="font-pixel text-sm">
            MORE FROM {game.series!.name.toUpperCase()}
          </h2>
          <GameGrid items={related} />
        </section>
      ) : null}
    </article>
  )
}

function Header({ game }: { game: GameDetail }) {
  return (
    <header className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
      <CartridgeCard
        title={game.title}
        compat={game.compat}
        year={game.firstReleaseYear}
        size="lg"
        className="mx-auto sm:mx-0"
      />
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformBadge platform={game.platform} size="md" />
          {game.regions.map((r) => (
            <RegionTag key={r} region={r} />
          ))}
          {game.features.includes('sgb_enhanced') ? <Sticker kind="sgb" /> : null}
          {game.features.includes('rumble') ? <Sticker kind="rumble" /> : null}
        </div>
        <h1 className="font-pixel text-xl leading-relaxed sm:text-2xl">{game.title}</h1>
        {game.description ? <p className="max-w-prose text-lg">{game.description}</p> : null}
        <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
          <dt className="font-display text-fg-muted uppercase">First release</dt>
          <dd className="font-mono">{game.firstReleaseYear ?? 'Unknown'}</dd>
          {game.developer ? (
            <>
              <dt className="font-display text-fg-muted uppercase">Developer</dt>
              <dd>
                <Link
                  href={`/games?developer=${game.developer.slug}`}
                  className="underline hover:no-underline"
                >
                  {game.developer.name}
                </Link>
              </dd>
            </>
          ) : null}
          <dt className="font-display text-fg-muted uppercase">Publisher</dt>
          <dd>
            {[
              ...new Map(
                game.releases.flatMap((r) =>
                  r.publisher ? [[r.publisher.slug, r.publisher]] : [],
                ),
              ).values(),
            ].map((p) => (
              <Link
                key={p.slug}
                href={`/games?publisher=${p.slug}`}
                className="mr-2 underline hover:no-underline"
              >
                {p.name}
              </Link>
            ))}
          </dd>
          {game.genres.length > 0 ? (
            <>
              <dt className="font-display text-fg-muted uppercase">Genre</dt>
              <dd>
                {game.genres.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/games?genre=${g.slug}`}
                    className="mr-2 underline hover:no-underline"
                  >
                    {g.name}
                  </Link>
                ))}
              </dd>
            </>
          ) : null}
          {game.series ? (
            <>
              <dt className="font-display text-fg-muted uppercase">Series</dt>
              <dd>
                <Link
                  href={`/games?series=${game.series.slug}`}
                  className="underline hover:no-underline"
                >
                  {game.series.name}
                </Link>
              </dd>
            </>
          ) : null}
        </dl>

        <LcdPanel scanlines={false} className="max-w-xl" screenClassName="p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <PixelButton variant="screen" size="sm" disabled>
              + Collection
            </PixelButton>
            <PixelButton variant="screen" size="sm" disabled>
              ♥ Wishlist
            </PixelButton>
            <p className="text-sm">Collecting unlocks when sign-in arrives (phase 3).</p>
          </div>
        </LcdPanel>
      </div>
    </header>
  )
}

function Releases({ game }: { game: GameDetail }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
        <caption className="sr-only">Releases of {game.title} per region</caption>
        <thead>
          <tr className="border-b border-ink/40 font-display text-xs uppercase">
            <th scope="col" className="py-1.5 pr-3">
              Region
            </th>
            <th scope="col" className="py-1.5 pr-3">
              Title
            </th>
            <th scope="col" className="py-1.5 pr-3">
              Released
            </th>
            <th scope="col" className="py-1.5 pr-3">
              Code
            </th>
            <th scope="col" className="py-1.5">
              Publisher
            </th>
          </tr>
        </thead>
        <tbody>
          {game.releases.map((r) => (
            <tr key={r.id} className="border-b border-ink/15 align-top last:border-0">
              <th scope="row" className="py-1.5 pr-3 font-normal">
                <RegionTag region={r.region} />
              </th>
              <td className="py-1.5 pr-3">{r.localTitle ?? game.title}</td>
              <td className="py-1.5 pr-3 font-mono">
                {formatReleaseDate(r.releaseDate, r.releaseDatePrecision)}
              </td>
              <td className="py-1.5 pr-3 font-mono">{r.productCode ?? '—'}</td>
              <td className="py-1.5">{r.publisher?.name ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
