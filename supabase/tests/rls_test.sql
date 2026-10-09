-- Save Slot · Row Level Security tests
--
-- Runs entirely inside one DO block and ALWAYS rolls back by raising at the end, so it is safe
-- to run against any database (local, branch or production): nothing is left behind.
-- Success = the error message 'RLS TESTS PASSED (n checks)'. Any other error = a failed check.
--
--   psql "$DATABASE_URL" -f supabase/tests/rls_test.sql
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  rel_a uuid;
  rel_b uuid;
  game_a uuid;
  item_b uuid;
  n int;
  checks int := 0;
  failed boolean;
begin
  -- ---------------------------------------------------------------- fixtures (as owner, bypassing RLS)
  insert into auth.users (id, email, aud, role) values
    (a, 'rls-a@example.test', 'authenticated', 'authenticated'),
    (b, 'rls-b@example.test', 'authenticated', 'authenticated');

  if (select count(*) from public.profiles where id in (a, b)) <> 2 then
    raise exception 'FAIL: profile trigger did not create profiles';
  end if;
  checks := checks + 1;

  select r.id, r.game_id into rel_a, game_a from public.releases r order by r.id limit 1;
  select r.id into rel_b from public.releases r where r.game_id <> game_a order by r.id limit 1;
  if rel_a is null or rel_b is null then
    raise exception 'FAIL: need seeded releases to run RLS tests';
  end if;

  insert into public.collection_items (user_id, release_id) values (a, rel_a);
  insert into public.collection_items (user_id, release_id) values (b, rel_b) returning id into item_b;
  insert into public.memories (user_id, game_id, body, is_public) values (b, game_a, 'private memory', false);
  insert into public.memories (user_id, game_id, body, is_public) values (b, game_a, 'public memory', true);

  -- ---------------------------------------------------------------- as user A
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', a::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.collection_items;
  if n <> 1 then raise exception 'FAIL: user A sees % collection items, expected 1', n; end if;
  checks := checks + 1;

  update public.collection_items set has_box = true where id = item_b;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: user A updated user B''s item'; end if;
  checks := checks + 1;

  delete from public.collection_items where id = item_b;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: user A deleted user B''s item'; end if;
  checks := checks + 1;

  failed := false;
  begin
    insert into public.collection_items (user_id, release_id) values (b, rel_a);
  exception when insufficient_privilege then failed := true;
  end;
  if not failed then raise exception 'FAIL: user A inserted an item for user B'; end if;
  checks := checks + 1;

  failed := false;
  begin
    insert into public.games (slug, title, platform, compat) values ('rls-test-game', 'Test game', 'gb', 'gb');
  exception when insufficient_privilege then failed := true;
  end;
  if not failed then raise exception 'FAIL: user A could write to the catalogue'; end if;
  checks := checks + 1;

  failed := false;
  begin
    update public.profiles set visibility = 'public' where id = b;
    get diagnostics n = row_count;
    if n = 0 then failed := true; end if;
  exception when insufficient_privilege then failed := true;
  end;
  if not failed then raise exception 'FAIL: user A changed user B''s profile'; end if;
  checks := checks + 1;

  select count(*) into n from public.memories;
  if n <> 0 then raise exception 'FAIL: user A sees % of B''s memories while B is private', n; end if;
  checks := checks + 1;

  select count(*) into n from public.search_games(null, '{"ownership":"owned"}');
  if n <> 1 then raise exception 'FAIL: search_games owned filter returned %, expected 1', n; end if;
  checks := checks + 1;

  select owned_count into n from public.v_my_completion where scope = 'platform'
    and key = (select platform::text from public.games where id = game_a);
  if n <> 1 then raise exception 'FAIL: v_my_completion owned_count = %, expected 1', n; end if;
  checks := checks + 1;

  -- users can insert their own rows (default user_id = auth.uid())
  insert into public.wishlist_items (game_id) values (game_a);
  select count(*) into n from public.wishlist_items where user_id = a;
  if n <> 1 then raise exception 'FAIL: user A could not add to own wishlist'; end if;
  checks := checks + 1;

  -- ---------------------------------------------------------------- anonymous visitor
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';

  select count(*) into n from public.collection_items;
  if n <> 0 then raise exception 'FAIL: anon sees % private collection items', n; end if;
  checks := checks + 1;

  select count(*) into n from public.profiles where id in (a, b);
  if n <> 0 then raise exception 'FAIL: anon sees private profiles'; end if;
  checks := checks + 1;

  select count(*) into n from public.games;
  if n = 0 then raise exception 'FAIL: anon cannot read the catalogue'; end if;
  checks := checks + 1;

  failed := false;
  begin
    perform 1 from public.v_my_completion;
  exception when insufficient_privilege then failed := true;
  end;
  if not failed then raise exception 'FAIL: anon can read v_my_completion'; end if;
  checks := checks + 1;

  -- ---------------------------------------------------------------- B goes public
  execute 'reset role';
  update public.profiles set visibility = 'public' where id = b;
  execute 'set local role anon';

  select count(*) into n from public.collection_items;
  if n <> 1 then raise exception 'FAIL: anon sees % items of public profile B, expected 1', n; end if;
  checks := checks + 1;

  select count(*) into n from public.memories;
  if n <> 1 then raise exception 'FAIL: anon sees % memories of public B, expected only the public one', n; end if;
  checks := checks + 1;

  execute 'reset role';
  raise exception 'RLS TESTS PASSED (% checks)', checks;
end
$$;
