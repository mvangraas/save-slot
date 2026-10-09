import Link from 'next/link'
import { CartridgeShelf } from '@/components/retro/CartridgeShelf'
import { EmptyState } from '@/components/retro/EmptyState'
import { PixelButton } from '@/components/retro/PixelButton'
import { PixelProgress } from '@/components/retro/PixelProgress'
import { getUserContext } from '@/lib/backend'
import { groupByGame, ownedPerPlatform } from '@/lib/backend/collection'
import { getFacets } from '@/lib/catalog'

/** Signed-in part of the homepage. Renders nothing for visitors. Reads the session → <Suspense>. */
export async function MyCabinet() {
  const ctx = await getUserContext()
  if (!ctx) return null
  const [profile, items, plays, wishlist, facets] = await Promise.all([
    ctx.store.getProfile(),
    ctx.store.listCollection(),
    ctx.store.listPlayLogs(),
    ctx.store.wishlistCount(),
    getFacets(),
  ])
  const owned = groupByGame(items)
  const per = ownedPerPlatform(owned)
  const playing = plays.filter((p) => p.status === 'playing')
  // Auto-generated usernames (player_…) read like serial numbers; greet as PLAYER 1 instead.
  const name =
    profile.displayName ?? (profile.username.startsWith('player_') ? 'Player 1' : profile.username)

  return (
    <section aria-labelledby="cabinet-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="cabinet-title" className="font-pixel text-sm leading-relaxed sm:text-base">
          WELCOME BACK, {name.toUpperCase()}
        </h2>
        <Link
          href="/collection"
          className="font-display text-xs text-fg-muted uppercase hover:text-fg"
        >
          Open your collection →
        </Link>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['Games owned', owned.length],
            ['Copies', items.length],
            ['Playing', playing.length],
            ['Wishlist', wishlist],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="bg-surface p-4">
            <dt className="font-display text-xs text-fg-muted uppercase">{label}</dt>
            <dd className="mt-1 font-pixel text-lg">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-5 rounded-sm bg-surface p-5 sm:grid-cols-2">
        <PixelProgress label="Game Boy" value={per.gb} max={facets.platformCounts.gb} tone="gb" />
        <PixelProgress
          label="Game Boy Color"
          value={per.gbc}
          max={facets.platformCounts.gbc}
          tone="gbc"
        />
      </div>

      {owned.length === 0 ? (
        <EmptyState
          title="NO DATA ON THIS SAVE FILE"
          description={<p>Your cartridge cabinet is empty.</p>}
          action={
            <PixelButton href="/games" variant="screen">
              Add your first cartridge →
            </PixelButton>
          }
        />
      ) : (
        <div className="space-y-3">
          <h3 className="font-display text-sm uppercase">Your cartridge cabinet</h3>
          <CartridgeShelf
            label="Your cartridge cabinet"
            games={owned.slice(0, 16).map((g) => ({
              key: g.gameId,
              slug: g.slug,
              title: g.title,
              compat: g.compat,
              year: g.firstReleaseYear,
            }))}
          />
        </div>
      )}

      {playing.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-display text-sm uppercase">Continue playing</h3>
          <CartridgeShelf
            label="Continue playing"
            games={playing.slice(0, 8).map((p) => ({
              key: p.gameId,
              slug: p.gameSlug,
              title: p.gameTitle,
              compat: p.compat,
              year: p.firstReleaseYear,
            }))}
          />
        </div>
      ) : null}
    </section>
  )
}
