-- Save Slot · move the RLS helper out of the exposed API schema.
-- Policies still need to call it as the querying role, so anon/authenticated get USAGE on the
-- schema, but PostgREST only exposes `public`, so it is no longer reachable as /rpc/*.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

alter function public.is_public_profile(uuid) set schema private;
revoke execute on function private.is_public_profile(uuid) from public;
grant execute on function private.is_public_profile(uuid) to anon, authenticated;
