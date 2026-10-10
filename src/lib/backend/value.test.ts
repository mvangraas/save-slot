import { describe, expect, it } from 'vitest'
import type { PriceIndex } from '@/lib/catalog/types'
import { collectionValue, gradeFor, isBargain, itemValue, wishEstimate } from './value'
import type { CollectionItem } from './types'

const prices: PriceIndex = {
  r_eu: {
    gameId: 'g1',
    region: 'eu',
    loose: 1000,
    cib: 3000,
    new: 9000,
    source: 'seed',
    observedAt: '2026-10-01',
  },
  r_jp: {
    gameId: 'g1',
    region: 'jp',
    loose: 700,
    cib: 2000,
    new: null,
    source: 'seed',
    observedAt: '2026-10-01',
  },
}

const item = (over: Partial<CollectionItem>): CollectionItem =>
  ({
    id: 'i',
    releaseId: 'r_eu',
    hasCart: true,
    hasBox: false,
    hasManual: false,
    condition: null,
    purchasePriceCents: null,
    purchaseCurrency: null,
    ...over,
  }) as CollectionItem

describe('gradeFor (master prompt §9)', () => {
  it('sealed → new, cart+box+manual → CIB, otherwise loose', () => {
    expect(gradeFor({ condition: 'sealed', hasCart: true, hasBox: false, hasManual: false })).toBe(
      'new',
    )
    expect(gradeFor({ condition: 'good', hasCart: true, hasBox: true, hasManual: true })).toBe(
      'cib',
    )
    expect(gradeFor({ condition: null, hasCart: true, hasBox: true, hasManual: false })).toBe(
      'loose',
    )
  })
})

describe('collectionValue', () => {
  it('sums the latest price per item at its grade and counts unpriced items', () => {
    const items = [
      item({ id: 'a' }),
      item({
        id: 'b',
        hasBox: true,
        hasManual: true,
        purchasePriceCents: 2500,
        purchaseCurrency: 'EUR',
      }),
      item({ id: 'c', releaseId: 'r_jp', condition: 'sealed' }), // no "new" price for JP
      item({ id: 'd', releaseId: 'unknown' }),
    ]
    expect(itemValue(items[1], prices)).toBe(3000)
    expect(collectionValue(items, prices)).toEqual({
      totalCents: 4000,
      pricedCount: 2,
      unpricedCount: 2,
      paidCents: 2500,
      demo: true,
    })
  })
})

describe('wishEstimate', () => {
  it('picks the cheapest matching release', () => {
    expect(
      wishEstimate({ gameId: 'g1', preferredRegion: null, desiredCondition: null }, prices),
    ).toEqual({
      cents: 700,
      region: 'jp',
      demo: true,
    })
    expect(
      wishEstimate({ gameId: 'g1', preferredRegion: 'eu', desiredCondition: 'sealed' }, prices)
        ?.cents,
    ).toBe(9000)
    expect(
      wishEstimate({ gameId: 'nope', preferredRegion: null, desiredCondition: null }, prices),
    ).toBeNull()
  })

  it('flags bargains only with both numbers', () => {
    expect(isBargain(900, 1000)).toBe(true)
    expect(isBargain(1100, 1000)).toBe(false)
    expect(isBargain(null, 1000)).toBe(false)
    expect(isBargain(900, null)).toBe(false)
  })
})
