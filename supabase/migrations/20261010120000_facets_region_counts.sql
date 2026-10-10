-- Save Slot · catalog_facets also returns how many games were released per region (for completion).

create or replace function public.catalog_facets()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'genres', coalesce((select jsonb_agg(jsonb_build_object('slug', ge.slug, 'name', ge.name, 'count', x.n) order by ge.name)
       from public.genres ge join lateral (select count(*) n from public.game_genres gg where gg.genre_id = ge.id) x on x.n > 0), '[]'),
    'publishers', coalesce((select jsonb_agg(jsonb_build_object('slug', c.slug, 'name', c.name, 'count', x.n) order by c.name)
       from public.companies c join lateral (select count(distinct r.game_id) n from public.releases r where r.publisher_id = c.id) x on x.n > 0), '[]'),
    'developers', coalesce((select jsonb_agg(jsonb_build_object('slug', c.slug, 'name', c.name, 'count', x.n) order by c.name)
       from public.companies c join lateral (select count(*) n from public.games g where g.developer_id = c.id) x on x.n > 0), '[]'),
    'series', coalesce((select jsonb_agg(jsonb_build_object('slug', s.slug, 'name', s.name, 'count', x.n) order by s.name)
       from public.series s join lateral (select count(*) n from public.games g where g.series_id = s.id) x on x.n > 0), '[]'),
    'year_min', (select min(first_release_year) from public.games),
    'year_max', (select max(first_release_year) from public.games),
    'region_counts', jsonb_build_object(
      'eu', (select count(*) from public.games where 'eu' = any(regions)),
      'us', (select count(*) from public.games where 'us' = any(regions)),
      'jp', (select count(*) from public.games where 'jp' = any(regions))
    ),
    'platform_counts', jsonb_build_object(
      'gb', (select count(*) from public.games where platform = 'gb'),
      'gbc', (select count(*) from public.games where platform = 'gbc')
    )
  )
$$;

