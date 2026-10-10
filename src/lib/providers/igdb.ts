/**
 * IGDB (via the Twitch API) as a catalogue + cover source. Used only by the import script;
 * the website never calls IGDB while rendering. Runtime imports stay relative so the script can
 * run with plain `node`.
 */
import type { CartCompat, Region } from '../types.ts'
import type { CatalogImportProvider, ImportGame } from './types.ts'

export const IGDB_PLATFORM = { gb: 33, gbc: 22 } as const

/** IGDB release regions → ours. Other regions (AU, worldwide, …) are not tracked. */
const REGION: Record<number, Region> = { 1: 'eu', 2: 'us', 5: 'jp' }
/** IGDB date formats: 0 = full date, 1 = year + month, 2 = year. */
const PRECISION: Record<number, 'day' | 'month' | 'year'> = { 0: 'day', 1: 'month', 2: 'year' }

export type IgdbGame = {
  id: number
  name: string
  slug?: string
  summary?: string
  url?: string
  platforms?: number[]
  genres?: { name: string }[]
  involved_companies?: { company?: { name: string }; developer?: boolean; publisher?: boolean }[]
  release_dates?: {
    date?: number
    platform?: number
    region?: number
    release_region?: number
    category?: number
    date_format?: number
  }[]
  cover?: { image_id: string; width?: number; height?: number }
}

export const toSlug = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'game'

/** Pure mapping from an IGDB record to our import shape. */
export function igdbToImportGame(g: IgdbGame): ImportGame | null {
  const platforms = new Set(g.platforms ?? [])
  const onGb = platforms.has(IGDB_PLATFORM.gb)
  const onGbc = platforms.has(IGDB_PLATFORM.gbc)
  if (!onGb && !onGbc) return null

  const needsReview: string[] = []
  // IGDB doesn't say whether a GBC game also runs on the original Game Boy.
  let compat: CartCompat = 'gb'
  if (onGbc) {
    compat = 'gbc_dual'
    if (!onGb) needsReview.push('compat')
  }

  const seen = new Set<Region>()
  const releases: ImportGame['releases'] = []
  for (const r of [...(g.release_dates ?? [])].sort((a, b) => (a.date ?? 0) - (b.date ?? 0))) {
    if (r.platform !== undefined && !Object.values(IGDB_PLATFORM).includes(r.platform as 33 | 22)) {
      continue
    }
    const region = REGION[r.release_region ?? r.region ?? -1]
    if (!region || seen.has(region)) continue
    seen.add(region)
    const precision = PRECISION[r.date_format ?? r.category ?? -1] ?? null
    releases.push({
      region,
      date: r.date && precision ? new Date(r.date * 1000).toISOString().slice(0, 10) : null,
      precision: r.date && precision ? precision : null,
    })
  }
  if (releases.length === 0) needsReview.push('regions')

  const company = (role: 'developer' | 'publisher') =>
    g.involved_companies?.find((c) => c[role] && c.company?.name)?.company?.name ?? null

  return {
    externalId: String(g.id),
    source: 'igdb',
    title: g.name.trim(),
    slug: toSlug(g.slug ?? g.name),
    compat,
    description: g.summary?.trim() || null,
    developer: company('developer'),
    publisher: company('publisher'),
    genres: (g.genres ?? []).map((x) => x.name).filter(Boolean),
    releases,
    cover: g.cover?.image_id
      ? {
          kind: 'box_front',
          url: `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`,
          width: g.cover.width ?? null,
          height: g.cover.height ?? null,
          sourceUrl: g.url ?? null,
          license: 'IGDB API terms of use',
          attribution: 'Cover via IGDB.com',
        }
      : null,
    needsReview,
  }
}

const FIELDS = [
  'name',
  'slug',
  'summary',
  'url',
  'platforms',
  'genres.name',
  'involved_companies.company.name',
  'involved_companies.developer',
  'involved_companies.publisher',
  'release_dates.date',
  'release_dates.platform',
  'release_dates.region',
  'release_dates.release_region',
  'release_dates.category',
  'release_dates.date_format',
  'cover.image_id',
  'cover.width',
  'cover.height',
].join(',')

export function igdbProvider(
  creds: { clientId: string; clientSecret: string },
  fetchImpl: typeof fetch = fetch,
): CatalogImportProvider {
  let token: { value: string; expires: number } | null = null

  async function accessToken() {
    if (token && token.expires > Date.now() + 60_000) return token.value
    const url = new URL('https://id.twitch.tv/oauth2/token')
    url.searchParams.set('client_id', creds.clientId)
    url.searchParams.set('client_secret', creds.clientSecret)
    url.searchParams.set('grant_type', 'client_credentials')
    const res = await fetchImpl(url, { method: 'POST', signal: AbortSignal.timeout(15_000) })
    if (!res.ok) throw new Error(`Twitch token: HTTP ${res.status}`)
    const json = (await res.json()) as { access_token: string; expires_in: number }
    token = { value: json.access_token, expires: Date.now() + json.expires_in * 1000 }
    return token.value
  }

  return {
    name: 'igdb',
    async listGames({ offset, limit }) {
      const body = `fields ${FIELDS}; where platforms = (${IGDB_PLATFORM.gb},${IGDB_PLATFORM.gbc}); sort id asc; limit ${Math.min(limit, 500)}; offset ${offset};`
      const res = await fetchImpl('https://api.igdb.com/v4/games', {
        method: 'POST',
        headers: {
          'Client-ID': creds.clientId,
          Authorization: `Bearer ${await accessToken()}`,
          'Content-Type': 'text/plain',
        },
        body,
        signal: AbortSignal.timeout(30_000),
      })
      if (res.status === 429) throw new Error('IGDB rate limit hit (429); try again later')
      if (!res.ok) throw new Error(`IGDB games: HTTP ${res.status}`)
      const games = (await res.json()) as IgdbGame[]
      return games.map(igdbToImportGame).filter((g): g is ImportGame => g !== null)
    },
  }
}
