import { CartridgeCard } from '@/components/retro/CartridgeCard'
import type { GameSummary } from '@/lib/catalog/types'

export function GameGrid({ items }: { items: GameSummary[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {items.map((g) => (
        <li key={g.id}>
          <CartridgeCard
            title={g.title}
            compat={g.compat}
            year={g.firstReleaseYear}
            regions={g.regions}
            owned={g.owned}
            wishlisted={g.wishlisted}
            href={`/games/${g.slug}`}
            size="fluid"
          />
        </li>
      ))}
    </ul>
  )
}

export function GameGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <ul
      aria-hidden
      className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="aspect-[57/65] w-full animate-pulse bg-surface-2 cart-shape" />
        </li>
      ))}
    </ul>
  )
}
