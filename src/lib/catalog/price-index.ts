import type { Region } from '@/lib/types'
import type { PriceIndex } from './types'

export type PriceRow = {
  releaseId: string
  gameId: string
  region: Region
  grade: 'loose' | 'cib' | 'new'
  valueCents: number
  currency: string
  source: string
  observedAt: string
}

/**
 * Newest price per release and grade. Real sources win over seed/demo data for a release.
 * Non-EUR prices are only used when a conversion rate is configured; the rate is kept on the
 * entry so the UI can say it was converted (master prompt §9: convert for display only).
 */
export function buildPriceIndex(rows: PriceRow[], fx: Record<string, number> = {}): PriceIndex {
  const byRelease = new Map<string, PriceRow[]>()
  for (const r of rows) {
    if (r.currency !== 'EUR' && !fx[r.currency]) continue
    byRelease.set(r.releaseId, [...(byRelease.get(r.releaseId) ?? []), r])
  }
  const out: PriceIndex = {}
  for (const [releaseId, all] of byRelease) {
    const real = all.filter((r) => r.source !== 'seed')
    const pick = (real.length > 0 ? real : all).sort((a, b) =>
      b.observedAt.localeCompare(a.observedAt),
    )
    const newest = pick[0]
    const entry = (out[releaseId] = {
      gameId: newest.gameId,
      region: newest.region,
      loose: null as number | null,
      cib: null as number | null,
      new: null as number | null,
      source: newest.source,
      observedAt: newest.observedAt,
      ...(newest.currency !== 'EUR'
        ? { fx: { from: newest.currency, rate: fx[newest.currency] } }
        : {}),
    })
    for (const r of pick) {
      if (entry[r.grade] !== null) continue
      const rate = r.currency === 'EUR' ? 1 : fx[r.currency]
      entry[r.grade] = Math.round(r.valueCents * rate)
    }
  }
  return out
}

/** Display-only FX rates from env, e.g. PRICE_FX_USD_EUR=0.92. */
export function fxFromEnv(env: Record<string, string | undefined> = process.env) {
  const out: Record<string, number> = {}
  const usd = Number(env.PRICE_FX_USD_EUR)
  if (Number.isFinite(usd) && usd > 0 && usd < 10) out.USD = usd
  return out
}
