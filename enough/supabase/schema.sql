-- Enough — collaborative plan database
-- Apply this migration to the Supabase project used by the portfolio.

create extension if not exists pgcrypto;

create table if not exists public.enough_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 8 and 24),
  title text not null check (char_length(title) between 3 and 90),
  emoji text not null default '✨' check (char_length(emoji) <= 8),
  description text not null default '' check (char_length(description) <= 400),
  location text not null default '' check (char_length(location) <= 160),
  starts_at timestamptz not null,
  deadline_at timestamptz not null,
  threshold integer not null check (threshold between 2 and 30),
  status text not null default 'open' check (status in ('open','confirmed','expired','cancelled')),
  host_name text not null check (char_length(host_name) between 1 and 60),
  host_secret_hash text not null check (char_length(host_secret_hash) = 64),
  host_pledged boolean not null default true,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint enough_plan_timing check (deadline_at < starts_at)
);

create table if not exists public.enough_responses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.enough_plans(id) on delete cascade,
  participant_key_hash text not null check (char_length(participant_key_hash) = 64),
  display_name text not null check (char_length(display_name) between 1 and 60),
  email text,
  response text not null check (response in ('yes','no')),
  is_host boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id, participant_key_hash)
);

create index if not exists enough_plans_status_deadline_idx on public.enough_plans(status, deadline_at);
create index if not exists enough_responses_plan_response_idx on public.enough_responses(plan_id, response);

-- All application access goes through server routes using the service role.
-- Keeping these tables private avoids exposing pre-threshold participant identities through PostgREST.
alter table public.enough_plans enable row level security;
alter table public.enough_responses enable row level security;

revoke all on public.enough_plans from anon, authenticated;
revoke all on public.enough_responses from anon, authenticated;

create or replace function public.enough_respond(
  p_plan_id uuid,
  p_participant_key_hash text,
  p_display_name text,
  p_email text,
  p_response text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan public.enough_plans%rowtype;
  yes_count integer;
  did_confirm boolean := false;
begin
  if p_response not in ('yes','no') then
    raise exception 'invalid response';
  end if;

  select * into current_plan
  from public.enough_plans
  where id = p_plan_id
  for update;

  if not found then
    raise exception 'plan not found';
  end if;

  if current_plan.status <> 'open' or current_plan.deadline_at <= now() then
    raise exception 'rsvps closed';
  end if;

  insert into public.enough_responses(plan_id, participant_key_hash, display_name, email, response, is_host)
  values (p_plan_id, p_participant_key_hash, p_display_name, nullif(p_email,''), p_response, false)
  on conflict (plan_id, participant_key_hash)
  do update set
    display_name = excluded.display_name,
    email = excluded.email,
    response = excluded.response,
    updated_at = now();

  select count(*) into yes_count
  from public.enough_responses
  where plan_id = p_plan_id and response = 'yes';

  if yes_count >= current_plan.threshold then
    update public.enough_plans
    set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now())
    where id = p_plan_id and status = 'open';
    did_confirm := found;
  end if;

  return jsonb_build_object(
    'yes_count', yes_count,
    'threshold', current_plan.threshold,
    'just_confirmed', did_confirm
  );
end;
$$;

revoke all on function public.enough_respond(uuid,text,text,text,text) from public, anon, authenticated;
grant execute on function public.enough_respond(uuid,text,text,text,text) to service_role;
