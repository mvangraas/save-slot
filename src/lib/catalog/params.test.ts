import { describe, expect, it } from 'vitest'
import { hasActiveFilters, parseGameQuery, serializeGameQuery, toRpcFilters } from './params'

describe('parseGameQuery', () => {
  it('returns defaults for empty params', () => {
    expect(parseGameQuery({})).toEqual({
      q: undefined,
      filters: {},
      sort: 'title',
      page: 1,
      pageSize: 24,
    })
  })

  it('parses every filter', () => {
    const q = parseGameQuery({
      q: '  zelda ',
      platform: 'gbc',
      compat: ['gbc_dual', 'gbc_only'],
      region: 'jp,us',
      genre: 'rpg',
      from: '1995',
      to: '2001',
      publisher: 'nintendo',
      developer: 'game-freak',
      series: 'pokemon',
      feature: ['infrared', 'rumble'],
      sort: 'year_desc',
      page: '3',
    })
    expect(q).toEqual({
      q: 'zelda',
      filters: {
        platform: 'gbc',
        compat: ['gbc_dual', 'gbc_only'],
        regions: ['jp', 'us'],
        genres: ['rpg'],
        yearFrom: 1995,
        yearTo: 2001,
        publisher: 'nintendo',
        developer: 'game-freak',
        series: 'pokemon',
        features: ['infrared', 'rumble'],
      },
      sort: 'year_desc',
      page: 3,
      pageSize: 24,
    })
  })

  it('drops junk values from hand-edited URLs', () => {
    const q = parseGameQuery({
      platform: 'n64',
      region: ['jp', 'mars', 'jp'],
      genre: 'DROP TABLE',
      from: 'abc',
      to: '1850',
      feature: 'jetpack',
      sort: 'random',
      page: '-4',
    })
    expect(q.filters).toEqual({ regions: ['jp'] })
    expect(q.sort).toBe('title')
    expect(q.page).toBe(1)
  })

  it('swaps an inverted year range', () => {
    const q = parseGameQuery({ from: '2000', to: '1990' })
    expect(q.filters).toMatchObject({ yearFrom: 1990, yearTo: 2000 })
  })

  it('defaults to best match when searching, and never sorts by relevance without a query', () => {
    expect(parseGameQuery({ q: 'mario' }).sort).toBe('relevance')
    expect(parseGameQuery({ sort: 'relevance' }).sort).toBe('title')
  })

  it('lets a preset platform win over the URL', () => {
    expect(parseGameQuery({ platform: 'gbc' }, { platform: 'gb' }).filters.platform).toBe('gb')
  })

  it('caps the search text and page number', () => {
    const q = parseGameQuery({ q: 'x'.repeat(200), page: '99999' })
    expect(q.q).toHaveLength(80)
    expect(q.page).toBe(500)
  })
})

describe('serializeGameQuery', () => {
  it('round-trips through parseGameQuery', () => {
    const original = parseGameQuery({
      q: 'kirby',
      region: ['eu', 'jp'],
      genre: 'platformer',
      from: '1992',
      feature: 'sgb_enhanced',
      sort: 'year_asc',
      page: '2',
    })
    const params = Object.fromEntries(
      [...serializeGameQuery(original).keys()].map((k) => [
        k,
        serializeGameQuery(original).getAll(k),
      ]),
    )
    expect(parseGameQuery(params)).toEqual(original)
  })

  it('omits defaults and the preset platform', () => {
    const p = serializeGameQuery(
      { filters: { platform: 'gb' }, sort: 'title', page: 1 },
      { omitPlatform: true },
    )
    expect(p.toString()).toBe('')
  })
})

describe('toRpcFilters', () => {
  it('maps to the snake_case shape of search_games and skips empty values', () => {
    expect(
      toRpcFilters({ regions: ['jp'], yearFrom: 1990, compat: [], features: ['link_cable'] }),
    ).toEqual({ regions: ['jp'], year_from: 1990, features: ['link_cable'] })
  })
})

describe('hasActiveFilters', () => {
  it('can ignore the preset platform', () => {
    expect(hasActiveFilters({ platform: 'gb' })).toBe(true)
    expect(hasActiveFilters({ platform: 'gb' }, { ignorePlatform: true })).toBe(false)
  })
})
