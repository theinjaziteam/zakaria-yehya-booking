create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text not null,
  phone text,
  lat numeric(9, 6),
  lng numeric(9, 6),
  timezone text not null default 'Asia/Beirut',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories(id) on delete restrict,
  name text not null,
  slug text not null unique,
  duration_min integer not null check (duration_min > 0),
  price_cents integer not null check (price_cents >= 0),
  description text,
  requires_consultation boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  photo_url text,
  bio text,
  title text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_locations (
  staff_id uuid not null references public.staff(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  primary key (staff_id, location_id)
);

create table if not exists public.staff_services (
  staff_id uuid not null references public.staff(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (staff_id, service_id)
);

create table if not exists public.working_hours (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.time_off (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  location_id uuid not null references public.locations(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  staff_id uuid not null references public.staff(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (customer_phone ~ '^\+[1-9][0-9]{7,14}$')
);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_services_category_sort
  on public.services (category_id, sort_order, name);

create index if not exists idx_staff_sort
  on public.staff (sort_order, name);

create index if not exists idx_staff_locations_location
  on public.staff_locations (location_id, staff_id);

create index if not exists idx_staff_services_service
  on public.staff_services (service_id, staff_id);

create index if not exists idx_working_hours_staff_location_day
  on public.working_hours (staff_id, location_id, day_of_week);

create index if not exists idx_time_off_staff_starts_at
  on public.time_off (staff_id, starts_at);

create index if not exists idx_bookings_staff_starts_at
  on public.bookings (staff_id, starts_at);

create index if not exists idx_bookings_location_starts_at
  on public.bookings (location_id, starts_at);

create index if not exists idx_bookings_reference_code
  on public.bookings (reference_code);

create index if not exists idx_booking_events_booking_created_at
  on public.booking_events (booking_id, created_at desc);

alter table public.bookings
  drop constraint if exists no_double_booking;

alter table public.bookings
  add constraint no_double_booking
  exclude using gist (
    staff_id with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  )
  where (status = 'confirmed');
