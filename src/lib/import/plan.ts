/**
 * Pure planning for the catalogue import, so it can be unit-tested and shown as a dry run.
 * Idempotent by design: games match on external id first, then on slug; existing verified data
 * is never overwritten, only missing pieces are filled in.
 */
import type { Region } from '../types.ts'
import type { ImportGame } from '../providers/types.ts'

export type ExistingGame = {
  id: string
  slug: string
  igdbId: string | null
  hasDescription: boolean
  hasCover: boolean
  regions: Region[]
}

export type GameOp =
  | { kind: 'create'; game: ImportGame }
  | {
      kind: 'update'
      gameId: string
      slug: string
      game: ImportGame
      linkExternalId: boolean
      setDescription: boolean
      addRegions: ImportGame['releases']
      addCover: boolean
    }
  | { kind: 'skip'; slug: string; reason: string }

export function planCatalogImport(existing: ExistingGame[], incoming: ImportGame[]): GameOp[] {
  const byExternal = new Map(existing.filter((e) => e.igdbId).map((e) => [e.igdbId!, e]))
  const bySlug = new Map(existing.map((e) => [e.slug, e]))
  const claimedSlugs = new Set<string>()
  const ops: GameOp[] = []

  for (const game of incoming) {
    const match = byExternal.get(game.externalId) ?? bySlug.get(game.slug)
    if (!match) {
      let slug = game.slug
      for (let i = 2; bySlug.has(slug) || claimedSlugs.has(slug); i++) slug = `${game.slug}-${i}`
      claimedSlugs.add(slug)
      ops.push({ kind: 'create', game: { ...game, slug } })
      continue
    }
    if (match.igdbId && match.igdbId !== game.externalId) {
      ops.push({ kind: 'skip', slug: match.slug, reason: 'slug already linked to another IGDB id' })
      continue
    }
    const have = new Set(match.regions)
    const op: Extract<GameOp, { kind: 'update' }> = {
      kind: 'update',
      gameId: match.id,
      slug: match.slug,
      game,
      linkExternalId: !match.igdbId,
      setDescription: !match.hasDescription && !!game.description,
      addRegions: game.releases.filter((r) => !have.has(r.region)),
      addCover: !match.hasCover && !!game.cover,
    }
    const changes =
      op.linkExternalId || op.setDescription || op.addRegions.length > 0 || op.addCover
    ops.push(changes ? op : { kind: 'skip', slug: match.slug, reason: 'up to date' })
  }
  return ops
}

export function summarize(ops: GameOp[]) {
  return {
    create: ops.filter((o) => o.kind === 'create').length,
    update: ops.filter((o) => o.kind === 'update').length,
    skip: ops.filter((o) => o.kind === 'skip').length,
    needsReview: ops
      .filter((o) => o.kind !== 'skip' && o.game.needsReview.length > 0)
      .map(
        (o) =>
          `${o.kind === 'skip' ? o.slug : o.game.slug}: ${o.kind !== 'skip' ? o.game.needsReview.join(', ') : ''}`,
      ),
  }
}
