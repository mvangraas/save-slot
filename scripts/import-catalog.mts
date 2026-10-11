/**
 * Imports Game Boy / Game Boy Color games from IGDB into Supabase.
 *
 *   node --env-file=.env.local scripts/import-catalog.mts            # dry run (default)
 *   node --env-file=.env.local scripts/import-catalog.mts --apply    # write
 *   options: --limit 50 (max games to read) --offset 0
 *
 * Needs FEATURE_IGDB=1, IGDB_CLIENT_ID, IGDB_CLIENT_SECRET, NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SECRET_KEY. Idempotent: re-running only fills in what is missing.
 */
import { createClient } from '@supabase/supabase-js'
import { providerFlags } from '../src/config/flags.ts'
import { planCatalogImport, summarize, type ExistingGame } from '../src/lib/import/plan.ts'
import { igdbProvider, toSlug } from '../src/lib/providers/igdb.ts'
import type { ImportGame } from '../src/lib/providers/types.ts'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const num = (flag: string, fallback: number) => {
  const i = args.indexOf(flag)
  return i >= 0 ? Number(args[i + 1]) : fallback
}
const limit = num('--limit', 5000)
const startOffset = num('--offset', 0)

const flags = providerFlags()
if (!flags.igdb) {
  console.error('IGDB is off. Set FEATURE_IGDB=1, IGDB_CLIENT_ID and IGDB_CLIENT_SECRET.')
  process.exit(1)
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
if (!url || !secret) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (server-only).')
  process.exit(1)
}
const db = createClient(url, secret, { auth: { persistSession: false } })
const igdb = igdbProvider({
  clientId: process.env.IGDB_CLIENT_ID!,
  clientSecret: process.env.IGDB_CLIENT_SECRET!,
})
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const must = <T,>(res: { data: T; error: { message: string } | null }, what: string): T => {
  if (res.error) throw new Error(`${what}: ${res.error.message}`)
  return res.data
}

// 1. Read IGDB (paged, gently: IGDB allows 4 requests/second)
const incoming: ImportGame[] = []
for (let offset = startOffset; incoming.length < limit; offset += 500) {
  const page = await igdb.listGames({ offset, limit: Math.min(500, limit - incoming.length) })
  incoming.push(...page)
  console.log(`IGDB: read ${incoming.length} games`)
  if (page.length < 500) break
  await sleep(300)
}

// 2. What we already have
const games = must(
  await db
    .from('games')
    .select('id, slug, igdb_id, description, releases ( region ), media ( kind )'),
  'games',
) as {
  id: string
  slug: string
  igdb_id: number | null
  description: string | null
  releases: { region: string }[]
  media: { kind: string }[]
}[]
const existing: ExistingGame[] = games.map((g) => ({
  id: g.id,
  slug: g.slug,
  igdbId: g.igdb_id === null ? null : String(g.igdb_id),
  hasDescription: !!g.description,
  hasCover: g.media.some((m) => m.kind === 'boxart_front'),
  regions: g.releases.map((r) => r.region as ExistingGame['regions'][number]),
}))

// 3. Plan
const ops = planCatalogImport(existing, incoming)
const summary = summarize(ops)
console.log(`Plan: ${summary.create} new, ${summary.update} updated, ${summary.skip} unchanged`)
if (summary.needsReview.length) {
  console.log(`Needs manual review (${summary.needsReview.length}):`)
  for (const line of summary.needsReview.slice(0, 50)) console.log(`  - ${line}`)
}
if (!apply) {
  console.log('Dry run: nothing written. Re-run with --apply to import.')
  process.exit(0)
}

// 4. Apply
const companyIds = new Map<string, string>()
async function companyId(name: string | null) {
  if (!name) return null
  const slug = toSlug(name)
  if (!companyIds.has(slug)) {
    const row = must(
      await db
        .from('companies')
        .upsert({ slug, name }, { onConflict: 'slug' })
        .select('id')
        .single(),
      'companies',
    ) as { id: string }
    companyIds.set(slug, row.id)
  }
  return companyIds.get(slug)!
}
const genreIds = new Map<string, string>()
async function genreId(name: string) {
  const slug = toSlug(name)
  if (!genreIds.has(slug)) {
    const row = must(
      await db
        .from('genres')
        .upsert({ slug, name }, { onConflict: 'slug', ignoreDuplicates: false })
        .select('id')
        .single(),
      'genres',
    ) as { id: string }
    genreIds.set(slug, row.id)
  }
  return genreIds.get(slug)!
}
async function addReleases(gameId: string, game: ImportGame, releases: ImportGame['releases']) {
  if (releases.length === 0) return
  const publisher = await companyId(game.publisher)
  must(
    await db.from('releases').insert(
      releases.map((r) => ({
        game_id: gameId,
        region: r.region,
        release_date: r.date,
        release_date_precision: r.date ? r.precision : null,
        publisher_id: publisher,
        source: 'igdb',
      })),
    ),
    'releases',
  )
}
async function addCover(gameId: string, game: ImportGame) {
  if (!game.cover) return
  const c = game.cover
  must(
    await db.from('media').insert({
      game_id: gameId,
      kind: c.kind,
      url: c.url,
      width: c.width,
      height: c.height,
      source: 'igdb',
      source_url: c.sourceUrl,
      license: c.license,
      attribution: c.attribution,
    }),
    'media',
  )
}

let done = 0
for (const op of ops) {
  if (op.kind === 'skip') continue
  if (op.kind === 'create') {
    const g = op.game
    const row = must(
      await db
        .from('games')
        .insert({
          slug: g.slug,
          title: g.title,
          platform: g.compat === 'gb' ? 'gb' : 'gbc',
          compat: g.compat,
          description: g.description,
          developer_id: await companyId(g.developer),
          igdb_id: Number(g.externalId),
          source: 'igdb',
          external_ids: { igdb: g.externalId, needs_review: g.needsReview },
        })
        .select('id')
        .single(),
      `game ${g.slug}`,
    ) as { id: string }
    for (const name of g.genres) {
      must(
        await db.from('game_genres').upsert({ game_id: row.id, genre_id: await genreId(name) }),
        'game_genres',
      )
    }
    await addReleases(row.id, g, g.releases)
    await addCover(row.id, g)
  } else {
    const patch: Record<string, unknown> = {}
    if (op.linkExternalId) patch.igdb_id = Number(op.game.externalId)
    if (op.setDescription) patch.description = op.game.description
    if (Object.keys(patch).length) {
      must(await db.from('games').update(patch).eq('id', op.gameId), `update ${op.slug}`)
    }
    await addReleases(op.gameId, op.game, op.addRegions)
    if (op.addCover) await addCover(op.gameId, op.game)
  }
  if (++done % 25 === 0) console.log(`  applied ${done}`)
}
console.log(`Done: ${done} games written. The site picks this up within the hour (catalog cache).`)
