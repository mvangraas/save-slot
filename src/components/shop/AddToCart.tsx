'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PixelButton } from '@/components/retro/PixelButton'
import { cart, useCart } from '@/lib/shop/cart'
import { playSound } from '@/lib/sound'

export function AddToCart({ productId, stock }: { productId: string; stock: number }) {
  const lines = useCart()
  const inCart = lines.find((l) => l.productId === productId)?.quantity ?? 0
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const max = Math.max(0, Math.min(10, stock) - inCart)

  if (stock <= 0) {
    return <p className="font-display text-sm uppercase">Sold out</p>
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-display text-xs text-fg-muted uppercase">Quantity</span>
          <select
            value={Math.min(qty, Math.max(1, max))}
            onChange={(e) => setQty(Number(e.target.value))}
            disabled={max === 0}
            className="min-h-11 border-2 border-line bg-surface px-3 text-base"
          >
            {Array.from({ length: Math.max(1, max) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <PixelButton
          disabled={max === 0}
          onClick={() => {
            cart.add(productId, qty, stock)
            setAdded(true)
            playSound('save')
          }}
        >
          Add to cart
        </PixelButton>
      </div>
      <p role="status" className="text-sm text-fg-muted">
        {added || inCart > 0 ? (
          <>
            {inCart} in your cart ·{' '}
            <Link href="/shop/cart" className="underline">
              View cart
            </Link>
          </>
        ) : null}
        {max === 0 && inCart > 0 ? ' · That is all we have in stock.' : null}
      </p>
    </div>
  )
}
