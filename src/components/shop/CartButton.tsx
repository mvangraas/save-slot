'use client'

import Link from 'next/link'
import { cartCount, useCart } from '@/lib/shop/cart'

/** Header cart link with item count (counted in this browser). */
export function CartButton() {
  const count = cartCount(useCart())
  return (
    <Link
      href="/shop/cart"
      className="relative inline-flex min-h-11 min-w-11 items-center justify-center px-2 font-display text-xs text-fg-muted uppercase hover:text-fg"
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart, empty'}
    >
      <svg viewBox="0 0 16 16" aria-hidden className="size-5" shapeRendering="crispEdges">
        <path
          fill="currentColor"
          d="M1 2h3l1 2h10v1l-2 5H6l-1 1h9v2H4v-1l1-2L3 4H1zM5 14h2v2H5zm6 0h2v2h-2z"
        />
      </svg>
      {count > 0 ? (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 min-w-5 bg-sticker px-1 text-center font-display text-[0.6875rem] leading-5 text-ink"
        >
          {count}
        </span>
      ) : null}
    </Link>
  )
}
