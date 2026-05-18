create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  );
$$;

alter table public.locations enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.staff_locations enable row level security;
alter table public.staff_services enable row level security;
alter table public.working_hours enable row level security;
alter table public.time_off enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.admins enable row level security;

drop policy if exists locations_public_read on public.locations;
create policy locations_public_read
  on public.locations
  for select
  to anon, authenticated
  using (active = true);

drop policy if exists locations_admin_all on public.locations;
create policy locations_admin_all
  on public.locations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists service_categories_public_read on public.service_categories;
create policy service_categories_public_read
  on public.service_categories
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.services s
      where s.category_id = service_categories.id
        and s.active = true
    )
  );

drop policy if exists service_categories_admin_all on public.service_categories;
create policy service_categories_admin_all
  on public.service_categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists services_public_read on public.services;
create policy services_public_read
  on public.services
  for select
  to anon, authenticated
  using (active = true);

drop policy if exists services_admin_all on public.services;
create policy services_admin_all
  on public.services
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists staff_public_read on public.staff;
create policy staff_public_read
  on public.staff
  for select
  to anon, authenticated
  using (active = true);

drop policy if exists staff_admin_all on public.staff;
create policy staff_admin_all
  on public.staff
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists staff_locations_public_read on public.staff_locations;
create policy staff_locations_public_read
  on public.staff_locations
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.staff s
      join public.locations l on l.id = staff_locations.location_id
      where s.id = staff_locations.staff_id
        and s.active = true
        and l.active = true
    )
  );

drop policy if exists staff_locations_admin_all on public.staff_locations;
create policy staff_locations_admin_all
  on public.staff_locations
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists staff_services_public_read on public.staff_services;
create policy staff_services_public_read
  on public.staff_services
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.staff st
      join public.services sv on sv.id = staff_services.service_id
      where st.id = staff_services.staff_id
        and st.active = true
        and sv.active = true
    )
  );

drop policy if exists staff_services_admin_all on public.staff_services;
create policy staff_services_admin_all
  on public.staff_services
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists working_hours_public_read on public.working_hours;
create policy working_hours_public_read
  on public.working_hours
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.staff st
      join public.locations l on l.id = working_hours.location_id
      where st.id = working_hours.staff_id
        and st.active = true
        and l.active = true
    )
  );

drop policy if exists working_hours_admin_all on public.working_hours;
create policy working_hours_admin_all
  on public.working_hours
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists time_off_admin_all on public.time_off;
create policy time_off_admin_all
  on public.time_off
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all
  on public.bookings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists booking_events_admin_all on public.booking_events;
create policy booking_events_admin_all
  on public.booking_events
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists admins_admin_all on public.admins;
create policy admins_admin_all
  on public.admins
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
