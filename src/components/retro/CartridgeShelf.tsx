import { cn } from '@/lib/cn'
import type { CartCompat, Region } from '@/lib/types'
import { CartridgeCard } from './CartridgeCard'

export type ShelfGame = {
  key: string
  slug: string
  title: string
  compat: CartCompat
  year: number | null
  regions?: Region[]
  owned?: boolean
}

/** The cartridge cabinet: carts standing on wooden-ish planks, row after row. */
export function CartridgeShelf({
  games,
  label,
  className,
}: {
  games: ShelfGame[]
  label: string
  className?: string
}) {
  return (
    <ul
      aria-label={label}
      className={cn(
        'grid grid-cols-3 rounded-sm bg-surface-2 px-2 pt-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
        className,
      )}
    >
      {games.map((g) => (
        <li
          key={g.key}
          className="relative px-1.5 pb-5 after:absolute after:inset-x-0 after:bottom-1 after:h-2.5 after:bg-shell-950 after:shadow-[0_3px_0_0_rgb(0_0_0/0.35)] sm:px-2"
        >
          <CartridgeCard
            title={g.title}
            compat={g.compat}
            year={g.year}
            href={`/games/${g.slug}`}
            owned={g.owned}
            size="fluid"
          />
        </li>
      ))}
    </ul>
  )
}
