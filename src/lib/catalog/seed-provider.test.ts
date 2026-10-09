import { describe, expect, it } from 'vitest'
import { seedCatalog } from './seed-provider'
import type { GameFilters } from './types'

const search = (q: string | undefined, filters: GameFilters = {}, page = 1, pageSize = 100) =>
  seedCatalog.search({ q, filters, sort: q ? 'relevance' : 'title', page, pageSize })

// These counts match public.search_games on the real database (checked against Supabase),
// so the in-memory provider behaves the same as production.
describe('seed catalogue search (parity with search_games)', () => {
  it.each([
    ['accent-insensitive title', 'pokemon', {}, 8],
    ['regional title', 'rockman', {}, 1],
    ['developer name', 'hal laboratory', {}, 3],
    ['GBC-only carts', undefined, { compat: ['gbc_only'] }, 9],
    ['JP releases in RPG', undefined, { regions: ['jp'], genres: ['rpg'] }, 8],
    ['year range', undefined, { yearFrom: 1989, yearTo: 1990 }, 9],
    ['SGB enhanced', undefined, { features: ['sgb_enhanced'] }, 9],
    ['publisher', undefined, { publisher: 'capcom' }, 3],
    ['platform', undefined, { platform: 'gbc' }, 15],
  ] as [string, string | undefined, GameFilters, number][])(
    '%s',
    async (_label, q, filters, expected) => {
      expect((await search(q, filters)).total).toBe(expected)
    },
  )

  it('requires every word to match', async () => {
    expect((await search('zelda oracle')).total).toBe(2)
    expect((await search('zelda tetris')).total).toBe(0)
  })

  it('paginates', async () => {
    const page2 = await search(undefined, {}, 2, 10)
    expect(page2.items).toHaveLength(10)
    expect(page2.total).toBe(39)
    expect(page2.pageCount).toBe(4)
  })

  it('sorts by year', async () => {
    const r = await seedCatalog.search({ filters: {}, sort: 'year_desc', page: 1, pageSize: 1 })
    expect(r.items[0].title).toBe('Shantae')
  })
})

describe('seed catalogue details', () => {
  it('returns a full game', async () => {
    const g = await seedCatalog.getGame('pokemon-gold')
    expect(g).toMatchObject({
      title: 'Pokémon Gold',
      platform: 'gbc',
      compat: 'gbc_dual',
      firstReleaseYear: 1999,
      developer: { slug: 'game-freak' },
      series: { slug: 'pokemon' },
    })
    expect(g?.features).toContain('infrared')
    expect(g?.releases.map((r) => r.region)).toEqual(['jp', 'us', 'eu'])
    expect(g?.releases[0].localTitle).toBe('Pocket Monsters Kin')
  })

  it('returns null for unknown slugs', async () => {
    expect(await seedCatalog.getGame('nope')).toBeNull()
  })

  it('computes facets', async () => {
    const f = await seedCatalog.facets()
    expect(f.platformCounts).toEqual({ gb: 24, gbc: 15 })
    expect(f.yearMin).toBe(1989)
    expect(f.yearMax).toBe(2002)
    expect(f.genres.find((g) => g.slug === 'rpg')?.count).toBe(8)
  })

  it('suggests titles', async () => {
    const s = await seedCatalog.suggest('wario', 6)
    expect(s.map((x) => x.slug)).toContain('wario-land-3')
  })
})
