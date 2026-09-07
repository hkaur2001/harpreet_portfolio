-- Enough v2 — compatible-quorum social planning
-- One plan only confirms when enough people overlap on the SAME time/place combination.
-- Apply to the Supabase project used by the production app.

create extension if not exists pgcrypto;

create table if not exists public.enough_plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 8 and 24),
  title text not null check (char_length(title) between 3 and 90),
  emoji text not null default '✨' check (char_length(emoji) <= 8),
  description text not null default '' check (char_length(description) <= 400),
  time_options jsonb not null default '[]'::jsonb,
  place_options jsonb not null default '[]'::jsonb,
  starts_at timestamptz,
  location text not null default '',
  deadline_at timestamptz not null,
  duration_minutes integer not null default 120 check (duration_minutes between 30 and 480),
  threshold integer not null check (threshold between 2 and 30),
  status text not null default 'open' check (status in ('open','confirmed','expired','cancelled')),
  host_name text not null check (char_length(host_name) between 1 and 60),
  host_secret_hash text not null check (char_length(host_secret_hash) = 64),
  host_pledged boolean not null default true,
  host_task text not null default '' check (char_length(host_task) <= 120),
  host_task_done boolean not null default false,
  winning_time_id text,
  winning_place_id text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Safe upgrade path if the first Enough schema was already applied.
alter table public.enough_plans add column if not exists time_options jsonb not null default '[]'::jsonb;
alter table public.enough_plans add column if not exists place_options jsonb not null default '[]'::jsonb;
alter table public.enough_plans add column if not exists duration_minutes integer not null default 120;
alter table public.enough_plans add column if not exists host_task text not null default '';
alter table public.enough_plans add column if not exists host_task_done boolean not null default false;
alter table public.enough_plans add column if not exists winning_time_id text;
alter table public.enough_plans add column if not exists winning_place_id text;

create table if not exists public.enough_responses (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.enough_plans(id) on delete cascade,
  participant_key_hash text not null check (char_length(participant_key_hash) = 64),
  display_name text not null check (char_length(display_name) between 1 and 60),
  email text,
  response text not null check (response in ('yes','no')),
  is_host boolean not null default false,
  time_option_ids text[] not null default '{}',
  place_option_ids text[] not null default '{}',
  day_of_status text check (day_of_status is null or day_of_status in ('on_my_way','on_time','10_late','20_late','cant_make_it')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(plan_id, participant_key_hash)
);

alter table public.enough_responses add column if not exists time_option_ids text[] not null default '{}';
alter table public.enough_responses add column if not exists place_option_ids text[] not null default '{}';
alter table public.enough_responses add column if not exists day_of_status text;

create index if not exists enough_plans_status_deadline_idx on public.enough_plans(status, deadline_at);
create index if not exists enough_responses_plan_response_idx on public.enough_responses(plan_id, response);
create index if not exists enough_responses_plan_participant_idx on public.enough_responses(plan_id, participant_key_hash);

-- Browser clients never receive raw response rows. The Next.js server owns disclosure.
alter table public.enough_plans enable row level security;
alter table public.enough_responses enable row level security;
revoke all on public.enough_plans from anon, authenticated;
revoke all on public.enough_responses from anon, authenticated;

-- Remove the v1 signature if present.
drop function if exists public.enough_respond(uuid,text,text,text,text);

create or replace function public.enough_respond(
  p_plan_id uuid,
  p_participant_key_hash text,
  p_display_name text,
  p_email text,
  p_response text,
  p_time_option_ids text[],
  p_place_option_ids text[]
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan public.enough_plans%rowtype;
  best_count integer := 0;
  interested_count integer := 0;
  best_time_id text;
  best_place_id text;
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
    raise exception 'commitments closed';
  end if;

  insert into public.enough_responses(
    plan_id,
    participant_key_hash,
    display_name,
    email,
    response,
    is_host,
    time_option_ids,
    place_option_ids
  ) values (
    p_plan_id,
    p_participant_key_hash,
    p_display_name,
    nullif(p_email,''),
    p_response,
    false,
    case when p_response = 'yes' then coalesce(p_time_option_ids, '{}') else '{}' end,
    case when p_response = 'yes' then coalesce(p_place_option_ids, '{}') else '{}' end
  )
  on conflict (plan_id, participant_key_hash)
  do update set
    display_name = excluded.display_name,
    email = excluded.email,
    response = excluded.response,
    time_option_ids = excluded.time_option_ids,
    place_option_ids = excluded.place_option_ids,
    updated_at = now();

  select count(*) into interested_count
  from public.enough_responses
  where plan_id = p_plan_id and response = 'yes';

  with time_opts as (
    select t.item->>'id' as time_id, t.ord
    from jsonb_array_elements(current_plan.time_options) with ordinality as t(item, ord)
  ),
  place_opts as (
    select p.item->>'id' as place_id, p.ord
    from jsonb_array_elements(current_plan.place_options) with ordinality as p(item, ord)
    union all
    select '__any__'::text as place_id, 1::bigint as ord
    where jsonb_array_length(current_plan.place_options) = 0
  ),
  combos as (
    select
      t.time_id,
      p.place_id,
      t.ord as time_ord,
      p.ord as place_ord,
      count(r.id) filter (
        where r.response = 'yes'
          and t.time_id = any(r.time_option_ids)
          and (p.place_id = '__any__' or p.place_id = any(r.place_option_ids))
      )::integer as fit_count
    from time_opts t
    cross join place_opts p
    left join public.enough_responses r on r.plan_id = p_plan_id
    group by t.time_id, p.place_id, t.ord, p.ord
  )
  select fit_count, time_id, nullif(place_id, '__any__')
  into best_count, best_time_id, best_place_id
  from combos
  order by fit_count desc, time_ord asc, place_ord asc
  limit 1;

  best_count := coalesce(best_count, 0);

  if best_count >= current_plan.threshold then
    update public.enough_plans
    set
      status = 'confirmed',
      confirmed_at = coalesce(confirmed_at, now()),
      winning_time_id = best_time_id,
      winning_place_id = best_place_id
    where id = p_plan_id and status = 'open';
    did_confirm := found;
  end if;

  return jsonb_build_object(
    'interested_count', interested_count,
    'best_fit_count', best_count,
    'threshold', current_plan.threshold,
    'winning_time_id', best_time_id,
    'winning_place_id', best_place_id,
    'just_confirmed', did_confirm
  );
end;
$$;

revoke all on function public.enough_respond(uuid,text,text,text,text,text[],text[]) from public, anon, authenticated;
grant execute on function public.enough_respond(uuid,text,text,text,text,text[],text[]) to service_role;
