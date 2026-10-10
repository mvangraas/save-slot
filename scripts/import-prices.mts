/**
 * Fetches PriceCharting prices for every release and stores them as price points.
 *
 *   node --env-file=.env.local scripts/import-prices.mts            # dry run (default)
 *   node --env-file=.env.local scripts/import-prices.mts --apply    # write
 *   options: --limit 20 (max releases)
 *
 * Needs FEATURE_PRICECHARTING=1, PRICECHARTING_API_KEY, NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SECRET_KEY. Idempotent per day: a release that already has PriceCharting prices
 * observed today is skipped. Prices are stored in USD; the site converts for display only.
 */
import { createClient } from '@supabase/supabase-js'
import { providerFlags } from '../src/config/flags.ts'
import { priceChartingProvider } from '../src/lib/providers/pricecharting.ts'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const li = args.indexOf('--limit')
const limit = li >= 0 ? Number(args[li + 1]) : 100000

if (!providerFlags().pricecharting) {
  console.error('PriceCharting is off. Set FEATURE_PRICECHARTING=1 and PRICECHARTING_API_KEY.')
  process.exit(1)
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secret = process.env.SUPABASE_SECRET_KEY
if (!url || !secret) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (server-only).')
  process.exit(1)
}
const db = createClient(url, secret, { auth: { persistSession: false } })
const pc = priceChartingProvider(process.env.PRICECHARTING_API_KEY!)
const today = new Date().toISOString().slice(0, 10)

const { data: releases, error } = await db
  .from('releases')
  .select('id, region, local_title, game:games!inner ( title, platform )')
  .limit(limit)
if (error) throw new Error(error.message)

const { data: todays, error: e2 } = await db
  .from('price_points')
  .select('release_id')
  .eq('source', 'pricecharting')
  .gte('observed_at', `${today}T00:00:00Z`)
if (e2) throw new Error(e2.message)
const done = new Set((todays ?? []).map((r) => r.release_id))

let written = 0
let missing = 0
for (const r of releases as unknown as {
  id: string
  region: 'eu' | 'us' | 'jp'
  local_title: string | null
  game: { title: string; platform: 'gb' | 'gbc' }
}[]) {
  if (done.has(r.id)) continue
  const quotes = await pc.getPrices({
    title: r.game.title,
    platform: r.game.platform,
    region: r.region,
  })
  if (quotes.length === 0) {
    missing++
  } else if (apply) {
    const { error: ins } = await db.from('price_points').insert(
      quotes.map((q) => ({
        release_id: r.id,
        grade: q.grade,
        value_cents: q.valueCents,
        currency: q.currency,
        source: 'pricecharting',
        observed_at: q.observedAt,
      })),
    )
    if (ins) throw new Error(ins.message)
    written += quotes.length
  } else {
    console.log(
      `would store ${r.game.title} [${r.region}]: ${quotes.map((q) => `${q.grade} ${q.valueCents}¢`).join(', ')}`,
    )
  }
  await new Promise((res) => setTimeout(res, 1100)) // stay well under the API rate limit
}
console.log(
  apply
    ? `Stored ${written} price points; ${missing} releases had no exact match.`
    : `Dry run: nothing written (${missing} releases without an exact match). Use --apply.`,
)
