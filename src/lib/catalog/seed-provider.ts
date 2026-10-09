import {
  seedCompanies,
  seedGames,
  seedGenres,
  seedSeries,
  type SeedGame,
} from '@/data/seed/catalog'
import type { Platform } from '@/lib/types'
import { normalize } from './text'
import type {
  CatalogProvider,
  Facet,
  Facets,
  GameDetail,
  GameFeature,
  GameQuery,
  GameSummary,
  SearchResult,
  Suggestion,
} from './types'

/**
 * In-memory catalogue used when Supabase isn't configured (local dev, tests).
 * Mirrors public.search_games: every word must match title, regional titles, developer,
 * publishers, genres or series (accent-insensitive). No typo tolerance here.
 */
const companyName = new Map(seedCompanies.map((c) => [c.slug, c.name]))
const genreName = new Map(seedGenres.map((g) => [g.slug as string, g.name as string]))
const seriesName = new Map(seedSeries.map((s) => [s.slug as string, s.name as string]))

const featureKey: Record<GameFeature, keyof NonNullable<SeedGame['features']>> = {
  sgb_enhanced: 'sgbEnhanced',
  rumble: 'rumble',
  infrared: 'infrared',
  link_cable: 'linkCable',
  battery_save: 'batterySave',
}

const platformOf = (g: SeedGame): Platform => (g.compat === 'gb' ? 'gb' : 'gbc')
const firstYear = (g: SeedGame) => Math.min(...g.releases.map((r) => r.year))
const publishers = (g: SeedGame) => [...new Set(g.releases.map((r) => r.publisher ?? g.publisher))]
const searchText = (g: SeedGame) =>
  normalize(
    [
      g.title,
      ...g.releases.map((r) => r.localTitle ?? ''),
      companyName.get(g.developer) ?? '',
      ...publishers(g).map((p) => companyName.get(p) ?? ''),
      ...g.genres.map((s) => genreName.get(s) ?? ''),
      g.series ? (seriesName.get(g.series) ?? '') : '',
    ].join(' '),
  )

const order = (a: SeedGame, b: SeedGame) => normalize(a.title).localeCompare(normalize(b.title))

function toSummary(g: SeedGame): GameSummary {
  return {
    id: `seed:${g.slug}`,
    slug: g.slug,
    title: g.title,
    platform: platformOf(g),
    compat: g.compat,
    firstReleaseYear: firstYear(g),
    regions: [...new Set(g.releases.map((r) => r.region))].sort(),
    developerName: companyName.get(g.developer) ?? null,
    publisherNames: publishers(g)
      .map((p) => companyName.get(p) ?? p)
      .sort(),
    genreNames: g.genres.map((s) => genreName.get(s) ?? s).sort(),
    coverUrl: null,
    owned: false,
    wishlisted: false,
  }
}

function count(values: string[], names: Map<string, string>): Facet[] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()]
    .map(([slug, n]) => ({ slug, name: names.get(slug) ?? slug, count: n }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const seedCatalog: CatalogProvider = {
  name: 'seed',

  async search({ q, filters: f, sort, page, pageSize }: GameQuery): Promise<SearchResult> {
    const words = q ? normalize(q).split(/\s+/).filter(Boolean) : []
    let games = seedGames.filter((g) => {
      if (words.length && !words.every((w) => searchText(g).includes(w))) return false
      if (f.platform && platformOf(g) !== f.platform) return false
      if (f.compat?.length && !f.compat.includes(g.compat)) return false
      if (f.regions?.length && !g.releases.some((r) => f.regions!.includes(r.region))) return false
      if (f.genres?.length && !g.genres.some((s) => f.genres!.includes(s))) return false
      if (f.yearFrom && firstYear(g) < f.yearFrom) return false
      if (f.yearTo && firstYear(g) > f.yearTo) return false
      if (f.publisher && !publishers(g).includes(f.publisher)) return false
      if (f.developer && g.developer !== f.developer) return false
      if (f.series && g.series !== f.series) return false
      if (f.features?.some((k) => g.features?.[featureKey[k]] !== true)) return false
      return true
    })

    games = [...games].sort(order)
    if (sort === 'title_desc') games.reverse()
    if (sort === 'year_asc') games.sort((a, b) => firstYear(a) - firstYear(b) || order(a, b))
    if (sort === 'year_desc') games.sort((a, b) => firstYear(b) - firstYear(a) || order(a, b))
    if (sort === 'relevance' && words.length) {
      const score = (g: SeedGame) => (normalize(g.title).includes(words.join(' ')) ? 0 : 1)
      games.sort((a, b) => score(a) - score(b) || order(a, b))
    }

    const total = games.length
    const start = (page - 1) * pageSize
    return {
      items: games.slice(start, start + pageSize).map(toSummary),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    }
  },

  async facets(): Promise<Facets> {
    const years = seedGames.map(firstYear)
    return {
      genres: count(
        seedGames.flatMap((g) => g.genres),
        genreName,
      ),
      publishers: count(seedGames.flatMap(publishers), companyName),
      developers: count(
        seedGames.map((g) => g.developer),
        companyName,
      ),
      series: count(
        seedGames.flatMap((g) => (g.series ? [g.series] : [])),
        seriesName,
      ),
      yearMin: Math.min(...years),
      yearMax: Math.max(...years),
      platformCounts: {
        gb: seedGames.filter((g) => g.compat === 'gb').length,
        gbc: seedGames.filter((g) => g.compat !== 'gb').length,
      },
    }
  },

  async getGame(slug: string): Promise<GameDetail | null> {
    const g = seedGames.find((x) => x.slug === slug)
    if (!g) return null
    return {
      id: `seed:${g.slug}`,
      slug: g.slug,
      title: g.title,
      platform: platformOf(g),
      compat: g.compat,
      description: g.description,
      firstReleaseYear: firstYear(g),
      regions: [...new Set(g.releases.map((r) => r.region))].sort(),
      playersMin: null,
      playersMax: null,
      features: (Object.keys(featureKey) as GameFeature[]).filter(
        (k) => g.features?.[featureKey[k]] === true,
      ),
      series: g.series ? { slug: g.series, name: seriesName.get(g.series) ?? g.series } : null,
      developer: { slug: g.developer, name: companyName.get(g.developer) ?? g.developer },
      genres: g.genres.map((s) => ({ slug: s, name: genreName.get(s) ?? s })),
      releases: g.releases.map((r) => {
        const pub = r.publisher ?? g.publisher
        return {
          id: `seed:${g.slug}:${r.region}`,
          region: r.region,
          localTitle: r.localTitle ?? null,
          releaseDate: `${r.year}-01-01`,
          releaseDatePrecision: 'year' as const,
          productCode: null,
          publisher: { slug: pub, name: companyName.get(pub) ?? pub },
        }
      }),
      media: [],
      source: 'seed',
    }
  },

  async listSlugs() {
    return seedGames.map((g) => g.slug)
  },

  async suggest(q: string, limit: number): Promise<Suggestion[]> {
    const { items } = await this.search({
      q,
      filters: {},
      sort: 'relevance',
      page: 1,
      pageSize: limit,
    })
    return items.map((i) => ({
      slug: i.slug,
      title: i.title,
      platform: i.platform,
      year: i.firstReleaseYear,
    }))
  },
}
