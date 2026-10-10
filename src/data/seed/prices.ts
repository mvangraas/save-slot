/**
 * DEMO prices for the seed catalogue — NOT real market data.
 *
 * Deterministic pseudo-random values per release so the value features can be built and
 * tested before a real price source (phase 6) is connected. Every price carries
 * source = 'seed' and the UI labels it as a demo estimate.
 */
import type { Region } from '@/lib/types'

export const DEMO_PRICE_DATE = '2026-10-01T00:00:00Z'

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const roundTo50 = (cents: number) => Math.max(100, Math.round(cents / 50) * 50)

/** cents for loose / CIB / new (sealed) */
export function demoPrices(
  slug: string,
  region: Region,
): { loose: number; cib: number; new: number } {
  const h = hash(`${slug}:${region}`)
  const loose = 800 + (h % 5200) // €8 – €60
  const regionFactor = region === 'jp' ? 0.75 : region === 'us' ? 1 : 1.1
  const cibFactor = 2.2 + ((h >>> 8) % 100) / 100 // 2.2× – 3.2×
  const newFactor = 2.5 + ((h >>> 16) % 150) / 100 // 2.5× – 4.0× CIB
  const l = roundTo50(loose * regionFactor)
  const c = roundTo50(l * cibFactor)
  return { loose: l, cib: c, new: roundTo50(c * newFactor) }
}
