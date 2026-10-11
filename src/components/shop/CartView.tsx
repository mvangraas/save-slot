'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCartProductsAction, type CartProduct } from '@/app/actions/shop'
import { EmptyState } from '@/components/retro/EmptyState'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { formatEuro } from '@/lib/format'
import { cart, useCart } from '@/lib/shop/cart'

/** Loads current product data for the ids in the cart; prices always come from the server. */
export function useCartProducts() {
  const lines = useCart()
  const key = lines
    .map((l) => l.productId)
    .sort()
    .join(',')
  const [state, setState] = useState<{ key: string; products: CartProduct[] } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!key) return
    getCartProductsAction(key.split(','))
      .then((products) => !cancelled && setState({ key, products }))
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
    }
  }, [key])

  const loading = key !== '' && state?.key !== key && !error
  const products = state?.products ?? []
  const rows = lines.flatMap((l) => {
    const p = products.find((x) => x.id === l.productId)
    return p ? [{ ...l, product: p }] : []
  })
  const missing = loading ? [] : lines.filter((l) => !products.some((p) => p.id === l.productId))
  const subtotal = rows.reduce((n, r) => n + r.product.priceCents * r.quantity, 0)
  const overStock = rows.some((r) => r.quantity > r.product.stock)
  return { lines, rows, missing, subtotal, overStock, loading, error }
}

export function CartView({ checkoutOpen }: { checkoutOpen: boolean }) {
  const { lines, rows, missing, subtotal, overStock, loading, error } = useCartProducts()

  useEffect(() => {
    // Drop products that no longer exist or were taken offline.
    for (const m of missing) cart.remove(m.productId)
  }, [missing])

  if (error) {
    return <p role="alert">Your cart could not be loaded. Please refresh the page.</p>
  }
  if (lines.length === 0) {
    return (
      <EmptyState
        title="YOUR CART IS EMPTY"
        description={<p>Find something for your collection in the shop.</p>}
        action={
          <PixelButton href="/shop" variant="screen">
            Browse products
          </PixelButton>
        }
      />
    )
  }
  if (loading) return <LoadingState label="Loading cart" />

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <ul className="space-y-3" aria-label="Items in your cart">
        {rows.map(({ product: p, quantity }) => (
          <li key={p.id} className="flex flex-wrap items-center gap-4 bg-surface p-4">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded thumbnail
              <img src={p.imageUrl} alt="" className="size-16 object-cover" />
            ) : (
              <div aria-hidden className="size-16 bg-lcd-200" />
            )}
            <div className="min-w-40 flex-1">
              <Link href={`/shop/${p.slug}`} className="font-semibold hover:underline">
                {p.name}
              </Link>
              <p className="font-mono text-sm text-fg-muted">{formatEuro(p.priceCents)} each</p>
              {quantity > p.stock ? (
                <p role="alert" className="text-sm text-[#ff8a85]">
                  Only {p.stock} in stock: lower the quantity.
                </p>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">Quantity of {p.name}</span>
              <select
                value={quantity}
                onChange={(e) => cart.set(p.id, Number(e.target.value))}
                className="min-h-11 border-2 border-line bg-surface px-2"
              >
                {Array.from(
                  { length: Math.max(quantity, Math.min(10, p.stock)) },
                  (_, i) => i + 1,
                ).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <p className="w-24 text-right font-mono">{formatEuro(p.priceCents * quantity)}</p>
            <button
              type="button"
              onClick={() => cart.remove(p.id)}
              className="min-h-11 px-2 font-display text-xs uppercase underline"
            >
              Remove<span className="sr-only"> {p.name}</span>
            </button>
          </li>
        ))}
      </ul>
      <aside aria-label="Order summary" className="h-fit space-y-3 bg-surface p-5">
        <div className="flex justify-between font-display text-sm uppercase">
          <span>Subtotal</span>
          <span className="font-mono">{formatEuro(subtotal)}</span>
        </div>
        <p className="text-xs text-fg-muted">Shipping is calculated at checkout.</p>
        {checkoutOpen ? (
          <PixelButton
            href="/shop/checkout"
            className="w-full"
            aria-disabled={overStock || undefined}
          >
            Order now
          </PixelButton>
        ) : (
          <p className="border-l-4 border-sticker pl-3 text-sm">
            Ordering opens soon. Your cart is kept in this browser until then.
          </p>
        )}
      </aside>
    </div>
  )
}
