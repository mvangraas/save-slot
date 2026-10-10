import { describe, expect, it } from 'vitest'
import { providerFlags } from '@/config/flags'
import { igdbProvider, igdbToImportGame, toSlug } from './igdb'
import { consoleName, pcToQuotes, priceChartingProvider } from './pricecharting'

describe('feature flags', () => {
  it('needs both the flag and the keys', () => {
    expect(providerFlags({})).toEqual({ igdb: false, pricecharting: false })
    expect(providerFlags({ IGDB_CLIENT_ID: 'a', IGDB_CLIENT_SECRET: 'b' }).igdb).toBe(false)
    expect(providerFlags({ FEATURE_IGDB: '1', IGDB_CLIENT_ID: 'a' }).igdb).toBe(false)
    expect(
      providerFlags({ FEATURE_IGDB: '1', IGDB_CLIENT_ID: 'a', IGDB_CLIENT_SECRET: 'b' }).igdb,
    ).toBe(true)
    expect(
      providerFlags({ FEATURE_PRICECHARTING: '1', PRICECHARTING_API_KEY: 'k' }).pricecharting,
    ).toBe(true)
  })
})

describe('IGDB mapping', () => {
  const base = {
    id: 1234,
    name: 'Pokémon Gold Version',
    slug: 'pokemon-gold-version',
    summary: ' A summary. ',
    url: 'https://www.igdb.com/games/pokemon-gold-version',
    genres: [{ name: 'Role-playing (RPG)' }],
    involved_companies: [
      { company: { name: 'Game Freak' }, developer: true },
      { company: { name: 'Nintendo' }, publisher: true },
    ],
    cover: { image_id: 'abc', width: 264, height: 352 },
  }

  it('maps platforms to compat and flags GBC-only uncertainty', () => {
    expect(igdbToImportGame({ ...base, platforms: [33] })?.compat).toBe('gb')
    const both = igdbToImportGame({ ...base, platforms: [33, 22] })!
    expect(both.compat).toBe('gbc_dual')
    expect(both.needsReview).not.toContain('compat')
    const gbcOnly = igdbToImportGame({ ...base, platforms: [22] })!
    expect(gbcOnly.needsReview).toContain('compat')
    expect(igdbToImportGame({ ...base, platforms: [4] })).toBeNull()
  })

  it('keeps one release per tracked region, with date precision', () => {
    const g = igdbToImportGame({
      ...base,
      platforms: [22],
      release_dates: [
        { date: 941328000, platform: 22, region: 5, category: 0 }, // JP 1999-10-31
        { date: 1001894400, platform: 22, region: 2, category: 0 }, // US
        { date: 1001894400, platform: 22, region: 2, category: 0 }, // duplicate US
        { date: 1017619200, platform: 22, release_region: 1, date_format: 2 }, // EU, year only
        { date: 1001894400, platform: 22, region: 3, category: 0 }, // AU, not tracked
        { date: 1001894400, platform: 130, region: 1, category: 0 }, // other platform
      ],
    })!
    expect(g.releases).toEqual([
      { region: 'jp', date: '1999-10-31', precision: 'day' },
      { region: 'us', date: '2001-10-01', precision: 'day' },
      { region: 'eu', date: '2002-04-01', precision: 'year' },
    ])
  })

  it('fills company, genre, cover and attribution', () => {
    const g = igdbToImportGame({ ...base, platforms: [22] })!
    expect(g).toMatchObject({
      externalId: '1234',
      slug: 'pokemon-gold-version',
      description: 'A summary.',
      developer: 'Game Freak',
      publisher: 'Nintendo',
      genres: ['Role-playing (RPG)'],
      cover: {
        url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/abc.jpg',
        attribution: 'Cover via IGDB.com',
      },
    })
    expect(g.needsReview).toContain('regions')
  })

  it('slugifies safely', () => {
    expect(toSlug('Pokémon: Gold & Silver!')).toBe('pokemon-gold-and-silver')
    expect(toSlug('???')).toBe('game')
  })

  it('calls IGDB with a token and the platform filter', async () => {
    const calls: { url: string; body?: string }[] = []
    const fake: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), body: init?.body as string | undefined })
      if (String(input).startsWith('https://id.twitch.tv')) {
        return Response.json({ access_token: 'tok', expires_in: 3600 })
      }
      return Response.json([{ ...base, platforms: [33] }])
    }
    const games = await igdbProvider({ clientId: 'id', clientSecret: 's' }, fake).listGames({
      offset: 0,
      limit: 10,
    })
    expect(games).toHaveLength(1)
    expect(calls[1].body).toContain('where platforms = (33,22)')
    expect(calls[1].body).toContain('limit 10; offset 0;')
  })
})

describe('PriceCharting', () => {
  it('maps console names per region', () => {
    expect(consoleName('gb', 'us')).toBe('GameBoy')
    expect(consoleName('gbc', 'eu')).toBe('PAL GameBoy Color')
    expect(consoleName('gb', 'jp')).toBe('JP GameBoy')
  })

  it('only accepts the exact console and positive integer prices', () => {
    const at = '2026-10-10T00:00:00.000Z'
    const product = {
      status: 'success',
      'console-name': 'GameBoy',
      'loose-price': 1250,
      'cib-price': 0,
      'new-price': 9999,
    }
    expect(pcToQuotes(product, 'GameBoy', at)).toEqual([
      { grade: 'loose', valueCents: 1250, currency: 'USD', observedAt: at },
      { grade: 'new', valueCents: 9999, currency: 'USD', observedAt: at },
    ])
    expect(pcToQuotes(product, 'PAL GameBoy', at)).toEqual([])
    expect(pcToQuotes({ status: 'error' }, 'GameBoy', at)).toEqual([])
  })

  it('queries by title and console', async () => {
    let seen = ''
    const fake: typeof fetch = async (input) => {
      seen = String(input)
      return Response.json({ status: 'success', 'console-name': 'JP GameBoy', 'loose-price': 500 })
    }
    const quotes = await priceChartingProvider('KEY', fake).getPrices({
      title: 'Tetris',
      platform: 'gb',
      region: 'jp',
    })
    expect(new URL(seen).searchParams.get('q')).toBe('Tetris JP GameBoy')
    expect(quotes).toHaveLength(1)
  })
})
