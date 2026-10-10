import { describe, expect, it } from 'vitest'
import { seedCatalog } from '@/lib/catalog/seed-provider'
import { computeStats } from './stats'
import type { CollectionItem, PlayEntry } from './types'

const copy = (
  slug: string,
  region: CollectionItem['region'],
  platform: 'gb' | 'gbc',
  year: number,
  extra: Partial<CollectionItem> = {},
) =>
  ({
    id: `${slug}-${region}`,
    releaseId: `seed:${slug}:${region}`,
    region,
    gameId: `seed:${slug}`,
    gameSlug: slug,
    gameTitle: slug,
    platform,
    compat: platform === 'gb' ? 'gb' : 'gbc_dual',
    firstReleaseYear: year,
    hasCart: true,
    hasBox: false,
    hasManual: false,
    createdAt: '2026-01-01',
    ...extra,
  }) as CollectionItem

describe('computeStats', () => {
  it('computes completion, histogram, publishers, CIB and play counts', async () => {
    const [games, facets] = await Promise.all([seedCatalog.allGames(), seedCatalog.facets()])
    const items = [
      copy('tetris', 'eu', 'gb', 1989),
      copy('tetris', 'jp', 'gb', 1989, { hasBox: true, hasManual: true }),
      copy('pokemon-gold', 'jp', 'gbc', 1999),
      copy('golf', 'us', 'gb', 1989),
    ]
    const plays = [
      { status: 'playing' },
      { status: 'completed' },
      { status: 'completed' },
    ] as PlayEntry[]
    const s = computeStats(items, plays, games, facets)

    expect(s.ownedGames).toBe(3)
    expect(s.copies).toBe(4)
    expect(s.cibCopies).toBe(1)
    expect(s.platform).toEqual([
      { key: 'gb', label: 'Game Boy', owned: 2, total: 24 },
      { key: 'gbc', label: 'Game Boy Color', owned: 1, total: 15 },
    ])
    // region completion only counts copies from that region
    expect(s.region.find((r) => r.key === 'jp')).toMatchObject({
      owned: 2,
      total: facets.regionCounts.jp,
    })
    expect(s.region.find((r) => r.key === 'eu')?.owned).toBe(1)
    expect(s.years.find((y) => y.year === 1989)).toEqual({ year: 1989, gb: 2, gbc: 0 })
    expect(s.years.find((y) => y.year === 1999)).toEqual({ year: 1999, gb: 0, gbc: 1 })
    expect(s.publishers[0]).toEqual({ label: 'Nintendo', count: 3 })
    expect(s.genre.find((g) => g.key === 'sports')).toMatchObject({ owned: 1, total: 2 })
    expect(s.play).toEqual({ backlog: 0, playing: 1, completed: 2, abandoned: 0 })
  })
})
