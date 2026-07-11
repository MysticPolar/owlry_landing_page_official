-- ============================================================
-- OWLRY waitlist · Supabase setup (cap: 2000)
-- Uses existing public.waitlist_signups + email_log.
-- Prefer applying via migration; this file is the readable source of truth.
-- ============================================================

alter table public.waitlist_signups
  add column if not exists meta jsonb not null default '{}'::jsonb;

update public.waitlist_signups set email = lower(trim(email)) where email <> lower(trim(email));

create unique index if not exists waitlist_signups_email_uidx
  on public.waitlist_signups (email);

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
  v_pos bigint;
  v_already boolean := false;
  v_count bigint;
  v_cap constant bigint := 2000;
begin
  p_email := lower(trim(p_email));
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;

  select id into v_id from public.waitlist_signups where email = p_email;
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
        'already', false
      );
    end if;

    insert into public.waitlist_signups (email, source, tier, meta)
    values (p_email, 'waitlist', 'free', coalesce(p_meta, '{}'::jsonb))
    returning id into v_id;
  end if;

  select count(*) into v_pos
  from public.waitlist_signups
  where source = 'waitlist'
    and created_at <= (select created_at from public.waitlist_signups where id = v_id);

  return jsonb_build_object(
    'ok', true,
    'full', false,
    'cap', v_cap,
    'position', v_pos,
    'already', v_already
  );
end;
$$;

revoke all on function public.join_waitlist(text, jsonb) from public;
grant execute on function public.join_waitlist(text, jsonb) to anon, authenticated;
