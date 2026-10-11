-- Save Slot · phase 7 hardening: write rate limits, photo paths.
-- Account deletion uses the Auth admin API from the server (service role), not SQL

-- 1. Per-user write limits (fixed window). Only reachable through check_rate_limit().
create table private.rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null check (char_length(bucket) between 1 and 40),
  window_start timestamptz not null,
  hits integer not null,
  primary key (user_id, bucket)
);
alter table private.rate_limits enable row level security;
revoke all on private.rate_limits from public, anon, authenticated;

create or replace function public.check_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  current_hits integer;
begin
  if uid is null then
    return false;
  end if;
  if p_limit < 1 or p_limit > 10000 or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit arguments';
  end if;
  insert into private.rate_limits as rl (user_id, bucket, window_start, hits)
  values (uid, p_bucket, now(), 1)
  on conflict (user_id, bucket) do update
    set window_start = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else rl.window_start
        end,
        hits = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else rl.hits + 1
        end
  returning hits into current_hits;
  return current_hits <= p_limit;
end;
$$;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;

-- 2. Photos: the private bucket `collection-photos` and its owner-only policies exist since
--    20261009220300_rls.sql. Paths stored on an item must live in the owner's folder.
create or replace function private.photo_paths_ok(p_paths text[], p_user uuid)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select cardinality(p_paths) <= 4
     and not exists (select 1 from unnest(p_paths) p where p not like p_user::text || '/%');
$$;
revoke all on function private.photo_paths_ok(text[], uuid) from public;
grant execute on function private.photo_paths_ok(text[], uuid) to authenticated, service_role;

alter table public.collection_items
  add constraint collection_items_photo_paths_owner
  check (private.photo_paths_ok(photo_paths, user_id));
