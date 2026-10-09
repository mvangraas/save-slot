-- Save Slot · user-owned data

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text check (char_length(display_name) <= 40),
  avatar_key text,
  preferred_region public.region not null default 'eu',
  currency char(3) not null default 'EUR',
  visibility public.visibility not null default 'private',
  reduce_effects boolean not null default false,
  sounds_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete restrict,
  has_cart boolean not null default true,
  has_box boolean not null default false,
  has_manual boolean not null default false,
  condition public.item_condition,
  purchase_price_cents integer check (purchase_price_cents >= 0),
  purchase_currency char(3),
  purchased_on date,
  notes text check (char_length(notes) <= 2000),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint collection_items_price_currency check ((purchase_price_cents is null) or (purchase_currency is not null))
);

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  preferred_region public.region,
  desired_condition public.item_condition,
  max_price_cents integer check (max_price_cents >= 0),
  priority public.wish_priority not null default 'medium',
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);

create table public.ratings (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  score smallint check (score between 1 and 10),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table public.play_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  status public.play_status not null,
  started_on date,
  finished_on date,
  hours numeric(6, 1) check (hours >= 0),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id),
  constraint play_logs_dates check (finished_on is null or started_on is null or finished_on >= started_on)
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  year_remembered smallint check (year_remembered between 1989 and 2100),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.achievements (
  code text primary key check (code ~ '^[a-z0-9_]+$'),
  name text not null,
  description text not null,
  icon_key text not null,
  platform public.platform,
  sort smallint not null default 0
);

create table public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_code text not null references public.achievements (code) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_code)
);

-- News
create table public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  site_url text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.news_sources (id) on delete cascade,
  title text not null,
  url text not null unique,
  excerpt text check (char_length(excerpt) <= 200),
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

-- Indexes (every FK used in RLS or joins)
create index collection_items_user_idx on public.collection_items (user_id);
create index collection_items_release_idx on public.collection_items (release_id);
create index wishlist_items_game_idx on public.wishlist_items (game_id);
create index ratings_game_idx on public.ratings (game_id);
create index play_logs_game_idx on public.play_logs (game_id);
create index memories_user_game_idx on public.memories (user_id, game_id);
create index memories_game_idx on public.memories (game_id);
create index user_achievements_code_idx on public.user_achievements (achievement_code);
create index news_items_source_idx on public.news_items (source_id);
create index news_items_published_idx on public.news_items (published_at desc);

-- updated_at triggers
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger collection_items_updated_at before update on public.collection_items
  for each row execute function public.set_updated_at();
create trigger wishlist_items_updated_at before update on public.wishlist_items
  for each row execute function public.set_updated_at();
create trigger ratings_updated_at before update on public.ratings
  for each row execute function public.set_updated_at();
create trigger play_logs_updated_at before update on public.play_logs
  for each row execute function public.set_updated_at();
create trigger memories_updated_at before update on public.memories
  for each row execute function public.set_updated_at();

-- A profile is created for every new auth user (username can be changed later).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'player_' || substr(replace(new.id::text, '-', ''), 1, 12));
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
