import { describe, expect, it } from 'vitest'
import { buildPriceIndex, fxFromEnv, type PriceRow } from './price-index'

const row = (over: Partial<PriceRow>): PriceRow => ({
  releaseId: 'r1',
  gameId: 'g1',
  region: 'eu',
  grade: 'loose',
  valueCents: 1000,
  currency: 'EUR',
  source: 'seed',
  observedAt: '2026-10-01T00:00:00Z',
  ...over,
})

describe('buildPriceIndex', () => {
  it('keeps the newest price per grade', () => {
    const idx = buildPriceIndex([
      row({ valueCents: 900, observedAt: '2026-09-01T00:00:00Z' }),
      row({ valueCents: 1000 }),
      row({ grade: 'cib', valueCents: 3000 }),
    ])
    expect(idx.r1).toMatchObject({ loose: 1000, cib: 3000, new: null, source: 'seed' })
  })

  it('prefers real sources over demo data', () => {
    const idx = buildPriceIndex([
      row({ grade: 'cib', valueCents: 3000 }),
      row({ source: 'manual', valueCents: 1500, observedAt: '2026-08-01T00:00:00Z' }),
    ])
    expect(idx.r1).toMatchObject({ loose: 1500, cib: null, source: 'manual' })
  })

  it('ignores foreign currencies unless a display rate is configured', () => {
    const usd = row({ source: 'pricecharting', currency: 'USD', valueCents: 2000 })
    expect(buildPriceIndex([usd]).r1).toBeUndefined()
    expect(buildPriceIndex([usd, row({})]).r1.source).toBe('seed')
    const idx = buildPriceIndex([usd], { USD: 0.9 })
    expect(idx.r1).toMatchObject({ loose: 1800, fx: { from: 'USD', rate: 0.9 } })
  })

  it('reads the FX rate from env defensively', () => {
    expect(fxFromEnv({ PRICE_FX_USD_EUR: '0.92' })).toEqual({ USD: 0.92 })
    expect(fxFromEnv({ PRICE_FX_USD_EUR: 'abc' })).toEqual({})
    expect(fxFromEnv({})).toEqual({})
  })
})
