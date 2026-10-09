-- Save Slot · Row Level Security on every table

-- Is this user's profile public? security definer so policies don't recurse into profiles RLS.
create or replace function public.is_public_profile(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = p_user_id and p.visibility = 'public'
  )
$$;
grant execute on function public.is_public_profile(uuid) to anon, authenticated;

-- ------------------------------------------------------------------
-- Catalogue + reference data: everyone can read, nobody but the service role can write.
-- ------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'companies', 'genres', 'series', 'games', 'game_genres', 'releases', 'media',
    'price_points', 'achievements', 'news_sources', 'news_items'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
    execute format(
      'create policy "%s are readable by everyone" on public.%I for select to anon, authenticated using (true)',
      t, t
    );
  end loop;
end
$$;

-- ------------------------------------------------------------------
-- Profiles
-- ------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles: owner or public can read" on public.profiles
  for select to anon, authenticated
  using (id = (select auth.uid()) or visibility = 'public');

create policy "profiles: owner can update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
-- Inserts happen via the handle_new_user trigger; deletes via auth.users cascade.

-- ------------------------------------------------------------------
-- Owner-only tables (readable by others only when the profile is public)
-- ------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['collection_items', 'wishlist_items', 'ratings', 'play_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$
      create policy "%1$s: owner or public profile can read" on public.%1$I
        for select to anon, authenticated
        using (user_id = (select auth.uid()) or public.is_public_profile(user_id))
    $p$, t);
    execute format($p$
      create policy "%1$s: owner can insert" on public.%1$I
        for insert to authenticated
        with check (user_id = (select auth.uid()))
    $p$, t);
    execute format($p$
      create policy "%1$s: owner can update" on public.%1$I
        for update to authenticated
        using (user_id = (select auth.uid()))
        with check (user_id = (select auth.uid()))
    $p$, t);
    execute format($p$
      create policy "%1$s: owner can delete" on public.%1$I
        for delete to authenticated
        using (user_id = (select auth.uid()))
    $p$, t);
  end loop;
end
$$;

-- Memories: private by default, public only when both the memory and the profile are public.
alter table public.memories enable row level security;

create policy "memories: owner or public can read" on public.memories
  for select to anon, authenticated
  using (user_id = (select auth.uid()) or (is_public and public.is_public_profile(user_id)));
create policy "memories: owner can insert" on public.memories
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "memories: owner can update" on public.memories
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "memories: owner can delete" on public.memories
  for delete to authenticated using (user_id = (select auth.uid()));

-- Achievements are granted server-side only (phase 5); users can read their own.
alter table public.user_achievements enable row level security;
revoke insert, update, delete, truncate on public.user_achievements from anon, authenticated;

create policy "user_achievements: owner or public can read" on public.user_achievements
  for select to anon, authenticated
  using (user_id = (select auth.uid()) or public.is_public_profile(user_id));

-- ------------------------------------------------------------------
-- Storage: private bucket for photos of your own collection, path = <user_id>/...
-- ------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('collection-photos', 'collection-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "collection-photos: owner can read" on storage.objects
  for select to authenticated
  using (bucket_id = 'collection-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "collection-photos: owner can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'collection-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "collection-photos: owner can update" on storage.objects
  for update to authenticated
  using (bucket_id = 'collection-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "collection-photos: owner can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'collection-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
