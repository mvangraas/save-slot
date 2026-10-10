import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { EmptyState } from '@/components/retro/EmptyState'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { WishCard } from '@/components/wishlist/WishCard'
import { requireUser } from '@/lib/backend'
import type { WishlistEntry } from '@/lib/backend/types'
import { isBargain, wishEstimate } from '@/lib/backend/value'
import { getGame, getPriceIndex } from '@/lib/catalog'
import { cn } from '@/lib/cn'
import { regionLabel } from '@/lib/types'

export const metadata: Metadata = { title: 'Wishlist', robots: { index: false } }

const SORTS = [
  ['priority', 'Priority'],
  ['price', 'Max price'],
  ['value', 'Estimate'],
  ['recent', 'Recently added'],
] as const
type Sort = (typeof SORTS)[number][0]

export default function WishlistPage({ searchParams }: PageProps<'/wishlist'>) {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">WISHLIST</h1>
        <p className="mt-2 text-fg-muted">
          Your grails, with a max price and a nudge when the estimate drops below it.
        </p>
      </header>
      <Suspense fallback={<LoadingState />}>
        <WishlistBody searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

const rank = { high: 0, medium: 1, low: 2 }

async function WishlistBody({
  searchParams,
}: {
  searchParams: PageProps<'/wishlist'>['searchParams']
}) {
  const params = await searchParams
  const sort = (SORTS.find(([s]) => s === params.sort)?.[0] ?? 'priority') as Sort
  const { store } = await requireUser(sort === 'priority' ? '/wishlist' : `/wishlist?sort=${sort}`)
  const [wishes, prices] = await Promise.all([store.listWishlist(), getPriceIndex()])

  if (wishes.length === 0) {
    return (
      <EmptyState
        title="NO WISHES YET"
        description={<p>Tap ♡ Wishlist on any game page to start your list.</p>}
        action={
          <PixelButton href="/games" variant="screen">
            Browse games
          </PixelButton>
        }
      />
    )
  }

  const rows = await Promise.all(
    wishes.map(async (w) => {
      const game = await getGame(w.gameSlug)
      const estimate = wishEstimate(w, prices)
      return {
        wish: w,
        estimate,
        bargain: isBargain(estimate?.cents, w.maxPriceCents),
        releases: (game?.releases ?? []).map((r) => ({
          id: r.id,
          region: r.region,
          label: `${regionLabel[r.region]}${r.localTitle ? ` — ${r.localTitle}` : ''}`,
        })),
      }
    }),
  )

  const byNullsLast = (a: number | null | undefined, b: number | null | undefined) =>
    (a ?? Number.POSITIVE_INFINITY) - (b ?? Number.POSITIVE_INFINITY)
  const sorters: Record<Sort, (a: (typeof rows)[number], b: (typeof rows)[number]) => number> = {
    priority: (a, b) => rank[a.wish.priority] - rank[b.wish.priority] || byRecent(a.wish, b.wish),
    price: (a, b) => byNullsLast(a.wish.maxPriceCents, b.wish.maxPriceCents),
    value: (a, b) => byNullsLast(a.estimate?.cents, b.estimate?.cents),
    recent: (a, b) => byRecent(a.wish, b.wish),
  }
  rows.sort(sorters[sort])
  const demo = rows.some((r) => r.estimate?.demo)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-pixel text-xs" aria-live="polite">
          {rows.length} {rows.length === 1 ? 'WISH' : 'WISHES'}
          {rows.some((r) => r.bargain)
            ? ` · ${rows.filter((r) => r.bargain).length} BELOW MAX`
            : ''}
        </p>
        <nav aria-label="Sort wishlist" className="flex flex-wrap gap-1">
          {SORTS.map(([s, label]) => (
            <Link
              key={s}
              href={s === 'priority' ? '/wishlist' : `/wishlist?sort=${s}`}
              aria-current={sort === s ? 'true' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center px-3 font-display text-xs uppercase',
                sort === s ? 'bg-lcd-200 text-lcd-900' : 'bg-surface-2 text-fg-muted hover:text-fg',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {demo ? (
        <p className="text-sm text-fg-muted">
          Estimates are <strong>demo prices</strong> for now — not real market data. Real price
          sources arrive in a later phase.
        </p>
      ) : null}
      <ul className="space-y-4">
        {rows.map((r) => (
          <WishCard key={r.wish.gameId} {...r} />
        ))}
      </ul>
    </div>
  )
}

const byRecent = (a: WishlistEntry, b: WishlistEntry) => b.createdAt.localeCompare(a.createdAt)
