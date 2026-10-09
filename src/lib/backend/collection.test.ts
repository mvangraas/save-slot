import { describe, expect, it } from 'vitest'
import { collectionToCsv, groupByGame, ownedPerPlatform } from './collection'
import type { CollectionItem } from './types'

const item = (over: Partial<CollectionItem>): CollectionItem => ({
  id: 'i1',
  releaseId: 'r1',
  hasCart: true,
  hasBox: false,
  hasManual: false,
  condition: null,
  purchasePriceCents: null,
  purchaseCurrency: null,
  purchasedOn: null,
  notes: null,
  region: 'eu',
  localTitle: null,
  gameId: 'g1',
  gameSlug: 'tetris',
  gameTitle: 'Tetris',
  platform: 'gb',
  compat: 'gb',
  firstReleaseYear: 1989,
  createdAt: '2026-01-01T00:00:00Z',
  ...over,
})

describe('groupByGame', () => {
  it('merges copies of the same game and tracks regions and CIB', () => {
    const games = groupByGame([
      item({ id: 'a', region: 'jp' }),
      item({
        id: 'b',
        region: 'eu',
        hasBox: true,
        hasManual: true,
        createdAt: '2026-02-01T00:00:00Z',
      }),
      item({
        id: 'c',
        gameId: 'g2',
        gameSlug: 'wl3',
        gameTitle: 'Wario Land 3',
        platform: 'gbc',
        compat: 'gbc_only',
      }),
    ])
    expect(games).toHaveLength(2)
    expect(games[0]).toMatchObject({ slug: 'tetris', copies: 2, cib: true, regions: ['eu', 'jp'] })
    expect(ownedPerPlatform(games)).toEqual({ gb: 1, gbc: 1 })
  })
})

describe('collectionToCsv', () => {
  it('writes a header and escapes commas and quotes', () => {
    const csv = collectionToCsv([
      item({ notes: 'cart, "mint"', purchasePriceCents: 1250, purchaseCurrency: 'EUR' }),
    ])
    const [header, row] = csv.trim().split('\r\n')
    expect(header.split(',')[0]).toBe('title')
    expect(row).toContain('"cart, ""mint"""')
    expect(row).toContain('12.50,EUR')
  })

  it('neutralises spreadsheet formulas', () => {
    const csv = collectionToCsv([item({ notes: '=HYPERLINK("http://x")' })])
    expect(csv).toContain(`"'=HYPERLINK(""http://x"")"`)
  })
})
