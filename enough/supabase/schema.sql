-- Enough v2 — compatible-quorum social planning
-- Public-link product with private raw response data.
-- Browsers/Next.js may use only the public anon key; all table access stays revoked.
-- Narrow SECURITY DEFINER RPCs validate capability hashes and return sanitized views.

create extension if not exists pgcrypto;
create schema if not exists enough_private;
revoke all on schema enough_private from public, anon, authenticated;

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

alter table public.enough_plans enable row level security;
alter table public.enough_responses enable row level security;
revoke all on public.enough_plans from public, anon, authenticated;
revoke all on public.enough_responses from public, anon, authenticated;
grant select, insert, update, delete on public.enough_plans to service_role;
grant select, insert, update, delete on public.enough_responses to service_role;

-- Internal helper: compute the strongest time/place intersection without exposing raw RSVPs.
create or replace function enough_private.compute_fit(p_plan_id uuid)
returns table(
  interested_count integer,
  best_fit_count integer,
  best_time_id text,
  best_place_id text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with plan_row as (
    select time_options, place_options
    from public.enough_plans
    where id = p_plan_id
  ),
  time_opts as (
    select t.item->>'id' as time_id, t.ord as time_ord
    from plan_row pr,
      jsonb_array_elements(pr.time_options) with ordinality as t(item, ord)
  ),
  place_opts as (
    select p.item->>'id' as place_id, p.ord as place_ord
    from plan_row pr,
      jsonb_array_elements(pr.place_options) with ordinality as p(item, ord)
    union all
    select '__any__'::text, 1::bigint
    from plan_row pr
    where jsonb_array_length(pr.place_options) = 0
  ),
  interested as (
    select count(*)::integer as count
    from public.enough_responses
    where plan_id = p_plan_id and response = 'yes'
  ),
  combos as (
    select
      t.time_id,
      p.place_id,
      t.time_ord,
      p.place_ord,
      count(r.id) filter (
        where r.response = 'yes'
          and t.time_id = any(r.time_option_ids)
          and (p.place_id = '__any__' or p.place_id = any(r.place_option_ids))
      )::integer as fit_count
    from time_opts t
    cross join place_opts p
    left join public.enough_responses r on r.plan_id = p_plan_id
    group by t.time_id, p.place_id, t.time_ord, p.place_ord
  ),
  best as (
    select fit_count, time_id, place_id
    from combos
    order by fit_count desc, time_ord asc, place_ord asc
    limit 1
  )
  select
    interested.count,
    coalesce(best.fit_count, 0),
    best.time_id,
    nullif(best.place_id, '__any__')
  from interested
  left join best on true;
$$;

-- Internal helper: build the only JSON shape the application is allowed to disclose.
create or replace function enough_private.build_view(p_plan_id uuid, p_viewer_hash text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, enough_private, pg_temp
as $$
declare
  p public.enough_plans%rowtype;
  viewer public.enough_responses%rowtype;
  f record;
  has_viewer boolean := false;
  viewer_confirmed boolean := false;
  guest_list jsonb := null;
  winning_time_id text := null;
  winning_place_id text := null;
  display_start text := null;
  display_location text := '';
begin
  select * into p from public.enough_plans where id = p_plan_id;
  if not found then return null; end if;

  select * into f from enough_private.compute_fit(p.id);

  if p.status = 'confirmed' then
    winning_time_id := p.winning_time_id;
    winning_place_id := p.winning_place_id;
  end if;

  if winning_time_id is not null then
    select item->>'startsAt' into display_start
    from jsonb_array_elements(p.time_options) item
    where item->>'id' = winning_time_id
    limit 1;
  end if;
  display_start := coalesce(display_start, p.time_options->0->>'startsAt', p.starts_at::text, '');

  if winning_place_id is not null then
    select item->>'label' into display_location
    from jsonb_array_elements(p.place_options) item
    where item->>'id' = winning_place_id
    limit 1;
  end if;
  display_location := coalesce(display_location, p.place_options->0->>'label', p.location, '');

  if p_viewer_hash is not null and char_length(p_viewer_hash) = 64 then
    select * into viewer
    from public.enough_responses
    where plan_id = p.id and participant_key_hash = p_viewer_hash
    limit 1;
    has_viewer := found;
  end if;

  if p.status = 'confirmed' then
    if has_viewer then
      viewer_confirmed := viewer.response = 'yes'
        and winning_time_id = any(viewer.time_option_ids)
        and (winning_place_id is null or winning_place_id = any(viewer.place_option_ids));
    end if;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'name', r.display_name,
          'isHost', r.is_host,
          'dayOfStatus', r.day_of_status
        ) order by r.created_at
      ),
      '[]'::jsonb
    ) into guest_list
    from public.enough_responses r
    where r.plan_id = p.id
      and r.response = 'yes'
      and winning_time_id = any(r.time_option_ids)
      and (winning_place_id is null or winning_place_id = any(r.place_option_ids));
  end if;

  return jsonb_build_object(
    'slug', p.slug,
    'title', p.title,
    'emoji', p.emoji,
    'description', p.description,
    'startsAt', display_start,
    'location', display_location,
    'deadlineAt', p.deadline_at,
    'durationMinutes', p.duration_minutes,
    'threshold', p.threshold,
    'status', p.status,
    'yesCount', coalesce(f.best_fit_count, 0),
    'bestFitCount', coalesce(f.best_fit_count, 0),
    'interestedCount', coalesce(f.interested_count, 0),
    'remaining', greatest(0, p.threshold - coalesce(f.best_fit_count, 0)),
    'hostName', p.host_name,
    'hostPledged', case when p.status = 'confirmed' then p.host_pledged else null end,
    'hostTask', p.host_task,
    'hostTaskDone', p.host_task_done,
    'timeOptions', p.time_options,
    'placeOptions', p.place_options,
    'winningTimeId', winning_time_id,
    'winningPlaceId', winning_place_id,
    'guestList', guest_list,
    'viewerResponse', case when has_viewer then viewer.response else null end,
    'viewerFit', case when has_viewer then jsonb_build_object(
      'timeOptionIds', to_jsonb(viewer.time_option_ids),
      'placeOptionIds', to_jsonb(viewer.place_option_ids)
    ) else null end,
    'viewerDayOfStatus', case when has_viewer then viewer.day_of_status else null end,
    'viewerIsConfirmedGuest', viewer_confirmed,
    'createdAt', p.created_at,
    'confirmedAt', p.confirmed_at
  );
end;
$$;

revoke all on function enough_private.compute_fit(uuid) from public, anon, authenticated;
revoke all on function enough_private.build_view(uuid,text) from public, anon, authenticated;

-- Remove legacy public quorum signature if it exists.
drop function if exists public.enough_respond(uuid,text,text,text,text);

create or replace function public.enough_create_plan(
  p_slug text,
  p_title text,
  p_emoji text,
  p_description text,
  p_time_options jsonb,
  p_place_options jsonb,
  p_starts_at timestamptz,
  p_location text,
  p_deadline_at timestamptz,
  p_duration_minutes integer,
  p_threshold integer,
  p_host_name text,
  p_host_secret_hash text,
  p_host_email text,
  p_host_pledged boolean,
  p_host_task text
) returns jsonb
language plpgsql
security definer
set search_path = public, enough_private, pg_temp
as $$
declare
  plan_row public.enough_plans%rowtype;
  time_ids text[] := '{}';
  place_ids text[] := '{}';
begin
  if p_deadline_at <= now() then
    return jsonb_build_object('error', 'INVALID_DEADLINE');
  end if;
  if jsonb_array_length(coalesce(p_time_options, '[]'::jsonb)) < 1 then
    return jsonb_build_object('error', 'INVALID_TIME_OPTIONS');
  end if;

  insert into public.enough_plans(
    slug, title, emoji, description, time_options, place_options,
    starts_at, location, deadline_at, duration_minutes, threshold,
    status, host_name, host_secret_hash, host_pledged, host_task, host_task_done
  ) values (
    p_slug, p_title, p_emoji, p_description,
    coalesce(p_time_options, '[]'::jsonb), coalesce(p_place_options, '[]'::jsonb),
    p_starts_at, coalesce(p_location, ''), p_deadline_at, p_duration_minutes, p_threshold,
    'open', p_host_name, p_host_secret_hash, p_host_pledged, coalesce(p_host_task, ''), false
  ) returning * into plan_row;

  if p_host_pledged then
    select coalesce(array_agg(item->>'id' order by ord), '{}'::text[]) into time_ids
    from jsonb_array_elements(plan_row.time_options) with ordinality as t(item, ord);
    select coalesce(array_agg(item->>'id' order by ord), '{}'::text[]) into place_ids
    from jsonb_array_elements(plan_row.place_options) with ordinality as p(item, ord);

    insert into public.enough_responses(
      plan_id, participant_key_hash, display_name, email, response,
      is_host, time_option_ids, place_option_ids
    ) values (
      plan_row.id, p_host_secret_hash, p_host_name, nullif(p_host_email, ''), 'yes',
      true, time_ids, place_ids
    );
  end if;

  return jsonb_build_object(
    'slug', plan_row.slug,
    'view', enough_private.build_view(plan_row.id, p_host_secret_hash)
  );
exception
  when unique_violation then
    return jsonb_build_object('error', 'SLUG_COLLISION');
end;
$$;

create or replace function public.enough_get_plan(p_slug text, p_participant_key_hash text default null)
returns jsonb
language plpgsql
security definer
set search_path = public, enough_private, pg_temp
as $$
declare
  plan_row public.enough_plans%rowtype;
begin
  select * into plan_row from public.enough_plans where slug = p_slug for update;
  if not found then return jsonb_build_object('error', 'NOT_FOUND'); end if;

  if plan_row.status = 'open' and plan_row.deadline_at <= now() then
    update public.enough_plans set status = 'expired' where id = plan_row.id;
  end if;

  return jsonb_build_object('view', enough_private.build_view(plan_row.id, p_participant_key_hash));
end;
$$;

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
set search_path = public, enough_private, pg_temp
as $$
declare
  current_plan public.enough_plans%rowtype;
  fit record;
  did_confirm boolean := false;
begin
  if p_response not in ('yes','no') or char_length(p_participant_key_hash) <> 64 then
    return jsonb_build_object('error', 'INVALID_RESPONSE');
  end if;

  select * into current_plan
  from public.enough_plans
  where id = p_plan_id
  for update;

  if not found then return jsonb_build_object('error', 'NOT_FOUND'); end if;
  if current_plan.status <> 'open' or current_plan.deadline_at <= now() then
    if current_plan.status = 'open' and current_plan.deadline_at <= now() then
      update public.enough_plans set status = 'expired' where id = current_plan.id;
    end if;
    return jsonb_build_object('error', 'CLOSED');
  end if;

  insert into public.enough_responses(
    plan_id, participant_key_hash, display_name, email, response,
    is_host, time_option_ids, place_option_ids
  ) values (
    p_plan_id, p_participant_key_hash, p_display_name, nullif(p_email,''), p_response,
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

  select * into fit from enough_private.compute_fit(p_plan_id);

  if coalesce(fit.best_fit_count, 0) >= current_plan.threshold then
    update public.enough_plans
    set status = 'confirmed',
        confirmed_at = coalesce(confirmed_at, now()),
        winning_time_id = fit.best_time_id,
        winning_place_id = fit.best_place_id
    where id = p_plan_id and status = 'open';
    did_confirm := found;
  end if;

  return jsonb_build_object(
    'just_confirmed', did_confirm,
    'view', enough_private.build_view(p_plan_id, p_participant_key_hash)
  );
end;
$$;

create or replace function public.enough_host_action(
  p_slug text,
  p_host_secret_hash text,
  p_action text
) returns jsonb
language plpgsql
security definer
set search_path = public, enough_private, pg_temp
as $$
declare
  plan_row public.enough_plans%rowtype;
begin
  select * into plan_row from public.enough_plans where slug = p_slug for update;
  if not found then return jsonb_build_object('error', 'NOT_FOUND'); end if;
  if p_host_secret_hash is null or p_host_secret_hash <> plan_row.host_secret_hash then
    return jsonb_build_object('error', 'FORBIDDEN');
  end if;

  if p_action = 'cancel' then
    update public.enough_plans set status = 'cancelled' where id = plan_row.id;
  elsif p_action = 'complete_task' then
    if plan_row.status <> 'confirmed' then return jsonb_build_object('error', 'INVALID_STATE'); end if;
    update public.enough_plans set host_task_done = true where id = plan_row.id;
  else
    return jsonb_build_object('error', 'INVALID_ACTION');
  end if;

  return jsonb_build_object('view', enough_private.build_view(plan_row.id, p_host_secret_hash));
end;
$$;

create or replace function public.enough_update_pulse(
  p_slug text,
  p_participant_key_hash text,
  p_status text
) returns jsonb
language plpgsql
security definer
set search_path = public, enough_private, pg_temp
as $$
declare
  plan_row public.enough_plans%rowtype;
  response_row public.enough_responses%rowtype;
  is_compatible boolean := false;
begin
  if p_status not in ('on_my_way','on_time','10_late','20_late','cant_make_it') then
    return jsonb_build_object('error', 'INVALID_STATUS');
  end if;

  select * into plan_row from public.enough_plans where slug = p_slug;
  if not found then return jsonb_build_object('error', 'NOT_FOUND'); end if;
  if plan_row.status <> 'confirmed' then return jsonb_build_object('error', 'INVALID_STATE'); end if;

  select * into response_row
  from public.enough_responses
  where plan_id = plan_row.id and participant_key_hash = p_participant_key_hash
  limit 1;
  if not found then return jsonb_build_object('error', 'FORBIDDEN'); end if;

  is_compatible := response_row.response = 'yes'
    and plan_row.winning_time_id = any(response_row.time_option_ids)
    and (plan_row.winning_place_id is null or plan_row.winning_place_id = any(response_row.place_option_ids));
  if not is_compatible then return jsonb_build_object('error', 'FORBIDDEN'); end if;

  update public.enough_responses
  set day_of_status = p_status, updated_at = now()
  where id = response_row.id;

  return jsonb_build_object('view', enough_private.build_view(plan_row.id, p_participant_key_hash));
end;
$$;

-- These RPCs are the intentionally public application API. Tables remain unreachable.
revoke all on function public.enough_create_plan(text,text,text,text,jsonb,jsonb,timestamptz,text,timestamptz,integer,integer,text,text,text,boolean,text) from public;
revoke all on function public.enough_get_plan(text,text) from public;
revoke all on function public.enough_respond(uuid,text,text,text,text,text[],text[]) from public;
revoke all on function public.enough_host_action(text,text,text) from public;
revoke all on function public.enough_update_pulse(text,text,text) from public;

grant execute on function public.enough_create_plan(text,text,text,text,jsonb,jsonb,timestamptz,text,timestamptz,integer,integer,text,text,text,boolean,text) to anon, authenticated, service_role;
grant execute on function public.enough_get_plan(text,text) to anon, authenticated, service_role;
grant execute on function public.enough_respond(uuid,text,text,text,text,text[],text[]) to anon, authenticated, service_role;
grant execute on function public.enough_host_action(text,text,text) to anon, authenticated, service_role;
grant execute on function public.enough_update_pulse(text,text,text) to anon, authenticated, service_role;
