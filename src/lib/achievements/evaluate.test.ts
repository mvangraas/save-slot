import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ACHIEVEMENTS, ICON_KEYS } from './definitions'
import { evaluateAchievements, type AchievementFacts, type CatalogGame } from './evaluate'

const game = (id: string, over: Partial<CatalogGame> = {}): CatalogGame => ({
  id,
  platform: 'gb',
  compat: 'gb',
  firstReleaseYear: 1990,
  genres: ['puzzle'],
  series: null,
  sgbEnhanced: false,
  rumble: false,
  releases: [{ region: 'eu', year: 1990 }],
  ...over,
})

const copy = (gameId: string, region: 'eu' | 'us' | 'jp' = 'eu', over = {}) => ({
  gameId,
  region,
  hasCart: true,
  hasBox: false,
  hasManual: false,
  condition: null,
  purchasePriceCents: null,
  ...over,
})

const empty: AchievementFacts = {
  copies: [],
  catalog: [],
  playStatuses: [],
  memoryCount: 0,
  ratedCount: 0,
  favoriteCount: 0,
  wishlistCount: 0,
  wishGranted: false,
}

describe('achievement definitions', () => {
  it('has at least 25 unique achievements with known icons', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(25)
    expect(new Set(ACHIEVEMENTS.map((a) => a.code)).size).toBe(ACHIEVEMENTS.length)
    for (const a of ACHIEVEMENTS) expect(ICON_KEYS).toContain(a.icon)
  })

  it('matches the Supabase migration (rows and SQL rules)', () => {
    const dir = join(process.cwd(), 'supabase/migrations')
    const file = readdirSync(dir).find((f) => f.endsWith('_achievements.sql'))!
    const sql = readFileSync(join(dir, file), 'utf8')
    for (const a of ACHIEVEMENTS) {
      expect(sql).toContain(
        `('${a.code}', '${a.name.replaceAll("'", "''")}', '${a.description.replaceAll("'", "''")}', '${a.icon}'`,
      )
      expect(sql).toContain(`then '${a.code}' end`)
    }
  })
})

describe('evaluateAchievements', () => {
  it('unlocks nothing for an empty save file', () => {
    expect(evaluateAchievements(empty).size).toBe(0)
  })

  it('counts games, not copies, for collection size', () => {
    const catalog = Array.from({ length: 10 }, (_, i) => game(`g${i}`))
    const nine = evaluateAchievements({
      ...empty,
      catalog,
      copies: [...catalog.slice(0, 9).map((g) => copy(g.id)), copy('g0'), copy('g0')],
    })
    expect(nine.has('first_cart')).toBe(true)
    expect(nine.has('ten_carts')).toBe(false)
    const ten = evaluateAchievements({ ...empty, catalog, copies: catalog.map((g) => copy(g.id)) })
    expect(ten.has('ten_carts')).toBe(true)
    expect(ten.has('gb_10')).toBe(true)
    expect(ten.has('gbc_10')).toBe(false)
  })

  it('handles condition rules: CIB, sealed and logged prices', () => {
    const catalog = [game('a')]
    const res = evaluateAchievements({
      ...empty,
      catalog,
      copies: [
        copy('a', 'eu', { hasBox: true, hasManual: true }),
        copy('a', 'eu', { condition: 'sealed', hasBox: true }),
      ],
    })
    expect(res.has('cib_first')).toBe(true)
    expect(res.has('cib_10')).toBe(false)
    expect(res.has('sealed_first')).toBe(true)
    expect(res.has('price_10')).toBe(false)
  })

  it('handles region rules', () => {
    const catalog = [
      game('a', {
        releases: [
          { region: 'eu', year: 1990 },
          { region: 'jp', year: 1989 },
        ],
      }),
      game('b', { releases: [{ region: 'us', year: 1991 }] }),
    ]
    const two = evaluateAchievements({
      ...empty,
      catalog,
      copies: [copy('a', 'eu'), copy('a', 'jp')],
    })
    expect(two.has('jp_import')).toBe(true)
    expect(two.has('regional_variant')).toBe(true)
    expect(two.has('three_regions')).toBe(false)
    const all = evaluateAchievements({
      ...empty,
      catalog,
      copies: [copy('a', 'eu'), copy('a', 'jp'), copy('b', 'us')],
    })
    expect(all.has('three_regions')).toBe(true)
    expect(all.has('us_import')).toBe(true)
  })

  it('Time Capsule needs every game of one region-year, owned from that region', () => {
    const catalog = [
      game('a', {
        releases: [
          { region: 'eu', year: 1990 },
          { region: 'us', year: 1989 },
        ],
      }),
      game('b', {
        releases: [
          { region: 'eu', year: 1990 },
          { region: 'us', year: 1990 },
        ],
      }),
    ]
    // EU 1990 = {a, b} is not complete with a(EU) + b(US), but US 1990 = {b} is.
    expect(
      evaluateAchievements({ ...empty, catalog, copies: [copy('a', 'eu'), copy('b', 'us')] }).has(
        'year_complete',
      ),
    ).toBe(true)
    expect(
      evaluateAchievements({ ...empty, catalog, copies: [copy('a', 'eu')] }).has('year_complete'),
    ).toBe(false)
    expect(
      evaluateAchievements({ ...empty, catalog, copies: [copy('a', 'eu'), copy('b', 'eu')] }).has(
        'year_complete',
      ),
    ).toBe(true)
  })

  it('handles catalogue breadth: genres, series, SGB, rumble, compat, launch year', () => {
    const catalog = [
      game('a', { genres: ['a', 'b'], series: 's', sgbEnhanced: true, firstReleaseYear: 1989 }),
      game('b', { genres: ['c'], series: 's', sgbEnhanced: true }),
      game('c', { genres: ['d', 'e'], series: 's', sgbEnhanced: true }),
      game('d', { platform: 'gbc', compat: 'gbc_only', rumble: true }),
      game('e', { sgbEnhanced: true }),
    ]
    const res = evaluateAchievements({
      ...empty,
      catalog,
      copies: catalog.map((g) => copy(g.id)),
    })
    for (const code of ['genres_5', 'series_3', 'rumble_first', 'gbc_only_first', 'launch_year'])
      expect(res.has(code as never)).toBe(true)
    expect(res.has('sgb_5')).toBe(false)
    expect(res.has('dual_mode_5')).toBe(false)
  })

  it('handles play, memory, rating and wishlist rules', () => {
    const res = evaluateAchievements({
      ...empty,
      playStatuses: ['completed', 'playing', 'playing', 'playing', 'backlog'],
      memoryCount: 5,
      ratedCount: 9,
      favoriteCount: 1,
      wishlistCount: 1,
      wishGranted: true,
    })
    for (const code of [
      'completed_first',
      'playing_3',
      'memory_first',
      'memory_5',
      'favorite_first',
      'wishlist_first',
      'wishlist_granted',
    ])
      expect(res.has(code as never)).toBe(true)
    expect(res.has('completed_10')).toBe(false)
    expect(res.has('rated_10')).toBe(false)
  })
})
