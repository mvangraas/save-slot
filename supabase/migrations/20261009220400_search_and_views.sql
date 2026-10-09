-- Save Slot · catalogue search, facets and per-user views

-- Escape LIKE wildcards in user input.
create or replace function public.f_like_escape(text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select replace(replace(replace($1, '\', '\\'), '%', '\%'), '_', '\_')
$$;

/*
  search_games — one call for the catalogue grid.

  p_q        free text: matches title, regional titles, developer, publisher, genre and series.
             Every word must appear (accent-insensitive); typos fall back to trigram similarity.
  p_filters  {
               "platform": "gb" | "gbc",
               "compat": ["gb","gbc_dual","gbc_only"],
               "regions": ["eu","us","jp"],          -- has a release in any of these
               "genres": ["platformer", ...],        -- genre slugs, any of
               "year_from": 1989, "year_to": 2001,   -- first release year
               "publisher": "nintendo",              -- company slug
               "developer": "hal-laboratory",        -- company slug
               "series": "pokemon",                  -- series slug
               "features": ["sgb_enhanced","rumble","infrared","link_cable","battery_save"],
               "ownership": "owned" | "missing" | "wishlist"   -- current user only
             }
  p_sort     'title' | 'title_desc' | 'year_asc' | 'year_desc' | 'recent' | 'relevance'
*/
create or replace function public.search_games(
  p_q text default null,
  p_filters jsonb default '{}'::jsonb,
  p_sort text default 'title',
  p_page integer default 1,
  p_page_size integer default 24
)
returns table (
  id uuid,
  slug text,
  title text,
  platform public.platform,
  compat public.cart_compat,
  first_release_year smallint,
  regions public.region[],
  developer_name text,
  publisher_names text[],
  genre_names text[],
  cover_url text,
  owned boolean,
  wishlisted boolean,
  relevance real,
  total_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_norm text := public.f_search_norm(nullif(btrim(p_q), ''));
  v_words text[];
  v_uid uuid := auth.uid();
  v_size integer := least(greatest(coalesce(p_page_size, 24), 1), 100);
  v_offset integer := (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 24), 1), 100);
  f jsonb := coalesce(p_filters, '{}'::jsonb);
  v_features jsonb := coalesce(coalesce(p_filters, '{}'::jsonb)->'features', '[]'::jsonb);
begin
  if v_norm is not null then
    v_words := array_remove(regexp_split_to_array(v_norm, '\s+'), '');
  end if;

  return query
  with base as (
    select
      g.*,
      case when v_norm is null then 0::real
           else greatest(
             extensions.word_similarity(v_norm, public.f_search_norm(g.title)),
             extensions.word_similarity(v_norm, g.search_text) * 0.8
           )::real
      end as rel
    from public.games g
    where
      (v_norm is null
        or (select bool_and(g.search_text like '%' || public.f_like_escape(w) || '%') from unnest(v_words) w)
        or extensions.word_similarity(v_norm, g.search_text) >= 0.45)
      and (f->>'platform' is null or g.platform::text = f->>'platform')
      and (not f ? 'compat' or jsonb_array_length(f->'compat') = 0
           or g.compat::text in (select jsonb_array_elements_text(f->'compat')))
      and (not f ? 'regions' or jsonb_array_length(f->'regions') = 0
           or g.regions && array(select jsonb_array_elements_text(f->'regions'))::public.region[])
      and (not f ? 'genres' or jsonb_array_length(f->'genres') = 0
           or exists (select 1 from public.game_genres gg join public.genres ge on ge.id = gg.genre_id
                      where gg.game_id = g.id and ge.slug in (select jsonb_array_elements_text(f->'genres'))))
      and (f->>'year_from' is null or g.first_release_year >= (f->>'year_from')::int)
      and (f->>'year_to' is null or g.first_release_year <= (f->>'year_to')::int)
      and (f->>'publisher' is null
           or exists (select 1 from public.releases r join public.companies c on c.id = r.publisher_id
                      where r.game_id = g.id and c.slug = f->>'publisher'))
      and (f->>'developer' is null
           or exists (select 1 from public.companies c where c.id = g.developer_id and c.slug = f->>'developer'))
      and (f->>'series' is null
           or exists (select 1 from public.series s where s.id = g.series_id and s.slug = f->>'series'))
      and (not v_features ? 'sgb_enhanced' or g.sgb_enhanced)
      and (not v_features ? 'rumble' or g.rumble)
      and (not v_features ? 'infrared' or g.infrared)
      and (not v_features ? 'link_cable' or g.link_cable)
      and (not v_features ? 'battery_save' or g.battery_save)
      and (
        f->>'ownership' is null
        or (f->>'ownership' = 'owned' and exists (
              select 1 from public.collection_items ci join public.releases r on r.id = ci.release_id
              where r.game_id = g.id and ci.user_id = v_uid))
        or (f->>'ownership' = 'missing' and not exists (
              select 1 from public.collection_items ci join public.releases r on r.id = ci.release_id
              where r.game_id = g.id and ci.user_id = v_uid))
        or (f->>'ownership' = 'wishlist' and exists (
              select 1 from public.wishlist_items wi where wi.game_id = g.id and wi.user_id = v_uid))
      )
  )
  select
    b.id, b.slug, b.title, b.platform, b.compat, b.first_release_year, b.regions,
    (select c.name from public.companies c where c.id = b.developer_id),
    coalesce((select array_agg(distinct c.name order by c.name) from public.releases r
              join public.companies c on c.id = r.publisher_id where r.game_id = b.id), '{}'),
    coalesce((select array_agg(ge.name order by ge.name) from public.game_genres gg
              join public.genres ge on ge.id = gg.genre_id where gg.game_id = b.id), '{}'),
    (select m.url from public.media m where m.game_id = b.id and m.kind = 'boxart_front'
     order by m.sort limit 1),
    (v_uid is not null and exists (select 1 from public.collection_items ci
       join public.releases r on r.id = ci.release_id where r.game_id = b.id and ci.user_id = v_uid)),
    (v_uid is not null and exists (select 1 from public.wishlist_items wi
       where wi.game_id = b.id and wi.user_id = v_uid)),
    b.rel,
    count(*) over ()
  from base b
  order by
    case when p_sort = 'relevance' or (p_sort is null and v_norm is not null) then b.rel end desc nulls last,
    case when p_sort = 'year_asc' then b.first_release_year end asc nulls last,
    case when p_sort = 'year_desc' then b.first_release_year end desc nulls last,
    case when p_sort = 'recent' then b.created_at end desc,
    case when p_sort = 'title_desc' then public.f_search_norm(b.title) end desc,
    public.f_search_norm(b.title) asc,
    b.id
  limit v_size offset v_offset;
end;
$$;

grant execute on function public.search_games(text, jsonb, text, integer, integer) to anon, authenticated;

-- Filter options for the catalogue UI.
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
    'platform_counts', jsonb_build_object(
      'gb', (select count(*) from public.games where platform = 'gb'),
      'gbc', (select count(*) from public.games where platform = 'gbc')
    )
  )
$$;

grant execute on function public.catalog_facets() to anon, authenticated;

-- ------------------------------------------------------------------
-- Per-user views (current user only; RLS applies via security_invoker)
-- ------------------------------------------------------------------
create view public.v_my_completion with (security_invoker = true) as
with owned as (
  select distinct r.game_id, r.region
  from public.collection_items ci
  join public.releases r on r.id = ci.release_id
  where ci.user_id = (select auth.uid())
)
select 'platform'::text as scope, g.platform::text as key,
       count(distinct o.game_id) as owned_count, count(distinct g.id) as total_count
from public.games g
left join owned o on o.game_id = g.id
group by g.platform
union all
select 'region'::text, r.region::text,
       count(distinct o.game_id), count(distinct r.game_id)
from public.releases r
left join owned o on o.game_id = r.game_id and o.region = r.region
group by r.region;

create view public.v_my_collection_value with (security_invoker = true) as
with items as (
  select ci.id, ci.release_id,
         case when ci.condition = 'sealed' then 'new'::public.price_grade
              when ci.has_cart and ci.has_box and ci.has_manual then 'cib'::public.price_grade
              else 'loose'::public.price_grade end as grade
  from public.collection_items ci
  where ci.user_id = (select auth.uid())
),
priced as (
  select i.id,
         (select pp.value_cents from public.price_points pp
          where pp.release_id = i.release_id and pp.grade = i.grade and pp.currency = 'EUR'
          order by pp.observed_at desc limit 1) as value_cents
  from items i
)
select coalesce(sum(value_cents), 0)::bigint as estimated_cents,
       'EUR'::text as currency,
       count(*) filter (where value_cents is null) as items_without_price,
       count(*) as item_count
from priced;

grant select on public.v_my_completion, public.v_my_collection_value to authenticated;
revoke select on public.v_my_completion, public.v_my_collection_value from anon;
