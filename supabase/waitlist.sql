-- ============================================================
-- OWLRY waitlist · Supabase setup (cap: 2000)
-- seat_number persisted · invite_code auto-generated into invitation_codes
-- ============================================================

alter table public.waitlist_signups
  add column if not exists meta jsonb not null default '{}'::jsonb;

alter table public.waitlist_signups
  add column if not exists seat_number bigint;

update public.waitlist_signups set email = lower(trim(email)) where email <> lower(trim(email));

create unique index if not exists waitlist_signups_email_uidx
  on public.waitlist_signups (email);

create unique index if not exists waitlist_signups_seat_number_uidx
  on public.waitlist_signups (seat_number);

create unique index if not exists invitation_codes_code_uidx
  on public.invitation_codes (code);

create or replace function public.owlry_new_waitlist_invite_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_tries int := 0;
begin
  loop
    v_tries := v_tries + 1;
    v_code := 'OWL' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.invitation_codes where code = v_code)
          and not exists (select 1 from public.waitlist_signups where invite_code = v_code);
    if v_tries > 20 then
      raise exception 'could not allocate invite code';
    end if;
  end loop;
  return v_code;
end;
$$;

revoke all on function public.owlry_new_waitlist_invite_code() from public;

create or replace function public.waitlist_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*)::bigint from public.waitlist_signups where source = 'waitlist';
$$;

revoke all on function public.waitlist_count() from public;
grant execute on function public.waitlist_count() to anon, authenticated;

create or replace function public.join_waitlist(
  p_email text,
  p_meta jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_seat bigint;
  v_code text;
  v_already boolean := false;
  v_count bigint;
  v_cap constant bigint := 2000;
begin
  p_email := lower(trim(p_email));
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;

  select id, seat_number, invite_code
    into v_id, v_seat, v_code
  from public.waitlist_signups
  where email = p_email;

  if v_id is not null then
    v_already := true;
  else
    select count(*) into v_count from public.waitlist_signups where source = 'waitlist';
    if v_count >= v_cap then
      return jsonb_build_object(
        'ok', false,
        'full', true,
        'cap', v_cap,
        'position', null,
        'seat_number', null,
        'invite_code', null,
        'already', false
      );
    end if;

    select coalesce(max(seat_number), 0) + 1 into v_seat
    from public.waitlist_signups
    where source = 'waitlist';

    v_code := public.owlry_new_waitlist_invite_code();

    insert into public.invitation_codes (code, max_uses, uses_count, active, note, code_type)
    values (
      v_code,
      1,
      0,
      true,
      'waitlist seat ' || v_seat || ' · ' || p_email,
      'personal_free'
    );

    insert into public.waitlist_signups (email, source, tier, meta, seat_number, invite_code)
    values (p_email, 'waitlist', 'free', coalesce(p_meta, '{}'::jsonb), v_seat, v_code)
    returning id into v_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'full', false,
    'cap', v_cap,
    'position', v_seat,
    'seat_number', v_seat,
    'invite_code', v_code,
    'already', v_already
  );
end;
$$;

revoke all on function public.join_waitlist(text, jsonb) from public;
grant execute on function public.join_waitlist(text, jsonb) to anon, authenticated;
