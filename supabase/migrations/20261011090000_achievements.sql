-- Save Slot · achievements (phase 5)
-- Definitions mirror src/lib/achievements/definitions.ts; rules mirror src/lib/achievements/evaluate.ts.
-- Users can never write user_achievements directly: unlocks come only from
-- public.fn_evaluate_achievements(), which evaluates the caller's own data (auth.uid()).

insert into public.achievements (code, name, description, icon_key, platform, sort) values
  ('first_cart', 'Insert Cartridge', 'Add your first game to the collection.', 'cart', null, 10),
  ('ten_carts', 'Shelf Starter', 'Own 10 different games.', 'shelf', null, 20),
  ('twentyfive_carts', 'Full Shelf', 'Own 25 different games.', 'stack', null, 30),
  ('fifty_carts', 'Collector', 'Own 50 different games.', 'trophy', null, 40),
  ('cib_first', 'Complete In Box', 'Own a copy with cartridge, box and manual.', 'box', null, 50),
  ('cib_10', 'Boxed Set', 'Own 10 complete-in-box copies.', 'box', null, 60),
  ('sealed_first', 'Factory Fresh', 'Own a sealed copy.', 'seal', null, 70),
  ('price_10', 'Bookkeeper', 'Log the purchase price of 10 copies.', 'coin', null, 80),
  ('gb_10', 'Shades of Green', 'Own 10 Game Boy games.', 'leaf', 'gb'::public.platform, 90),
  ('gbc_10', 'Full Color', 'Own 10 Game Boy Color games.', 'prism', 'gbc'::public.platform, 100),
  ('gbc_only_first', 'Color Exclusive', 'Own a Game Boy Color-only cartridge.', 'prism', 'gbc'::public.platform, 110),
  ('dual_mode_5', 'Black Cartridge', 'Own 5 dual-mode cartridges.', 'stack', 'gbc'::public.platform, 120),
  ('launch_year', 'Day One', 'Own a game first released in 1989.', 'clock', 'gb'::public.platform, 130),
  ('jp_import', 'Import Hunter', 'Own a Japanese release.', 'plane', null, 140),
  ('us_import', 'Across the Pond', 'Own a North American release.', 'plane', null, 150),
  ('three_regions', 'World Tour', 'Own releases from Europe, North America and Japan.', 'globe', null, 160),
  ('regional_variant', 'Regional Variant', 'Own the same game from two different regions.', 'flag', null, 170),
  ('year_complete', 'Time Capsule', 'Own every game released in one region in one year.', 'clock', null, 180),
  ('genres_5', 'Genre Hopper', 'Own games from 5 different genres.', 'stack', null, 190),
  ('series_3', 'Saga Seeker', 'Own 3 games from the same series.', 'book', null, 200),
  ('sgb_5', 'Super Sized', 'Own 5 Super Game Boy-enhanced games.', 'sgb', 'gb'::public.platform, 210),
  ('rumble_first', 'Good Vibrations', 'Own a rumble cartridge.', 'wave', 'gbc'::public.platform, 220),
  ('completed_first', 'The End', 'Mark a game as completed.', 'flag', null, 230),
  ('completed_10', 'Credits Rolled', 'Mark 10 games as completed.', 'trophy', null, 240),
  ('playing_3', 'Multitasker', 'Have 3 games on "playing" at once.', 'joystick', null, 250),
  ('memory_first', 'Dear Diary', 'Write your first memory.', 'book', null, 260),
  ('memory_5', 'Scrapbook', 'Write 5 memories.', 'book', null, 270),
  ('rated_10', 'Critic', 'Rate 10 games.', 'star', null, 280),
  ('favorite_first', 'Heart Container', 'Mark a game as a favourite.', 'heart', null, 290),
  ('wishlist_first', 'Window Shopper', 'Put a game on your wishlist.', 'heart', null, 300),
  ('wishlist_granted', 'Wish Granted', 'Move a wishlist game into your collection.', 'gift', null, 310)

on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  icon_key = excluded.icon_key,
  platform = excluded.platform,
  sort = excluded.sort;

-- Events that can't be derived from current state (a wish moved into the collection).
create table private.achievement_events (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('wishlist_granted')),
  created_at timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table private.achievement_events enable row level security;
revoke all on private.achievement_events from public, anon, authenticated;

-- When a wishlist row is removed while the user owns that game, the wish was granted.
create or replace function private.tg_wishlist_granted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Skip cascades (e.g. account deletion): only direct deletes count.
  if pg_trigger_depth() > 1 then
    return old;
  end if;
  if exists (
    select 1
    from public.collection_items ci
    join public.releases r on r.id = ci.release_id
    where ci.user_id = old.user_id and r.game_id = old.game_id
  ) then
    insert into private.achievement_events (user_id, kind)
    values (old.user_id, 'wishlist_granted')
    on conflict do nothing;
  end if;
  return old;
end;
$$;
revoke execute on function private.tg_wishlist_granted() from public, anon, authenticated;

create trigger wishlist_items_granted
  after delete on public.wishlist_items
  for each row execute function private.tg_wishlist_granted();

-- Evaluates every rule for the calling user, stores new unlocks and returns their codes.
create or replace function public.fn_evaluate_achievements()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  earned text[];
  fresh text[];
begin
  if uid is null then
    return '{}';
  end if;

  with copies as (
    select ci.*, r.game_id, r.region
    from public.collection_items ci
    join public.releases r on r.id = ci.release_id
    where ci.user_id = uid
  ),
  owned as (
    select g.*
    from public.games g
    where g.id in (select game_id from copies)
  ),
  plays as (
    select status from public.play_logs where user_id = uid
  ),
  facts as (
    select
      (select count(*) from owned) as n,
      (select count(*) from copies where has_cart and has_box and has_manual) as cib,
      (select count(*) from copies where condition = 'sealed') as sealed,
      (select count(*) from copies where purchase_price_cents is not null) as priced,
      (select count(*) from owned where platform = 'gb') as gb,
      (select count(*) from owned where platform = 'gbc') as gbc,
      (select count(*) from owned where compat = 'gbc_only') as gbc_only,
      (select count(*) from owned where compat = 'gbc_dual') as dual,
      (select count(*) from owned where first_release_year = 1989) as launch,
      (select count(*) from copies where region = 'jp') as jp,
      (select count(*) from copies where region = 'us') as us,
      (select count(distinct region) from copies) as regions,
      (select count(*) from (
         select game_id from copies group by game_id having count(distinct region) >= 2
       ) v) as variants,
      (select count(*) from (
         select r.region, extract(year from r.release_date)
         from public.releases r
         where r.release_date is not null
         group by 1, 2
         having bool_and(exists (
           select 1 from copies c where c.game_id = r.game_id and c.region = r.region
         ))
       ) y) as full_years,
      (select count(distinct gg.genre_id)
         from public.game_genres gg where gg.game_id in (select id from owned)) as genres,
      (select coalesce(max(cnt), 0) from (
         select count(*) as cnt from owned where series_id is not null group by series_id
       ) s) as series_max,
      (select count(*) from owned where sgb_enhanced) as sgb,
      (select count(*) from owned where rumble) as rumble,
      (select count(*) from plays where status = 'completed') as completed,
      (select count(*) from plays where status = 'playing') as playing,
      (select count(*) from public.memories where user_id = uid) as memories,
      (select count(*) from public.ratings where user_id = uid and score is not null) as rated,
      (select count(*) from public.ratings where user_id = uid and is_favorite) as favorites,
      (select count(*) from public.wishlist_items where user_id = uid) as wishes,
      exists (
        select 1 from private.achievement_events e
        where e.user_id = uid and e.kind = 'wishlist_granted'
      ) as granted
  )
  select array_remove(array[
    case when n >= 1 then 'first_cart' end,
    case when n >= 10 then 'ten_carts' end,
    case when n >= 25 then 'twentyfive_carts' end,
    case when n >= 50 then 'fifty_carts' end,
    case when cib >= 1 then 'cib_first' end,
    case when cib >= 10 then 'cib_10' end,
    case when sealed >= 1 then 'sealed_first' end,
    case when priced >= 10 then 'price_10' end,
    case when gb >= 10 then 'gb_10' end,
    case when gbc >= 10 then 'gbc_10' end,
    case when gbc_only >= 1 then 'gbc_only_first' end,
    case when dual >= 5 then 'dual_mode_5' end,
    case when launch >= 1 then 'launch_year' end,
    case when jp >= 1 then 'jp_import' end,
    case when us >= 1 then 'us_import' end,
    case when regions >= 3 then 'three_regions' end,
    case when variants >= 1 then 'regional_variant' end,
    case when full_years >= 1 then 'year_complete' end,
    case when genres >= 5 then 'genres_5' end,
    case when series_max >= 3 then 'series_3' end,
    case when sgb >= 5 then 'sgb_5' end,
    case when rumble >= 1 then 'rumble_first' end,
    case when completed >= 1 then 'completed_first' end,
    case when completed >= 10 then 'completed_10' end,
    case when playing >= 3 then 'playing_3' end,
    case when memories >= 1 then 'memory_first' end,
    case when memories >= 5 then 'memory_5' end,
    case when rated >= 10 then 'rated_10' end,
    case when favorites >= 1 then 'favorite_first' end,
    case when wishes >= 1 then 'wishlist_first' end,
    case when granted then 'wishlist_granted' end
  ], null)
  into earned
  from facts;

  with ins as (
    insert into public.user_achievements (user_id, achievement_code)
    select uid, a.code
    from public.achievements a
    where a.code = any (earned)
    on conflict do nothing
    returning achievement_code
  )
  select coalesce(array_agg(achievement_code), '{}') into fresh from ins;

  return fresh;
end;
$$;

revoke execute on function public.fn_evaluate_achievements() from public, anon;
grant execute on function public.fn_evaluate_achievements() to authenticated;
