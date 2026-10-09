-- Save Slot · search: typo tolerance tuned ("tetirs" finds Tetris) and disabled for very short queries.

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
        or (char_length(v_norm) >= 4 and extensions.word_similarity(v_norm, g.search_text) >= 0.4))
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

