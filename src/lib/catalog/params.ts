import { z } from 'zod'
import type { CartCompat, Platform, Region } from '@/lib/types'
import { GAME_FEATURES, GAME_SORTS, type GameFilters, type GameQuery, type GameSort } from './types'

export const PAGE_SIZE = 24

type RawParams = Record<string, string | string[] | undefined>

const list = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? [v] : [])
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())
    .filter(Boolean)
const one = (v: string | string[] | undefined): string | undefined =>
  (Array.isArray(v) ? v[0] : v)?.trim() || undefined

const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  .max(80)
const year = z.coerce.number().int().min(1989).max(2010)
const platform = z.enum(['gb', 'gbc'])
const compat = z.enum(['gb', 'gbc_dual', 'gbc_only'])
const region = z.enum(['eu', 'us', 'jp'])
const feature = z.enum(GAME_FEATURES)
const sort = z.enum(GAME_SORTS)

/** Keep only the values that validate; silently drop junk from hand-edited URLs. */
function valid<T>(schema: z.ZodType<T>, values: string[]): T[] {
  const out: T[] = []
  for (const v of values) {
    const r = schema.safeParse(v)
    if (r.success && !out.includes(r.data)) out.push(r.data)
  }
  return out
}
function validOne<T>(schema: z.ZodType<T>, value: string | undefined): T | undefined {
  if (value === undefined) return undefined
  const r = schema.safeParse(value)
  return r.success ? r.data : undefined
}

/**
 * URL search params → a validated GameQuery.
 * `preset` fixes the platform on /gb and /gbc regardless of the URL.
 */
export function parseGameQuery(params: RawParams, preset: { platform?: Platform } = {}): GameQuery {
  const q = one(params.q)?.slice(0, 80)
  let yearFrom = validOne(year, one(params.from))
  let yearTo = validOne(year, one(params.to))
  if (yearFrom && yearTo && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom]

  const filters: GameFilters = {
    platform: preset.platform ?? validOne(platform, one(params.platform)),
    compat: valid(compat, list(params.compat)) as CartCompat[],
    regions: valid(region, list(params.region)) as Region[],
    genres: valid(slug, list(params.genre)),
    yearFrom,
    yearTo,
    publisher: validOne(slug, one(params.publisher)),
    developer: validOne(slug, one(params.developer)),
    series: validOne(slug, one(params.series)),
    features: valid(feature, list(params.feature)),
  }

  const requestedSort = validOne(sort, one(params.sort))
  const fallback: GameSort = q ? 'relevance' : 'title'
  const s = requestedSort === 'relevance' && !q ? 'title' : (requestedSort ?? fallback)

  const page = Math.min(Math.max(Number.parseInt(one(params.page) ?? '1', 10) || 1, 1), 500)

  return { q, filters: compact(filters), sort: s, page, pageSize: PAGE_SIZE }
}

function compact(f: GameFilters): GameFilters {
  const out: GameFilters = {}
  for (const [k, v] of Object.entries(f) as [keyof GameFilters, unknown][]) {
    if (v === undefined || (Array.isArray(v) && v.length === 0)) continue
    ;(out as Record<string, unknown>)[k] = v
  }
  return out
}

/** GameQuery → URLSearchParams (inverse of parseGameQuery). Omits defaults and preset platform. */
export function serializeGameQuery(
  query: Partial<GameQuery> & { filters?: GameFilters },
  opts: { omitPlatform?: boolean } = {},
): URLSearchParams {
  const p = new URLSearchParams()
  const f = query.filters ?? {}
  if (query.q) p.set('q', query.q)
  if (f.platform && !opts.omitPlatform) p.set('platform', f.platform)
  f.compat?.forEach((v) => p.append('compat', v))
  f.regions?.forEach((v) => p.append('region', v))
  f.genres?.forEach((v) => p.append('genre', v))
  if (f.yearFrom) p.set('from', String(f.yearFrom))
  if (f.yearTo) p.set('to', String(f.yearTo))
  if (f.publisher) p.set('publisher', f.publisher)
  if (f.developer) p.set('developer', f.developer)
  if (f.series) p.set('series', f.series)
  f.features?.forEach((v) => p.append('feature', v))
  const defaultSort = query.q ? 'relevance' : 'title'
  if (query.sort && query.sort !== defaultSort) p.set('sort', query.sort)
  if (query.page && query.page > 1) p.set('page', String(query.page))
  return p
}

export function hrefFor(basePath: string, params: URLSearchParams): string {
  const s = params.toString()
  return s ? `${basePath}?${s}` : basePath
}

/** Filters → the jsonb shape expected by public.search_games. */
export function toRpcFilters(f: GameFilters): Record<string, unknown> {
  return {
    ...(f.platform && { platform: f.platform }),
    ...(f.compat?.length && { compat: f.compat }),
    ...(f.regions?.length && { regions: f.regions }),
    ...(f.genres?.length && { genres: f.genres }),
    ...(f.yearFrom && { year_from: f.yearFrom }),
    ...(f.yearTo && { year_to: f.yearTo }),
    ...(f.publisher && { publisher: f.publisher }),
    ...(f.developer && { developer: f.developer }),
    ...(f.series && { series: f.series }),
    ...(f.features?.length && { features: f.features }),
  }
}

export function hasActiveFilters(f: GameFilters, opts: { ignorePlatform?: boolean } = {}): boolean {
  return Object.keys(f).some((k) => !(opts.ignorePlatform && k === 'platform'))
}
