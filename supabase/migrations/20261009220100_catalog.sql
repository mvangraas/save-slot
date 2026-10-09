-- Save Slot · catalogue (public read, written only by the service role / imports)

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.genres (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  platform public.platform not null,
  compat public.cart_compat not null,
  series_id uuid references public.series (id) on delete set null,
  developer_id uuid references public.companies (id) on delete set null,
  description text,
  players_min smallint check (players_min between 1 and 16),
  players_max smallint check (players_max between 1 and 16),
  -- Features: null = unknown, true/false = verified.
  sgb_enhanced boolean,
  rumble boolean,
  infrared boolean,
  link_cable boolean,
  battery_save boolean,
  igdb_id bigint unique,
  external_ids jsonb not null default '{}'::jsonb,
  source public.data_source not null default 'manual',
  -- Maintained by triggers (see refresh_game_derived):
  first_release_year smallint,
  regions public.region[] not null default '{}',
  search_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_platform_matches_compat check (
    (platform = 'gb' and compat = 'gb') or (platform = 'gbc' and compat in ('gbc_dual', 'gbc_only'))
  ),
  constraint games_players_range check (players_max is null or players_min is null or players_max >= players_min)
);

create table public.game_genres (
  game_id uuid not null references public.games (id) on delete cascade,
  genre_id uuid not null references public.genres (id) on delete cascade,
  primary key (game_id, genre_id)
);

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  region public.region not null,
  local_title text,
  release_date date,
  release_date_precision public.date_precision,
  product_code text,
  publisher_id uuid references public.companies (id) on delete set null,
  source public.data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint releases_date_precision check ((release_date is null) = (release_date_precision is null))
);
-- One release per game/region/product code; a missing code counts as one "unknown" release per region.
create unique index releases_game_region_code_key
  on public.releases (game_id, region, coalesce(product_code, ''));

create table public.media (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  release_id uuid references public.releases (id) on delete cascade,
  kind public.media_kind not null,
  url text not null,
  width integer,
  height integer,
  source public.data_source not null,
  source_url text,
  license text not null,
  attribution text not null,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.price_points (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases (id) on delete cascade,
  grade public.price_grade not null,
  value_cents integer not null check (value_cents >= 0),
  currency char(3) not null default 'EUR',
  source public.data_source not null,
  observed_at timestamptz not null default now()
);

-- Indexes
create index games_platform_idx on public.games (platform);
create index games_compat_idx on public.games (compat);
create index games_first_release_year_idx on public.games (first_release_year);
create index games_series_idx on public.games (series_id);
create index games_developer_idx on public.games (developer_id);
create index games_regions_idx on public.games using gin (regions);
create index games_search_trgm_idx on public.games using gin (search_text extensions.gin_trgm_ops);
create index games_title_norm_trgm_idx on public.games using gin (public.f_search_norm(title) extensions.gin_trgm_ops);
create index game_genres_genre_idx on public.game_genres (genre_id);
create index releases_game_idx on public.releases (game_id);
create index releases_publisher_idx on public.releases (publisher_id);
create index media_game_idx on public.media (game_id, kind, sort);
create index media_release_idx on public.media (release_id);
create index price_points_lookup_idx on public.price_points (release_id, grade, observed_at desc);

create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger games_updated_at before update on public.games
  for each row execute function public.set_updated_at();
create trigger releases_updated_at before update on public.releases
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Derived columns: first_release_year, regions, search_text
-- ------------------------------------------------------------------
create or replace function public.refresh_game_derived(p_game_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.games g
  set
    first_release_year = d.first_year,
    regions = d.regions,
    search_text = d.search_text
  from (
    select
      g2.id,
      (select min(extract(year from r.release_date))::smallint
         from public.releases r where r.game_id = g2.id) as first_year,
      coalesce((select array_agg(distinct r.region order by r.region)
         from public.releases r where r.game_id = g2.id), '{}') as regions,
      public.f_search_norm(concat_ws(' ',
        g2.title,
        (select string_agg(r.local_title, ' ') from public.releases r where r.game_id = g2.id),
        (select c.name from public.companies c where c.id = g2.developer_id),
        (select string_agg(distinct c.name, ' ') from public.releases r
           join public.companies c on c.id = r.publisher_id where r.game_id = g2.id),
        (select string_agg(ge.name, ' ') from public.game_genres gg
           join public.genres ge on ge.id = gg.genre_id where gg.game_id = g2.id),
        (select s.name from public.series s where s.id = g2.series_id)
      )) as search_text
    from public.games g2
    where g2.id = p_game_id
  ) d
  where g.id = d.id;
$$;

create or replace function public.tg_games_refresh_derived()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  perform public.refresh_game_derived(new.id);
  return null;
end;
$$;

create or replace function public.tg_child_refresh_game()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_game_derived(new.game_id);
  end if;
  if tg_op in ('DELETE', 'UPDATE') then
    perform public.refresh_game_derived(old.game_id);
  end if;
  return null;
end;
$$;

-- Only refresh when the source columns change (avoids recursion from our own update).
create trigger games_refresh_derived
  after insert or update of title, developer_id, series_id on public.games
  for each row execute function public.tg_games_refresh_derived();
create trigger releases_refresh_game
  after insert or update or delete on public.releases
  for each row execute function public.tg_child_refresh_game();
create trigger game_genres_refresh_game
  after insert or update or delete on public.game_genres
  for each row execute function public.tg_child_refresh_game();

revoke execute on function public.refresh_game_derived(uuid) from public, anon, authenticated;
