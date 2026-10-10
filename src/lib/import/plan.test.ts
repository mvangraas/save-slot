import { describe, expect, it } from 'vitest'
import type { ImportGame } from '../providers/types'
import { planCatalogImport, summarize, type ExistingGame } from './plan'

const game = (over: Partial<ImportGame> = {}): ImportGame => ({
  externalId: '1',
  source: 'igdb',
  title: 'Tetris',
  slug: 'tetris',
  compat: 'gb',
  description: 'Blocks.',
  developer: null,
  publisher: null,
  genres: [],
  releases: [
    { region: 'eu', date: '1990-09-28', precision: 'day' },
    { region: 'jp', date: '1989-06-14', precision: 'day' },
  ],
  cover: null,
  needsReview: [],
  ...over,
})
const have = (over: Partial<ExistingGame> = {}): ExistingGame => ({
  id: 'g1',
  slug: 'tetris',
  igdbId: null,
  hasDescription: true,
  hasCover: false,
  regions: ['eu'],
  ...over,
})

describe('planCatalogImport', () => {
  it('links a seed game by slug and only fills what is missing', () => {
    const [op] = planCatalogImport([have()], [game()])
    expect(op).toMatchObject({
      kind: 'update',
      gameId: 'g1',
      linkExternalId: true,
      setDescription: false,
      addCover: false,
    })
    expect(op.kind === 'update' && op.addRegions.map((r) => r.region)).toEqual(['jp'])
  })

  it('is idempotent: a second run changes nothing', () => {
    const [op] = planCatalogImport([have({ igdbId: '1', regions: ['eu', 'jp'] })], [game()])
    expect(op).toEqual({ kind: 'skip', slug: 'tetris', reason: 'up to date' })
  })

  it('never re-links a slug owned by another IGDB id, and creates unique slugs', () => {
    const ops = planCatalogImport(
      [have({ igdbId: '99' })],
      [game({ externalId: '2' }), game({ externalId: '3' })],
    )
    expect(ops[0]).toEqual({
      kind: 'skip',
      slug: 'tetris',
      reason: 'slug already linked to another IGDB id',
    })
    const fresh = planCatalogImport([], [game({ externalId: '2' }), game({ externalId: '3' })])
    expect(fresh.map((o) => o.kind === 'create' && o.game.slug)).toEqual(['tetris', 'tetris-2'])
  })

  it('summarises and lists items that need review', () => {
    const s = summarize(
      planCatalogImport([], [game({ externalId: '5', slug: 'x', needsReview: ['compat'] })]),
    )
    expect(s).toEqual({ create: 1, update: 0, skip: 0, needsReview: ['x: compat'] })
  })
})
