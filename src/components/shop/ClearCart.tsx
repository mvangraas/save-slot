'use client'

import { useEffect } from 'react'
import { cart } from '@/lib/shop/cart'

/** Empties the browser cart once an order is confirmed as paid. */
export function ClearCart() {
  useEffect(() => cart.clear(), [])
  return null
}
