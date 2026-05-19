-- ─────────────────────────────────────────────────────────────
-- Products catalogue
-- ─────────────────────────────────────────────────────────────
create table if not exists public.products (
id uuid primary key default gen_random_uuid(),
name text not null,
description text,
price_cents integer not null check (price_cents >= 0),
image_url text,
active boolean not null default true,
sort_order integer not null default 0,
created_at timestamptz not null default now()
);

create index if not exists idx_products_sort
on public.products (sort_order, name);

-- ─────────────────────────────────────────────────────────────
-- Product orders
-- ─────────────────────────────────────────────────────────────
create table if not exists public.product_orders (
id uuid primary key default gen_random_uuid(),
customer_name text not null,
customer_phone text not null,
customer_email text not null,
items jsonb not null default '[]'::jsonb,
total_cents integer not null check (total_cents >= 0),
status text not null default 'pending'
  check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
notes text,
created_at timestamptz not null default now()
);

create index if not exists idx_product_orders_created_at
on public.product_orders (created_at desc);

-- ─────────────────────────────────────────────────────────────
-- RLS for products
-- ─────────────────────────────────────────────────────────────
alter table public.products enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read
on public.products
for select
to anon, authenticated
using (active = true);

drop policy if exists products_admin_all on public.products;
create policy products_admin_all
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- RLS for product_orders
-- ─────────────────────────────────────────────────────────────
alter table public.product_orders enable row level security;

drop policy if exists product_orders_anon_insert on public.product_orders;
create policy product_orders_anon_insert
on public.product_orders
for insert
to anon, authenticated
with check (true);

drop policy if exists product_orders_admin_all on public.product_orders;
create policy product_orders_admin_all
on public.product_orders
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- Fix bookings RLS — allow anon INSERT as belt-and-suspenders
-- (create_booking RPC is SECURITY DEFINER but this ensures
--  direct inserts also work if the RPC is unavailable)
-- ─────────────────────────────────────────────────────────────
drop policy if exists bookings_anon_insert on public.bookings;
create policy bookings_anon_insert
on public.bookings
for insert
to anon, authenticated
with check (true);

-- Allow authenticated customers to read their own bookings
drop policy if exists bookings_customer_read on public.bookings;
create policy bookings_customer_read
on public.bookings
for select
to authenticated
using (customer_email = (auth.jwt()->>'email'));

-- ─────────────────────────────────────────────────────────────
-- Seed: 4 luxury products
-- ─────────────────────────────────────────────────────────────
insert into public.products (name, description, price_cents, image_url, sort_order)
values
(
  'Argan Oil Elixir',
  'Deep-conditioning Moroccan argan oil treatment. Repairs, strengthens, and adds luminous shine to every strand.',
  4500,
  'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&q=80&auto=format&fit=crop',
  1
),
(
  'Scalp Revival Serum',
  'Purifying serum that balances and nourishes the scalp. Strengthens roots from the source.',
  3800,
  'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80&auto=format&fit=crop',
  2
),
(
  'Colour-Lock Conditioner',
  'Colour-preserving conditioner that seals the cuticle and extends the life of your colour treatment.',
  3200,
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80&auto=format&fit=crop',
  3
),
(
  'Styling Clay',
  'Medium-hold, matte-finish clay. Buildable texture with a clean, natural-looking result.',
  2800,
  'https://images.unsplash.com/photo-1590156562745-5d51c4e69e41?w=800&q=80&auto=format&fit=crop',
  4
)
on conflict do nothing;
