create or replace function public.generate_reference_code(p_length integer default 6)
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  output text := '';
  i integer;
begin
  if p_length is null or p_length < 4 then
    p_length := 6;
  end if;

  for i in 1..p_length loop
    output := output || substr(chars, 1 + floor(random() * length(chars))::integer, 1);
  end loop;

  return output;
end;
$$;

create or replace function public.get_available_slots(
  p_staff_id uuid,
  p_service_id uuid,
  p_date date,
  p_location_id uuid
)
returns table (
  starts_at timestamptz,
  ends_at timestamptz,
  available boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with service_ctx as (
    select s.duration_min
    from public.services s
    join public.staff_services ss
      on ss.service_id = s.id
     and ss.staff_id = p_staff_id
    where s.id = p_service_id
      and s.active = true
  ),
  location_ctx as (
    select l.timezone
    from public.locations l
    join public.staff_locations sl
      on sl.location_id = l.id
     and sl.staff_id = p_staff_id
    join public.staff st
      on st.id = p_staff_id
    where l.id = p_location_id
      and l.active = true
      and st.active = true
  ),
  bounds as (
    select
      lc.timezone,
      timezone(lc.timezone, now())::date as today_local,
      (timezone(lc.timezone, now())::date + 20) as last_bookable_day,
      sc.duration_min
    from location_ctx lc
    cross join service_ctx sc
  ),
  window_ctx as (
    select wh.start_time, wh.end_time, b.duration_min, b.timezone
    from public.working_hours wh
    cross join bounds b
    where wh.staff_id = p_staff_id
      and wh.location_id = p_location_id
      and p_date between b.today_local and b.last_bookable_day
      and wh.day_of_week = extract(dow from p_date)::smallint
      and wh.end_time > wh.start_time
  ),
  candidate_local as (
    select
      generate_series(
        p_date::timestamp + wc.start_time,
        p_date::timestamp + wc.end_time - make_interval(mins => wc.duration_min),
        interval '15 minutes'
      ) as local_start,
      wc.duration_min,
      wc.timezone
    from window_ctx wc
  ),
  candidate_slots as (
    select
      cl.local_start at time zone cl.timezone as starts_at,
      (cl.local_start + make_interval(mins => cl.duration_min)) at time zone cl.timezone as ends_at
    from candidate_local cl
  )
  select
    cs.starts_at,
    cs.ends_at,
    (
      cs.starts_at >= now()
      and not exists (
        select 1
        from public.time_off t
        where t.staff_id = p_staff_id
          and tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(cs.starts_at, cs.ends_at, '[)')
      )
      and not exists (
        select 1
        from public.bookings b
        where b.staff_id = p_staff_id
          and b.status = 'confirmed'
          and tstzrange(b.starts_at, b.ends_at, '[)') && tstzrange(cs.starts_at, cs.ends_at, '[)')
      )
    ) as available
  from candidate_slots cs
  where cs.ends_at > cs.starts_at
  order by cs.starts_at;
$$;

create or replace function public.get_available_days(
  p_staff_id uuid,
  p_service_id uuid,
  p_location_id uuid,
  p_from date,
  p_to date
)
returns table (
  day date,
  available_slots_count integer,
  has_availability boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with location_ctx as (
    select l.timezone
    from public.locations l
    where l.id = p_location_id
      and l.active = true
  ),
  bounds as (
    select
      greatest(p_from, timezone(lc.timezone, now())::date) as from_day,
      least(p_to, timezone(lc.timezone, now())::date + 20) as to_day
    from location_ctx lc
  ),
  days as (
    select generate_series(b.from_day, b.to_day, interval '1 day')::date as day
    from bounds b
  )
  select
    d.day,
    coalesce(a.available_slots_count, 0) as available_slots_count,
    coalesce(a.available_slots_count, 0) > 0 as has_availability
  from days d
  left join lateral (
    select count(*)::integer as available_slots_count
    from public.get_available_slots(p_staff_id, p_service_id, d.day, p_location_id) s
    where s.available = true
  ) a on true
  order by d.day;
$$;

create or replace function public.create_booking(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_name text;
  v_customer_phone text;
  v_customer_email text;
  v_notes text;
  v_location_id uuid;
  v_service_id uuid;
  v_staff_id uuid;
  v_starts_at timestamptz;
  v_ends_at timestamptz;
  v_duration_min integer;
  v_requires_consultation boolean := false;
  v_location_timezone text;
  v_local_start timestamp;
  v_local_end timestamp;
  v_today_local date;
  v_reference_code text;
  v_booking_id uuid;
  v_attempt integer;
begin
  if p_payload is null then
    return jsonb_build_object('error', 'invalid_payload');
  end if;

  v_customer_name := nullif(trim(coalesce(p_payload ->> 'customer_name', '')), '');
  v_customer_phone := nullif(trim(coalesce(p_payload ->> 'customer_phone', '')), '');
  v_customer_email := nullif(trim(coalesce(p_payload ->> 'customer_email', '')), '');
  v_notes := nullif(trim(coalesce(p_payload ->> 'notes', '')), '');
  v_location_id := nullif(p_payload ->> 'location_id', '')::uuid;
  v_service_id := nullif(p_payload ->> 'service_id', '')::uuid;
  v_staff_id := nullif(p_payload ->> 'staff_id', '')::uuid;
  v_starts_at := (p_payload ->> 'starts_at')::timestamptz;

  if v_customer_name is null
     or v_customer_phone is null
     or v_location_id is null
     or v_service_id is null
     or v_staff_id is null
     or v_starts_at is null then
    return jsonb_build_object('error', 'invalid_payload');
  end if;

  if length(v_customer_name) < 2 then
    return jsonb_build_object('error', 'invalid_name');
  end if;

  if v_customer_phone !~ '^\+[1-9][0-9]{7,14}$' then
    return jsonb_build_object('error', 'invalid_phone');
  end if;

  select s.duration_min, s.requires_consultation, l.timezone
    into v_duration_min, v_requires_consultation, v_location_timezone
  from public.services s
  join public.staff_services ss
    on ss.service_id = s.id
   and ss.staff_id = v_staff_id
  join public.staff st
    on st.id = v_staff_id
   and st.active = true
  join public.staff_locations sl
    on sl.staff_id = v_staff_id
   and sl.location_id = v_location_id
  join public.locations l
    on l.id = v_location_id
   and l.active = true
  where s.id = v_service_id
    and s.active = true;

  if not found then
    return jsonb_build_object('error', 'service_unavailable');
  end if;

  if extract(minute from v_starts_at)::integer % 15 <> 0
     or extract(second from v_starts_at) <> 0 then
    return jsonb_build_object('error', 'invalid_time');
  end if;

  v_ends_at := v_starts_at + make_interval(mins => v_duration_min);
  v_local_start := timezone(v_location_timezone, v_starts_at);
  v_local_end := timezone(v_location_timezone, v_ends_at);
  v_today_local := timezone(v_location_timezone, now())::date;

  if v_starts_at < now() then
    return jsonb_build_object('error', 'past_time');
  end if;

  if v_local_start::date < v_today_local or v_local_start::date > v_today_local + 20 then
    return jsonb_build_object('error', 'outside_booking_window');
  end if;

  if v_local_start::date <> v_local_end::date then
    return jsonb_build_object('error', 'outside_working_hours');
  end if;

  if not exists (
    select 1
    from public.working_hours wh
    where wh.staff_id = v_staff_id
      and wh.location_id = v_location_id
      and wh.day_of_week = extract(dow from v_local_start)::smallint
      and v_local_start::time >= wh.start_time
      and v_local_end::time <= wh.end_time
  ) then
    return jsonb_build_object('error', 'outside_working_hours');
  end if;

  if exists (
    select 1
    from public.time_off t
    where t.staff_id = v_staff_id
      and tstzrange(t.starts_at, t.ends_at, '[)') && tstzrange(v_starts_at, v_ends_at, '[)')
  ) then
    return jsonb_build_object('error', 'staff_unavailable');
  end if;

  for v_attempt in 1..25 loop
    v_reference_code := public.generate_reference_code(6);

    begin
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
        notes
      ) values (
        v_reference_code,
        v_customer_name,
        v_customer_phone,
        v_customer_email,
        v_location_id,
        v_service_id,
        v_staff_id,
        v_starts_at,
        v_ends_at,
        v_notes
      )
      returning id into v_booking_id;

      exit;
    exception
      when unique_violation then
        v_booking_id := null;
      when exclusion_violation then
        return jsonb_build_object('error', 'slot_taken');
    end;
  end loop;

  if v_booking_id is null then
    return jsonb_build_object('error', 'reference_generation_failed');
  end if;

  insert into public.booking_events (booking_id, event_type, payload)
  values (
    v_booking_id,
    'booking_created',
    jsonb_build_object(
      'reference_code', v_reference_code,
      'starts_at', v_starts_at,
      'ends_at', v_ends_at
    )
  );

  if v_requires_consultation then
    insert into public.booking_events (booking_id, event_type, payload)
    values (
      v_booking_id,
      'consultation_required',
      jsonb_build_object(
        'requires_review', true,
        'reason', 'service_requires_consultation'
      )
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'reference_code', v_reference_code,
    'requires_consultation', v_requires_consultation
  );
exception
  when invalid_text_representation or datetime_field_overflow then
    return jsonb_build_object('error', 'invalid_payload');
end;
$$;

create or replace function public.get_booking_by_ref(p_ref text)
returns table (
  booking_id uuid,
  reference_code text,
  status text,
  customer_name text,
  customer_phone text,
  customer_email text,
  starts_at timestamptz,
  ends_at timestamptz,
  notes text,
  cancelled_at timestamptz,
  created_at timestamptz,
  location_id uuid,
  location_name text,
  location_slug text,
  location_address text,
  location_phone text,
  location_timezone text,
  service_id uuid,
  service_name text,
  service_slug text,
  service_duration_min integer,
  service_price_cents integer,
  service_requires_consultation boolean,
  staff_id uuid,
  staff_name text,
  staff_slug text,
  staff_title text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id as booking_id,
    b.reference_code,
    b.status,
    b.customer_name,
    b.customer_phone,
    b.customer_email,
    b.starts_at,
    b.ends_at,
    b.notes,
    b.cancelled_at,
    b.created_at,
    l.id as location_id,
    l.name as location_name,
    l.slug as location_slug,
    l.address as location_address,
    l.phone as location_phone,
    l.timezone as location_timezone,
    s.id as service_id,
    s.name as service_name,
    s.slug as service_slug,
    s.duration_min as service_duration_min,
    s.price_cents as service_price_cents,
    s.requires_consultation as service_requires_consultation,
    st.id as staff_id,
    st.name as staff_name,
    st.slug as staff_slug,
    st.title as staff_title
  from public.bookings b
  join public.locations l on l.id = b.location_id
  join public.services s on s.id = b.service_id
  join public.staff st on st.id = b.staff_id
  where upper(trim(b.reference_code)) = upper(trim(p_ref))
  limit 1;
$$;

create or replace function public.cancel_booking(
  p_ref text,
  p_phone_last4 text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_phone_digits text;
begin
  if p_ref is null or trim(p_ref) = '' then
    return jsonb_build_object('error', 'invalid_reference');
  end if;

  if p_phone_last4 is null or p_phone_last4 !~ '^[0-9]{4}$' then
    return jsonb_build_object('error', 'invalid_phone_last4');
  end if;

  select *
    into v_booking
  from public.bookings
  where upper(reference_code) = upper(trim(p_ref))
  limit 1;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  if v_booking.status = 'cancelled' then
    return jsonb_build_object('error', 'already_cancelled');
  end if;

  if v_booking.status <> 'confirmed' then
    return jsonb_build_object('error', 'cannot_cancel');
  end if;

  v_phone_digits := regexp_replace(v_booking.customer_phone, '\D', '', 'g');
  if right(v_phone_digits, 4) <> p_phone_last4 then
    return jsonb_build_object('error', 'phone_mismatch');
  end if;

  if v_booking.starts_at <= now() + interval '4 hours' then
    return jsonb_build_object('error', 'cancellation_window_closed');
  end if;

  update public.bookings
     set status = 'cancelled',
         cancelled_at = now()
   where id = v_booking.id;

  insert into public.booking_events (booking_id, event_type, payload)
  values (
    v_booking.id,
    'booking_cancelled',
    jsonb_build_object(
      'cancelled_at', now(),
      'reference_code', v_booking.reference_code
    )
  );

  return jsonb_build_object('ok', true, 'reference_code', v_booking.reference_code);
end;
$$;

grant execute on function public.get_available_slots(uuid, uuid, date, uuid) to anon, authenticated;
grant execute on function public.get_available_days(uuid, uuid, uuid, date, date) to anon, authenticated;
grant execute on function public.create_booking(jsonb) to anon, authenticated;
grant execute on function public.get_booking_by_ref(text) to anon, authenticated;
grant execute on function public.cancel_booking(text, text) to anon, authenticated;
