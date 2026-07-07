-- ============================================================
-- OWLRY waitlist · Supabase setup
-- Paste this whole file into the Supabase SQL editor and run it.
-- Security model: RLS on, no direct table access from the client;
-- everything goes through the two functions below (anon-executable).
-- ============================================================

create table if not exists public.waitlist (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
-- (no policies on purpose: the anon role cannot read or write the table directly)

-- join: inserts (or finds) the email, returns {position, already}
create or replace function public.join_waitlist(p_email text, p_meta jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_id bigint;
  v_pos bigint;
  v_already boolean := false;
begin
  p_email := lower(trim(p_email));
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email';
  end if;

  insert into public.waitlist (email, meta)
  values (p_email, p_meta)
  on conflict (email) do nothing
  returning id into v_id;

  if v_id is null then
    v_already := true;
    select id into v_id from public.waitlist where email = p_email;
  end if;

  select count(*) into v_pos from public.waitlist where id <= v_id;
  return jsonb_build_object('position', v_pos, 'already', v_already);
end
$$;

revoke all on function public.join_waitlist(text, jsonb) from public;
grant execute on function public.join_waitlist(text, jsonb) to anon, authenticated;

-- count: powers "join N readers on the perch"
create or replace function public.waitlist_count()
returns bigint
language sql security definer set search_path = public
as $$ select count(*) from public.waitlist $$;

revoke all on function public.waitlist_count() from public;
grant execute on function public.waitlist_count() to anon, authenticated;
