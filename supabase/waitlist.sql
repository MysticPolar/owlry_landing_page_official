-- ============================================================
-- OWLRY waitlist · cap 2000 · seat_number · invite_code · referrals
-- Share URL: https://owlry.ai/?ref={invite_code}
-- Referrer moves up 1 seat per successful referral (max 20).
-- ============================================================

alter table public.waitlist_signups
  add column if not exists meta jsonb not null default '{}'::jsonb;

alter table public.waitlist_signups
  add column if not exists seat_number bigint;

alter table public.waitlist_signups
  add column if not exists referred_by_signup_id uuid references public.waitlist_signups(id) on delete set null;

alter table public.waitlist_signups
  add column if not exists referral_count integer not null default 0;

update public.waitlist_signups set email = lower(trim(email)) where email <> lower(trim(email));

create unique index if not exists waitlist_signups_email_uidx
  on public.waitlist_signups (email);

create unique index if not exists waitlist_signups_seat_number_uidx
  on public.waitlist_signups (seat_number);

create unique index if not exists invitation_codes_code_uidx
  on public.invitation_codes (code);

create table if not exists public.waitlist_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.waitlist_signups(id) on delete cascade,
  referee_id uuid not null references public.waitlist_signups(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint waitlist_referrals_referee_uidx unique (referee_id),
  constraint waitlist_referrals_no_self check (referrer_id <> referee_id)
);

create index if not exists waitlist_referrals_referrer_idx on public.waitlist_referrals (referrer_id);

alter table public.waitlist_referrals enable row level security;

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

create or replace function public.owlry_boost_seat_by_one(p_signup_id uuid)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seat bigint;
  v_above_id uuid;
  v_above_seat bigint;
begin
  select seat_number into v_seat
  from public.waitlist_signups
  where id = p_signup_id
  for update;

  if v_seat is null or v_seat <= 1 then
    return coalesce(v_seat, 1);
  end if;

  v_above_seat := v_seat - 1;

  select id into v_above_id
  from public.waitlist_signups
  where source = 'waitlist' and seat_number = v_above_seat
  for update;

  if v_above_id is null then
    update public.waitlist_signups set seat_number = v_above_seat where id = p_signup_id;
    return v_above_seat;
  end if;

  update public.waitlist_signups set seat_number = -1 * v_seat where id = p_signup_id;
  update public.waitlist_signups set seat_number = v_seat where id = v_above_id;
  update public.waitlist_signups set seat_number = v_above_seat where id = p_signup_id;

  return v_above_seat;
end;
$$;

revoke all on function public.owlry_boost_seat_by_one(uuid) from public;

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
  p_meta jsonb default '{}'::jsonb,
  p_referral_code text default null
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
  v_ref_code text;
  v_referrer_id uuid;
  v_referrer_email text;
  v_referrer_count int;
  v_referrer_seat bigint;
  v_boosted boolean := false;
  v_max_boosts constant int := 20;
  v_share_url text;
  v_own_referral_count int := 0;
begin
  p_email := lower(trim(p_email));
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;

  v_ref_code := nullif(upper(trim(coalesce(p_referral_code, ''))), '');

  select id, seat_number, invite_code, referral_count
    into v_id, v_seat, v_code, v_own_referral_count
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
        'share_url', null,
        'referral_count', 0,
        'already', false,
        'referrer_boosted', false
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

    if v_ref_code is not null then
      select id, email, referral_count
        into v_referrer_id, v_referrer_email, v_referrer_count
      from public.waitlist_signups
      where invite_code = v_ref_code and source = 'waitlist';

      if v_referrer_id is not null and v_referrer_email = p_email then
        v_referrer_id := null;
        v_referrer_email := null;
      end if;
    end if;

    insert into public.waitlist_signups (
      email, source, tier, meta, seat_number, invite_code, referred_by_signup_id, referral_count
    )
    values (
      p_email, 'waitlist', 'free', coalesce(p_meta, '{}'::jsonb), v_seat, v_code, v_referrer_id, 0
    )
    returning id into v_id;

    if v_referrer_id is not null then
      select referral_count into v_referrer_count
      from public.waitlist_signups where id = v_referrer_id for update;

      if coalesce(v_referrer_count, 0) < v_max_boosts then
        begin
          insert into public.waitlist_referrals (referrer_id, referee_id)
          values (v_referrer_id, v_id);

          update public.waitlist_signups
          set referral_count = referral_count + 1
          where id = v_referrer_id;

          v_referrer_seat := public.owlry_boost_seat_by_one(v_referrer_id);
          v_boosted := true;

          select referral_count, email into v_referrer_count, v_referrer_email
          from public.waitlist_signups where id = v_referrer_id;
        exception when unique_violation then
          v_boosted := false;
        end;
      end if;
    end if;
  end if;

  select seat_number, invite_code, referral_count
    into v_seat, v_code, v_own_referral_count
  from public.waitlist_signups where id = v_id;

  v_share_url := 'https://owlry.ai/?ref=' || v_code;

  return jsonb_build_object(
    'ok', true,
    'full', false,
    'cap', v_cap,
    'position', v_seat,
    'seat_number', v_seat,
    'invite_code', v_code,
    'share_url', v_share_url,
    'referral_count', coalesce(v_own_referral_count, 0),
    'already', v_already,
    'referrer_boosted', v_boosted,
    'referrer_email', case when v_boosted then v_referrer_email else null end,
    'referrer_new_seat', case when v_boosted then v_referrer_seat else null end
  );
end;
$$;

revoke all on function public.join_waitlist(text, jsonb, text) from public;
grant execute on function public.join_waitlist(text, jsonb, text) to anon, authenticated;
