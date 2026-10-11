'use client'

import { useSyncExternalStore } from 'react'

/**
 * The cart lives in this browser only (product ids + quantities). Prices, names and stock are
 * always fetched fresh from the server and re-checked at checkout.
 */
export type CartLine = { productId: string; quantity: number }

const KEY = 'saveslot:cart'
const EVENT = 'saveslot:cart'
const MAX_QTY = 10

function read(): CartLine[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (l): l is CartLine =>
          typeof l?.productId === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0,
      )
      .slice(0, 30)
  } catch {
    return []
  }
}

let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: [] }
function snapshot(): CartLine[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    // storage blocked: behave as an empty cart
  }
  if (raw !== cache.raw) cache = { raw, lines: read() }
  return cache.lines
}
const EMPTY: CartLine[] = []

function write(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines))
  } catch {
    // ignore: private mode etc.
  }
  window.dispatchEvent(new Event(EVENT))
}

export function useCart(): CartLine[] {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(EVENT, onChange)
      window.addEventListener('storage', onChange)
      return () => {
        window.removeEventListener(EVENT, onChange)
        window.removeEventListener('storage', onChange)
      }
    },
    snapshot,
    () => EMPTY,
  )
}

export const cart = {
  add(productId: string, quantity = 1, maxStock = MAX_QTY) {
    const lines = read()
    const line = lines.find((l) => l.productId === productId)
    const limit = Math.min(MAX_QTY, maxStock)
    if (line) line.quantity = Math.min(limit, line.quantity + quantity)
    else lines.push({ productId, quantity: Math.min(limit, quantity) })
    write(lines)
  },
  set(productId: string, quantity: number) {
    const lines = read()
      .map((l) => (l.productId === productId ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l))
      .filter((l) => l.quantity > 0)
    write(lines)
  },
  remove(productId: string) {
    write(read().filter((l) => l.productId !== productId))
  },
  clear() {
    write([])
  },
}

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0)
