-- Save Slot · extensions, enums and shared helpers

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

create type public.platform as enum ('gb', 'gbc');
-- gb = grey DMG cart · gbc_dual = black, plays on both · gbc_only = clear, GBC only
create type public.cart_compat as enum ('gb', 'gbc_dual', 'gbc_only');
create type public.region as enum ('eu', 'us', 'jp');
create type public.date_precision as enum ('day', 'month', 'year');
create type public.item_condition as enum ('loose', 'good', 'very_good', 'mint', 'sealed');
create type public.play_status as enum ('backlog', 'playing', 'completed', 'abandoned');
create type public.media_kind as enum (
  'boxart_front', 'boxart_back', 'cartridge', 'manual', 'screenshot', 'title_screen'
);
create type public.price_grade as enum ('loose', 'cib', 'new');
create type public.wish_priority as enum ('high', 'medium', 'low');
create type public.visibility as enum ('private', 'unlisted', 'public');
create type public.data_source as enum ('seed', 'igdb', 'thegamesdb', 'mobygames', 'screenscraper', 'pricecharting', 'manual', 'user');

-- Immutable wrapper so unaccent can be used in indexes and generated values.
create or replace function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

-- Normalised text used for search: lowercase, no accents ("Pokémon" -> "pokemon").
create or replace function public.f_search_norm(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select lower(public.f_unaccent($1))
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
