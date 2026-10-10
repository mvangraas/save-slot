import type { PriceGrade, PriceIndex } from '@/lib/catalog/types'
import type { Region } from '@/lib/types'
import type { CollectionItem, ItemCondition, WishlistEntry } from './types'

/** Master prompt §9: sealed → new, cart+box+manual → CIB, otherwise loose. */
export function gradeFor(
  item: Pick<CollectionItem, 'condition' | 'hasCart' | 'hasBox' | 'hasManual'>,
): PriceGrade {
  if (item.condition === 'sealed') return 'new'
  return item.hasCart && item.hasBox && item.hasManual ? 'cib' : 'loose'
}

export function itemValue(item: CollectionItem, prices: PriceIndex): number | null {
  return prices[item.releaseId]?.[gradeFor(item)] ?? null
}

export type CollectionValue = {
  totalCents: number
  pricedCount: number
  unpricedCount: number
  paidCents: number
  /** true when any price used is a demo (seed) value */
  demo: boolean
}

export function collectionValue(items: CollectionItem[], prices: PriceIndex): CollectionValue {
  let total = 0
  let priced = 0
  let paid = 0
  let demo = false
  for (const i of items) {
    const v = itemValue(i, prices)
    if (v !== null) {
      total += v
      priced++
      if (prices[i.releaseId]?.source === 'seed') demo = true
    }
    if (i.purchasePriceCents != null && (i.purchaseCurrency ?? 'EUR') === 'EUR')
      paid += i.purchasePriceCents
  }
  return {
    totalCents: total,
    pricedCount: priced,
    unpricedCount: items.length - priced,
    paidCents: paid,
    demo,
  }
}

const gradeForCondition = (c: ItemCondition | null): PriceGrade =>
  c === 'sealed' ? 'new' : 'loose'

/**
 * What a wished-for game would roughly cost: the cheapest release in the preferred region
 * (or any region when none is set), at the grade matching the desired condition.
 */
export function wishEstimate(
  wish: Pick<WishlistEntry, 'gameId' | 'preferredRegion' | 'desiredCondition'>,
  prices: PriceIndex,
): { cents: number; region: Region; demo: boolean } | null {
  const grade = gradeForCondition(wish.desiredCondition)
  let best: { cents: number; region: Region; demo: boolean } | null = null
  for (const p of Object.values(prices)) {
    if (p.gameId !== wish.gameId) continue
    if (wish.preferredRegion && p.region !== wish.preferredRegion) continue
    const v = p[grade]
    if (v !== null && (best === null || v < best.cents))
      best = { cents: v, region: p.region, demo: p.source === 'seed' }
  }
  return best
}

/** true when the estimate is at or below the user's maximum. */
export const isBargain = (estimate: number | null | undefined, max: number | null) =>
  estimate != null && max != null && estimate <= max
