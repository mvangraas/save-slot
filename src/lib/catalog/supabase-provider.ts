import { buildPriceIndex, fxFromEnv } from './price-index'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { Region } from '@/lib/types'
import { toRpcFilters } from './params'
import {
  GAME_FEATURES,
  type CatalogProvider,
  type Facets,
  type GameDetail,
  type GameQuery,
  type GameSummary,
  type SearchResult,
} from './types'

const regionOrder: Record<Region, number> = { eu: 0, us: 1, jp: 2 }

export function createSupabaseCatalog(db: SupabaseClient<Database>): CatalogProvider {
  return {
    name: 'supabase',

    async search({ q, filters, sort, page, pageSize }: GameQuery): Promise<SearchResult> {
      const { data, error } = await db.rpc('search_games', {
        p_q: q ?? undefined,
        p_filters: toRpcFilters(
          filters,
        ) as Database['public']['Functions']['search_games']['Args']['p_filters'],
        p_sort: sort,
        p_page: page,
        p_page_size: pageSize,
      })
      if (error) throw new Error(`search_games failed: ${error.message}`)
      const total = data[0]?.total_count ?? 0
      return {
        items: data.map((r) => ({
          id: r.id,
          slug: r.slug,
          title: r.title,
          platform: r.platform,
          compat: r.compat,
          firstReleaseYear: r.first_release_year ?? null,
          regions: r.regions ?? [],
          developerName: r.developer_name ?? null,
          publisherNames: r.publisher_names ?? [],
          genreNames: r.genre_names ?? [],
          coverUrl: r.cover_url ?? null,
          owned: !!r.owned,
          wishlisted: !!r.wishlisted,
        })),
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
      }
    },

    async facets(): Promise<Facets> {
      const { data, error } = await db.rpc('catalog_facets')
      if (error) throw new Error(`catalog_facets failed: ${error.message}`)
      const f = data as {
        genres: Facets['genres']
        publishers: Facets['publishers']
        developers: Facets['developers']
        series: Facets['series']
        year_min: number | null
        year_max: number | null
        platform_counts: Facets['platformCounts']
        region_counts?: Facets['regionCounts']
      }
      return {
        genres: f.genres,
        publishers: f.publishers,
        developers: f.developers,
        series: f.series,
        yearMin: f.year_min,
        yearMax: f.year_max,
        platformCounts: f.platform_counts,
        regionCounts: f.region_counts ?? { eu: 0, us: 0, jp: 0 },
      }
    },

    async getGame(slug: string): Promise<GameDetail | null> {
      const { data: g, error } = await db
        .from('games')
        .select(
          `id, slug, title, platform, compat, description, first_release_year, regions,
           players_min, players_max, sgb_enhanced, rumble, infrared, link_cable, battery_save, source,
           series:series ( slug, name ),
           developer:companies!games_developer_id_fkey ( slug, name ),
           game_genres ( genres ( slug, name ) ),
           releases ( id, region, local_title, release_date, release_date_precision, product_code,
             publisher:companies!releases_publisher_id_fkey ( slug, name ) ),
           media ( id, kind, url, width, height, license, attribution, source_url, sort )`,
        )
        .eq('slug', slug)
        .maybeSingle()
      if (error) throw new Error(`getGame failed: ${error.message}`)
      if (!g) return null

      const flags: Record<(typeof GAME_FEATURES)[number], boolean | null> = {
        sgb_enhanced: g.sgb_enhanced,
        rumble: g.rumble,
        infrared: g.infrared,
        link_cable: g.link_cable,
        battery_save: g.battery_save,
      }

      return {
        id: g.id,
        slug: g.slug,
        title: g.title,
        platform: g.platform,
        compat: g.compat,
        description: g.description,
        firstReleaseYear: g.first_release_year,
        regions: g.regions,
        playersMin: g.players_min,
        playersMax: g.players_max,
        features: GAME_FEATURES.filter((k) => flags[k] === true),
        series: g.series,
        developer: g.developer,
        genres: g.game_genres
          .map((gg) => gg.genres)
          .filter((x): x is { slug: string; name: string } => !!x)
          .sort((a, b) => a.name.localeCompare(b.name)),
        releases: [...g.releases]
          .sort(
            (a, b) =>
              (a.release_date ?? '9999').localeCompare(b.release_date ?? '9999') ||
              regionOrder[a.region] - regionOrder[b.region],
          )
          .map((r) => ({
            id: r.id,
            region: r.region,
            localTitle: r.local_title,
            releaseDate: r.release_date,
            releaseDatePrecision: r.release_date_precision,
            productCode: r.product_code,
            publisher: r.publisher,
          })),
        media: [...g.media]
          .sort((a, b) => a.sort - b.sort)
          .map((m) => ({
            id: m.id,
            kind: m.kind,
            url: m.url,
            width: m.width,
            height: m.height,
            license: m.license,
            attribution: m.attribution,
            sourceUrl: m.source_url,
          })),
        source: g.source,
      }
    },

    async listSlugs() {
      const { data, error } = await db.from('games').select('slug').order('slug').limit(5000)
      if (error) throw new Error(`listSlugs failed: ${error.message}`)
      return data.map((r) => r.slug)
    },

    async allGames() {
      const all: GameSummary[] = []
      for (let page = 1; page <= 100; page++) {
        const r = await this.search({ filters: {}, sort: 'title', page, pageSize: 100 })
        all.push(...r.items)
        if (page >= r.pageCount) break
      }
      return all
    },

    async priceIndex() {
      const { data, error } = await db
        .from('price_points')
        .select(
          'release_id, grade, value_cents, currency, source, observed_at, release:releases!inner ( game_id, region )',
        )
        .order('observed_at', { ascending: false })
        .limit(20000)
      if (error) throw new Error(`priceIndex failed: ${error.message}`)
      return buildPriceIndex(
        data.map((p) => ({
          releaseId: p.release_id,
          gameId: p.release.game_id,
          region: p.release.region,
          grade: p.grade,
          valueCents: p.value_cents,
          currency: p.currency,
          source: p.source,
          observedAt: p.observed_at,
        })),
        fxFromEnv(),
      )
    },

    async sourceCounts() {
      const sources = ['seed', 'igdb', 'thegamesdb', 'pricecharting', 'manual'] as const
      const count = async (table: 'games' | 'media' | 'price_points') => {
        const out: Record<string, number> = {}
        await Promise.all(
          sources.map(async (s) => {
            const { count: n, error } = await db
              .from(table)
              .select('id', { count: 'exact', head: true })
              .eq('source', s)
            if (error) throw new Error(`sourceCounts ${table}: ${error.message}`)
            if (n) out[s] = n
          }),
        )
        return out
      }
      const [games, media, prices] = await Promise.all([
        count('games'),
        count('media'),
        count('price_points'),
      ])
      return { games, media, prices }
    },

    async suggest(q: string, limit: number) {
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
}
