-- Save Slot · webshop and repair service
-- Visitors can read the active catalogue and the repair catalogue. Everything else (orders,
-- repair requests, notes, photos) is written and read only by trusted server code using the
-- service role, after its own validation and authorization checks.

create type public.product_condition as enum ('new', 'used', 'refurbished');
create type public.order_status as enum (
  'pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'payment_failed'
);
create type public.repair_status as enum (
  'received', 'in_progress', 'waiting_parts', 'repairing', 'done', 'ready_or_shipped'
);
create type public.repair_delivery as enum ('appointment', 'mail_in', 'drop_off');

-- ---------------------------------------------------------------- catalogue
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 60),
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  category_id uuid references public.product_categories (id) on delete set null,
  price_cents integer not null check (price_cents between 0 and 10000000),
  currency char(3) not null default 'EUR',
  stock integer not null default 0 check (stock >= 0),
  condition public.product_condition not null default 'used',
  specs jsonb not null default '[]'::jsonb check (jsonb_typeof(specs) = 'array'),
  active boolean not null default false,
  search_text text generated always as (lower(name || ' ' || description)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_active_idx on public.products (active, created_at desc);
create index products_search_trgm_idx on public.products using gin (search_text extensions.gin_trgm_ops);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path text not null unique,
  alt text check (char_length(alt) <= 200),
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort);

-- ---------------------------------------------------------------- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique check (number ~ '^SS-[2-9A-HJKMNP-Z]{6}$'),
  user_id uuid references auth.users (id) on delete set null,
  email text not null check (char_length(email) <= 254),
  name text not null check (char_length(name) between 1 and 120),
  phone text check (char_length(phone) <= 40),
  address jsonb not null,
  status public.order_status not null default 'pending_payment',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency char(3) not null default 'EUR',
  mollie_payment_id text unique,
  needs_attention text,
  token_hash text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity between 1 and 99)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- Atomic "paid": takes stock once, even when Mollie calls the webhook more than once.
create or replace function public.mark_order_paid(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.orders;
  shortage text[] := '{}';
  item record;
  current_stock integer;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('alreadyPaid', false, 'shortage', 'order not found');
  end if;
  if o.paid_at is not null then
    return jsonb_build_object('alreadyPaid', true, 'shortage', null);
  end if;
  for item in
    select oi.product_id, oi.name, oi.quantity
    from public.order_items oi
    where oi.order_id = p_order_id
  loop
    current_stock := null;
    if item.product_id is not null then
      select stock into current_stock from public.products where id = item.product_id for update;
    end if;
    if current_stock is null or current_stock < item.quantity then
      shortage := shortage || item.name;
    end if;
    if current_stock is not null then
      update public.products set stock = greatest(0, stock - item.quantity)
      where id = item.product_id;
    end if;
  end loop;
  update public.orders
  set status = 'paid',
      paid_at = now(),
      needs_attention = case when cardinality(shortage) > 0
        then 'Not enough stock for: ' || array_to_string(shortage, ', ') end
  where id = p_order_id;
  return jsonb_build_object(
    'alreadyPaid', false,
    'shortage', case when cardinality(shortage) > 0
      then 'Not enough stock for: ' || array_to_string(shortage, ', ') end
  );
end;
$$;
revoke execute on function public.mark_order_paid(uuid) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid) to service_role;

-- ---------------------------------------------------------------- repairs
create table public.repair_devices (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort smallint not null default 0,
  active boolean not null default true
);

create table public.repair_issues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  sort smallint not null default 0,
  active boolean not null default true
);

-- Price/duration indication set by the owner; null = on request.
create table public.repair_prices (
  device_id uuid not null references public.repair_devices (id) on delete cascade,
  issue_id uuid not null references public.repair_issues (id) on delete cascade,
  price_from_cents integer check (price_from_cents >= 0),
  price_to_cents integer check (price_to_cents >= 0),
  days_min smallint check (days_min >= 0),
  days_max smallint check (days_max >= 0),
  updated_at timestamptz not null default now(),
  primary key (device_id, issue_id),
  constraint repair_prices_range check (
    (price_to_cents is null or price_from_cents is null or price_to_cents >= price_from_cents)
    and (days_max is null or days_min is null or days_max >= days_min)
  )
);
create index repair_prices_issue_idx on public.repair_prices (issue_id);

create table public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  number text not null unique check (number ~ '^RS-[2-9A-HJKMNP-Z]{6}$'),
  user_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) between 6 and 40),
  device_id uuid not null references public.repair_devices (id),
  issue_id uuid not null references public.repair_issues (id),
  brand text check (char_length(brand) <= 60),
  model text check (char_length(model) <= 60),
  serial text check (char_length(serial) <= 60),
  description text not null check (char_length(description) between 10 and 3000),
  delivery public.repair_delivery not null,
  preferred_date date,
  status public.repair_status not null default 'received',
  estimate jsonb,
  final_price_cents integer check (final_price_cents >= 0),
  photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 4),
  token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index repair_requests_status_idx on public.repair_requests (status, created_at desc);
create index repair_requests_device_idx on public.repair_requests (device_id);
create index repair_requests_issue_idx on public.repair_requests (issue_id);
create index repair_requests_user_idx on public.repair_requests (user_id);

-- Customer-visible status history.
create table public.repair_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.repair_requests (id) on delete cascade,
  status public.repair_status not null,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now()
);
create index repair_events_request_idx on public.repair_events (request_id, created_at);

-- Internal notes, never shown to the customer.
create table public.repair_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.repair_requests (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  author text not null,
  created_at timestamptz not null default now()
);
create index repair_notes_request_idx on public.repair_notes (request_id, created_at desc);

-- ---------------------------------------------------------------- updated_at
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger repair_requests_updated_at before update on public.repair_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- RLS
do $$
declare t text;
begin
  foreach t in array array[
    'product_categories', 'products', 'product_images', 'orders', 'order_items',
    'repair_devices', 'repair_issues', 'repair_prices', 'repair_requests',
    'repair_events', 'repair_notes'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
  end loop;
end $$;

create policy "product_categories are readable by everyone" on public.product_categories
  for select to anon, authenticated using (true);
create policy "active products are readable by everyone" on public.products
  for select to anon, authenticated using (active);
create policy "images of active products are readable by everyone" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.active));
create policy "repair_devices are readable by everyone" on public.repair_devices
  for select to anon, authenticated using (active);
create policy "repair_issues are readable by everyone" on public.repair_issues
  for select to anon, authenticated using (active);
create policy "repair_prices are readable by everyone" on public.repair_prices
  for select to anon, authenticated using (true);
-- orders, order_items, repair_requests, repair_events, repair_notes: no policies for
-- anon/authenticated at all → only the service role (server code) can touch them.
revoke select on public.orders, public.order_items, public.repair_requests,
  public.repair_events, public.repair_notes from anon, authenticated;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('repair-photos', 'repair-photos', false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
-- No storage policies for anon/authenticated: uploads go through the server (service role).
-- product-images is a public bucket (read by URL); repair-photos is private.

-- ---------------------------------------------------------------- repair catalogue (facts only)
insert into public.repair_devices (slug, name, sort) values
  ('game-boy', 'Game Boy (original, DMG)', 0),
  ('game-boy-pocket', 'Game Boy Pocket', 1),
  ('game-boy-light', 'Game Boy Light', 2),
  ('game-boy-color', 'Game Boy Color', 3),
  ('cartridge', 'Game Boy / Game Boy Color cartridge', 4)
on conflict (slug) do nothing;

insert into public.repair_issues (slug, name, description, sort) values
  ('screen', 'Screen or screen lens', 'Cracked or scratched lens, missing lines, dim or dead display.', 0),
  ('battery', 'Battery compartment & power', 'Corroded contacts, no power, switch or power jack problems.', 1),
  ('buttons', 'Buttons', 'Sticky, unresponsive or missing buttons and membranes.', 2),
  ('sound', 'Sound', 'No sound, crackling speaker or broken headphone jack.', 3),
  ('connector', 'Cartridge slot or link port', 'Games do not load reliably, damaged connector or link port.', 4),
  ('save-battery', 'Cartridge save battery', 'Save files are lost: the save battery in a cartridge is empty.', 5),
  ('software', 'Game will not start', 'Freezes, glitches or a cartridge that does not boot.', 6),
  ('other', 'Something else', 'Describe the problem and we will take a look.', 7)
on conflict (slug) do nothing;
