/**
 * PriceCharting (paid API) as a price source. Used only by the import script.
 * Prices come back in USD cents; the app converts for display only (PRICE_FX_USD_EUR).
 */
import type { Region } from '../types.ts'
import type { PriceProvider, PriceQuote } from './types.ts'

/** PriceCharting console names per platform and region. */
export function consoleName(platform: 'gb' | 'gbc', region: Region): string {
  const base = platform === 'gb' ? 'GameBoy' : 'GameBoy Color'
  return region === 'eu' ? `PAL ${base}` : region === 'jp' ? `JP ${base}` : base
}

type PcProduct = {
  status?: string
  'console-name'?: string
  'product-name'?: string
  'loose-price'?: number
  'cib-price'?: number
  'new-price'?: number
}

/** Pure: map an API product to quotes, ignoring wrong consoles and missing prices. */
export function pcToQuotes(
  p: PcProduct,
  expectedConsole: string,
  observedAt: string,
): PriceQuote[] {
  if (p.status !== 'success' || p['console-name'] !== expectedConsole) return []
  const out: PriceQuote[] = []
  const add = (grade: PriceQuote['grade'], v: unknown) => {
    if (typeof v === 'number' && Number.isInteger(v) && v > 0) {
      out.push({ grade, valueCents: v, currency: 'USD', observedAt })
    }
  }
  add('loose', p['loose-price'])
  add('cib', p['cib-price'])
  add('new', p['new-price'])
  return out
}

export function priceChartingProvider(
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): PriceProvider {
  return {
    name: 'pricecharting',
    async getPrices({ title, platform, region }) {
      const label = consoleName(platform, region)
      const url = new URL('https://www.pricecharting.com/api/product')
      url.searchParams.set('t', apiKey)
      url.searchParams.set('q', `${title} ${label}`)
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(15_000) })
      if (!res.ok) throw new Error(`PriceCharting: HTTP ${res.status}`)
      return pcToQuotes((await res.json()) as PcProduct, label, new Date().toISOString())
    },
  }
}
