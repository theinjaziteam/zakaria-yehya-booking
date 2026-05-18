insert into public.locations (slug, name, address, phone, lat, lng, timezone, active)
values
  ('achrafieh', 'Achrafieh', 'Rue Sursock area, Achrafieh, Beirut', '+961 1 111 111', 33.893800, 35.519600, 'Asia/Beirut', true),
  ('verdun', 'Verdun', 'Main commercial strip, Verdun, Beirut', '+961 1 222 222', 33.882500, 35.486200, 'Asia/Beirut', true),
  ('kaslik', 'Kaslik', 'Kaslik, Jounieh', '+961 9 333 333', 33.980800, 35.617500, 'Asia/Beirut', true)
on conflict (slug) do update
set
  name = excluded.name,
  address = excluded.address,
  phone = excluded.phone,
  lat = excluded.lat,
  lng = excluded.lng,
  timezone = excluded.timezone,
  active = excluded.active;

insert into public.service_categories (name, sort_order)
values
  ('Cut & Style', 1),
  ('Color', 2),
  ('Treatments', 3),
  ('Bridal', 4),
  ('Gentleman''s Grooming', 5)
on conflict (name) do update
set sort_order = excluded.sort_order;

insert into public.services (
  category_id,
  name,
  slug,
  duration_min,
  price_cents,
  description,
  requires_consultation,
  active,
  sort_order
)
select
  c.id,
  v.name,
  v.slug,
  v.duration_min,
  v.price_cents,
  v.description,
  v.requires_consultation,
  true,
  v.sort_order
from (
  values
    ('Cut & Style', 'Haircut & Style — Ladies', 'haircut-style-ladies', 60, 4500, 'A considered cut with finishing suited to evening or daylight.', false, 1),
    ('Cut & Style', 'Haircut & Style — Men', 'haircut-style-men', 45, 3000, 'Tailored cutting and finishing with a clean, polished line.', false, 2),
    ('Cut & Style', 'Children''s Cut (under 12)', 'childrens-cut-under-12', 30, 2000, 'A gentle service for younger clients, cut with pace and ease.', false, 3),
    ('Cut & Style', 'Blow-Dry & Styling', 'blow-dry-styling', 45, 3500, 'Brushed and shaped with the salon''s signature finish.', false, 4),
    ('Color', 'Hair Color (single process)', 'hair-color-single-process', 120, 9000, 'Single-process colour with attention to depth, shine, and tone.', false, 1),
    ('Color', 'Highlights / Balayage', 'highlights-balayage', 180, 18000, 'Placed lightening for dimension, softness, and a refined grow-out.', false, 2),
    ('Color', 'Color Correction', 'color-correction', 240, 25000, 'A corrective colour session requiring consultation and review.', true, 3),
    ('Treatments', 'Keratin Treatment', 'keratin-treatment', 180, 20000, 'A smoothing service for polish, softness, and manageability.', false, 1),
    ('Treatments', 'Hair Botox', 'hair-botox', 150, 15000, 'A restorative treatment for body, gloss, and revived texture.', false, 2),
    ('Bridal', 'Bridal Hair (trial)', 'bridal-hair-trial', 90, 12000, 'A private bridal rehearsal, shaped with photography in mind.', false, 1),
    ('Bridal', 'Bridal Hair (day-of)', 'bridal-hair-day-of', 120, 25000, 'A ceremony-day styling service with composed finishing.', false, 2),
    ('Gentleman''s Grooming', 'Beard Trim & Shape', 'beard-trim-shape', 30, 2000, 'A precise beard detailing service with clean shaping.', false, 1),
    ('Gentleman''s Grooming', 'Traditional Hot Shave', 'traditional-hot-shave', 45, 3000, 'A classic hot shave carried out with steady, unhurried technique.', false, 2)
) as v(category_name, name, slug, duration_min, price_cents, description, requires_consultation, sort_order)
join public.service_categories c
  on c.name = v.category_name
on conflict (slug) do update
set
  category_id = excluded.category_id,
  name = excluded.name,
  duration_min = excluded.duration_min,
  price_cents = excluded.price_cents,
  description = excluded.description,
  requires_consultation = excluded.requires_consultation,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into public.staff (name, slug, photo_url, bio, title, active, sort_order)
values
  ('Zakaria Haddad', 'zakaria-haddad', '/images/staff/zakaria-haddad.jpg', 'Cutting with a measured hand and a preference for quiet polish.', 'Master Stylist', true, 1),
  ('Yehya Khoury', 'yehya-khoury', '/images/staff/yehya-khoury.jpg', 'A senior eye for shape, movement, and the discipline of finish.', 'Creative Director', true, 2),
  ('Mira Daher', 'mira-daher', '/images/staff/mira-daher.jpg', 'Known for colour that reads softly in daylight and under flash.', 'Senior Colorist', true, 3),
  ('Lea Sayegh', 'lea-sayegh', '/images/staff/lea-sayegh.jpg', 'Bridal dressing with calm structure and a light editorial touch.', 'Bridal Specialist', true, 4),
  ('Omar Haddad', 'omar-haddad', '/images/staff/omar-haddad.jpg', 'Traditional grooming, carried with restraint and exactness.', 'Grooming Specialist', true, 5),
  ('Tony Azzam', 'tony-azzam', '/images/staff/tony-azzam.jpg', 'A classic barber''s line, sharpened for contemporary clients.', 'Senior Barber', true, 6),
  ('Rana Nasr', 'rana-nasr', '/images/staff/rana-nasr.jpg', 'Treatment-led care for texture, softness, and enduring shine.', 'Treatment Specialist', true, 7),
  ('Nadim Hanna', 'nadim-hanna', '/images/staff/nadim-hanna.jpg', 'A careful junior hand, especially suited to effortless daily styling.', 'Junior Stylist', true, 8)
on conflict (slug) do update
set
  name = excluded.name,
  photo_url = excluded.photo_url,
  bio = excluded.bio,
  title = excluded.title,
  active = excluded.active,
  sort_order = excluded.sort_order;

insert into public.staff_locations (staff_id, location_id)
select s.id, l.id
from (
  values
    ('zakaria-haddad', 'achrafieh'),
    ('zakaria-haddad', 'verdun'),
    ('yehya-khoury', 'achrafieh'),
    ('yehya-khoury', 'verdun'),
    ('yehya-khoury', 'kaslik'),
    ('mira-daher', 'achrafieh'),
    ('mira-daher', 'verdun'),
    ('lea-sayegh', 'verdun'),
    ('lea-sayegh', 'kaslik'),
    ('omar-haddad', 'achrafieh'),
    ('omar-haddad', 'verdun'),
    ('tony-azzam', 'verdun'),
    ('tony-azzam', 'kaslik'),
    ('rana-nasr', 'achrafieh'),
    ('rana-nasr', 'kaslik'),
    ('nadim-hanna', 'kaslik'),
    ('nadim-hanna', 'verdun')
) as v(staff_slug, location_slug)
join public.staff s on s.slug = v.staff_slug
join public.locations l on l.slug = v.location_slug
on conflict do nothing;

insert into public.staff_services (staff_id, service_id)
select s.id, sv.id
from (
  values
    ('zakaria-haddad', 'haircut-style-ladies'),
    ('zakaria-haddad', 'haircut-style-men'),
    ('zakaria-haddad', 'blow-dry-styling'),
    ('zakaria-haddad', 'childrens-cut-under-12'),
    ('yehya-khoury', 'haircut-style-ladies'),
    ('yehya-khoury', 'haircut-style-men'),
    ('yehya-khoury', 'blow-dry-styling'),
    ('yehya-khoury', 'hair-color-single-process'),
    ('yehya-khoury', 'highlights-balayage'),
    ('yehya-khoury', 'color-correction'),
    ('mira-daher', 'hair-color-single-process'),
    ('mira-daher', 'highlights-balayage'),
    ('mira-daher', 'color-correction'),
    ('mira-daher', 'blow-dry-styling'),
    ('lea-sayegh', 'bridal-hair-trial'),
    ('lea-sayegh', 'bridal-hair-day-of'),
    ('lea-sayegh', 'blow-dry-styling'),
    ('omar-haddad', 'haircut-style-men'),
    ('omar-haddad', 'beard-trim-shape'),
    ('omar-haddad', 'traditional-hot-shave'),
    ('tony-azzam', 'haircut-style-men'),
    ('tony-azzam', 'beard-trim-shape'),
    ('tony-azzam', 'traditional-hot-shave'),
    ('tony-azzam', 'childrens-cut-under-12'),
    ('rana-nasr', 'keratin-treatment'),
    ('rana-nasr', 'hair-botox'),
    ('rana-nasr', 'blow-dry-styling'),
    ('nadim-hanna', 'childrens-cut-under-12'),
    ('nadim-hanna', 'blow-dry-styling'),
    ('nadim-hanna', 'haircut-style-ladies'),
    ('nadim-hanna', 'haircut-style-men')
) as v(staff_slug, service_slug)
join public.staff s on s.slug = v.staff_slug
join public.services sv on sv.slug = v.service_slug
on conflict do nothing;

delete from public.working_hours wh
using public.staff s
where wh.staff_id = s.id
  and s.slug in (
    'zakaria-haddad',
    'yehya-khoury',
    'mira-daher',
    'lea-sayegh',
    'omar-haddad',
    'tony-azzam',
    'rana-nasr',
    'nadim-hanna'
  );

insert into public.working_hours (staff_id, location_id, day_of_week, start_time, end_time)
select
  s.id,
  l.id,
  d.day_of_week,
  case
    when s.slug in ('mira-daher', 'lea-sayegh') and d.day_of_week in (2, 4) then time '10:00'
    when s.slug = 'nadim-hanna' and d.day_of_week = 6 then time '10:00'
    else time '09:00'
  end as start_time,
  case
    when s.slug in ('tony-azzam', 'nadim-hanna') and d.day_of_week = 6 then time '18:00'
    when s.slug = 'rana-nasr' and d.day_of_week in (3, 5) then time '19:00'
    else time '20:00'
  end as end_time
from public.staff_locations sl
join public.staff s on s.id = sl.staff_id
join public.locations l on l.id = sl.location_id
cross join generate_series(1, 6) as d(day_of_week);

delete from public.time_off t
using public.staff s
where t.staff_id = s.id
  and s.slug in ('mira-daher', 'rana-nasr', 'lea-sayegh', 'tony-azzam');

with anchor as (
  select (current_date + ((8 - extract(dow from current_date)::integer) % 7))::date as base_monday
)
insert into public.time_off (staff_id, starts_at, ends_at, reason)
select s.id, v.starts_at, v.ends_at, v.reason
from (
  select 'mira-daher'::text as staff_slug,
         (((a.base_monday + 8)::timestamp + time '09:00') at time zone 'Asia/Beirut') as starts_at,
         (((a.base_monday + 8)::timestamp + time '13:00') at time zone 'Asia/Beirut') as ends_at,
         'Private consultation block'::text as reason
  from anchor a
  union all
  select 'rana-nasr',
         (((a.base_monday + 11)::timestamp + time '09:00') at time zone 'Asia/Beirut'),
         (((a.base_monday + 11)::timestamp + time '18:00') at time zone 'Asia/Beirut'),
         'Training and product certification'
  from anchor a
  union all
  select 'lea-sayegh',
         (((a.base_monday + 10)::timestamp + time '09:00') at time zone 'Asia/Beirut'),
         (((a.base_monday + 10)::timestamp + time '12:00') at time zone 'Asia/Beirut'),
         'Bridal preparation off-site'
  from anchor a
  union all
  select 'tony-azzam',
         (((a.base_monday + 12)::timestamp + time '12:00') at time zone 'Asia/Beirut'),
         (((a.base_monday + 12)::timestamp + time '16:00') at time zone 'Asia/Beirut'),
         'Private appointment block'
  from anchor a
) v
join public.staff s on s.slug = v.staff_slug;

with anchor as (
  select (current_date + ((8 - extract(dow from current_date)::integer) % 7))::date as base_monday
),
sample_bookings as (
  select * from (
    values
      ('ZYA2BK', 'Maya Haddad', '+96170111222', 'maya@example.com', 'achrafieh', 'haircut-style-ladies', 'zakaria-haddad', 0, time '10:00', 'confirmed', 'Prefers a polished finish.'),
      ('ZYC3DL', 'Rami Saliba', '+96171122334', 'rami@example.com', 'verdun', 'haircut-style-men', 'yehya-khoury', 0, time '13:00', 'confirmed', null),
      ('ZYE4FM', 'Lina Azar', '+96176123456', 'lina@example.com', 'verdun', 'bridal-hair-trial', 'lea-sayegh', 1, time '15:00', 'confirmed', 'Bring veil reference.'),
      ('ZYG5HN', 'Nour Khoury', '+96181111222', 'nour@example.com', 'achrafieh', 'blow-dry-styling', 'mira-daher', 1, time '11:30', 'confirmed', null),
      ('ZYJ6KP', 'Karim Nader', '+96132111222', null, 'achrafieh', 'beard-trim-shape', 'omar-haddad', 2, time '11:00', 'confirmed', null),
      ('ZYL7QR', 'Tala Saab', '+96176111888', 'tala@example.com', 'achrafieh', 'hair-botox', 'rana-nasr', 2, time '14:00', 'confirmed', null),
      ('ZYM8ST', 'Jad Helou', '+96170133445', null, 'kaslik', 'traditional-hot-shave', 'tony-azzam', 3, time '10:00', 'confirmed', null),
      ('ZYN9UV', 'Celine Ghosn', '+96181122334', 'celine@example.com', 'achrafieh', 'hair-color-single-process', 'mira-daher', 3, time '11:30', 'confirmed', 'Warm brown tone.'),
      ('ZYP2WX', 'Layal Tohme', '+96176199887', 'layal@example.com', 'verdun', 'bridal-hair-day-of', 'lea-sayegh', 4, time '10:00', 'confirmed', 'Ceremony at 17:00.'),
      ('ZYR3YZ', 'Samir Choueiri', '+96132144556', null, 'verdun', 'haircut-style-men', 'omar-haddad', 4, time '16:30', 'confirmed', null),
      ('ZYS4A2', 'Mira Farhat', '+96170888991', 'mfarhat@example.com', 'achrafieh', 'blow-dry-styling', 'zakaria-haddad', 5, time '09:15', 'confirmed', null),
      ('ZYT5B3', 'Dalia Matar', '+96176766554', 'dalia@example.com', 'achrafieh', 'keratin-treatment', 'rana-nasr', 5, time '12:00', 'confirmed', 'Sensitive scalp.'),
      ('ZYU6C4', 'Elias Aboujaoude', '+96171444555', null, 'kaslik', 'haircut-style-men', 'tony-azzam', 7, time '10:30', 'confirmed', null),
      ('ZYV7D5', 'Rita Hage', '+96176123499', 'rita@example.com', 'achrafieh', 'highlights-balayage', 'yehya-khoury', 8, time '16:00', 'confirmed', null),
      ('ZYW8E6', 'Nadine Karam', '+96181333444', 'nadine@example.com', 'verdun', 'blow-dry-styling', 'nadim-hanna', 8, time '14:00', 'confirmed', null),
      ('ZYX9F7', 'Rana Sfeir', '+96170999111', 'rana.sfeir@example.com', 'achrafieh', 'color-correction', 'mira-daher', 9, time '14:30', 'confirmed', 'Consultation requested.'),
      ('ZZA2G8', 'Walid Tabet', '+96132222111', null, 'verdun', 'traditional-hot-shave', 'omar-haddad', 10, time '17:00', 'confirmed', null),
      ('ZZB3H9', 'Salma Yazbeck', '+96176444222', 'salma@example.com', 'kaslik', 'childrens-cut-under-12', 'nadim-hanna', 11, time '13:30', 'cancelled', 'Client may rebook next week.')
  ) as t(reference_code, customer_name, customer_phone, customer_email, location_slug, service_slug, staff_slug, day_offset, local_time, status, notes)
),
prepared as (
  select
    sb.reference_code,
    sb.customer_name,
    sb.customer_phone,
    sb.customer_email,
    l.id as location_id,
    sv.id as service_id,
    st.id as staff_id,
    (((a.base_monday + sb.day_offset)::timestamp + sb.local_time) at time zone l.timezone) as starts_at,
    ((((a.base_monday + sb.day_offset)::timestamp + sb.local_time) + make_interval(mins => sv.duration_min)) at time zone l.timezone) as ends_at,
    sb.status,
    sb.notes
  from sample_bookings sb
  cross join anchor a
  join public.locations l on l.slug = sb.location_slug
  join public.services sv on sv.slug = sb.service_slug
  join public.staff st on st.slug = sb.staff_slug
)
insert into public.bookings (
  reference_code,
  customer_name,
  customer_phone,
  customer_email,
  location_id,
  service_id,
  staff_id,
  starts_at,
  ends_at,
  status,
  notes,
  cancelled_at
)
select
  p.reference_code,
  p.customer_name,
  p.customer_phone,
  p.customer_email,
  p.location_id,
  p.service_id,
  p.staff_id,
  p.starts_at,
  p.ends_at,
  p.status,
  p.notes,
  case when p.status = 'cancelled' then now() else null end
from prepared p
on conflict (reference_code) do nothing;

insert into public.booking_events (booking_id, event_type, payload)
select
  b.id,
  'booking_created',
  jsonb_build_object('seeded', true, 'reference_code', b.reference_code)
from public.bookings b
where b.reference_code in (
  'ZYA2BK', 'ZYC3DL', 'ZYE4FM', 'ZYG5HN', 'ZYJ6KP', 'ZYL7QR', 'ZYM8ST', 'ZYN9UV',
  'ZYP2WX', 'ZYR3YZ', 'ZYS4A2', 'ZYT5B3', 'ZYU6C4', 'ZYV7D5', 'ZYW8E6', 'ZYX9F7',
  'ZZA2G8', 'ZZB3H9'
)
and not exists (
  select 1
  from public.booking_events e
  where e.booking_id = b.id
    and e.event_type = 'booking_created'
);

insert into public.booking_events (booking_id, event_type, payload)
select
  b.id,
  'consultation_required',
  jsonb_build_object('requires_review', true, 'seeded', true)
from public.bookings b
join public.services s on s.id = b.service_id
where b.reference_code = 'ZYX9F7'
  and s.requires_consultation = true
  and not exists (
    select 1
    from public.booking_events e
    where e.booking_id = b.id
      and e.event_type = 'consultation_required'
  );
