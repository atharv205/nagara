-- Privacy-conscious interaction analytics for Nagara Beta.
-- Events use an ephemeral per-tab session UUID. No names, email addresses,
-- exact location, raw IP address or persistent visitor identifier are stored.

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  session_id uuid not null,
  event_name text not null,
  project_code text,
  page_path text not null default '/',
  referrer_host text,
  device_class text not null,
  viewport_width smallint,
  site_version text not null default 'beta_1',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  properties jsonb not null default '{}'::jsonb,
  constraint analytics_events_event_name_check check (
    event_name in (
      'page_view',
      'project_view',
      'project_selected',
      'section_view',
      'navigation_click',
      'timeline_filter',
      'record_filter',
      'record_field_expanded',
      'source_filter',
      'source_opened',
      'share_record'
    )
  ),
  constraint analytics_events_project_code_check check (
    project_code is null or project_code ~ '^NAG-[A-Z0-9-]{3,40}$'
  ),
  constraint analytics_events_page_path_check check (
    page_path ~ '^/' and char_length(page_path) <= 255
  ),
  constraint analytics_events_referrer_host_check check (
    referrer_host is null or char_length(referrer_host) <= 255
  ),
  constraint analytics_events_device_class_check check (
    device_class in ('mobile', 'tablet', 'desktop')
  ),
  constraint analytics_events_viewport_width_check check (
    viewport_width is null or viewport_width between 240 and 32767
  ),
  constraint analytics_events_site_version_check check (
    char_length(site_version) between 1 and 40
  ),
  constraint analytics_events_utm_source_check check (
    utm_source is null or char_length(utm_source) <= 120
  ),
  constraint analytics_events_utm_medium_check check (
    utm_medium is null or char_length(utm_medium) <= 120
  ),
  constraint analytics_events_utm_campaign_check check (
    utm_campaign is null or char_length(utm_campaign) <= 120
  ),
  constraint analytics_events_utm_content_check check (
    utm_content is null or char_length(utm_content) <= 120
  ),
  constraint analytics_events_properties_check check (
    jsonb_typeof(properties) = 'object'
    and octet_length(properties::text) <= 2048
  )
);

create index analytics_events_occurred_at_idx
  on public.analytics_events (occurred_at desc);
create index analytics_events_name_occurred_idx
  on public.analytics_events (event_name, occurred_at desc);
create index analytics_events_project_occurred_idx
  on public.analytics_events (project_code, occurred_at desc)
  where project_code is not null;
create index analytics_events_session_occurred_idx
  on public.analytics_events (session_id, occurred_at desc);

alter table public.analytics_events enable row level security;

revoke all on table public.analytics_events from public, anon, authenticated;
grant insert on table public.analytics_events to anon, authenticated;

create policy "Public clients may append bounded analytics events"
  on public.analytics_events
  for insert
  to anon, authenticated
  with check (
    occurred_at <= now() + interval '1 minute'
    and occurred_at >= now() - interval '1 day'
  );

-- These summaries are intentionally unavailable to public clients. They are
-- readable from the Supabase dashboard/SQL editor and by the service role.
create view public.analytics_daily_summary
with (security_invoker = true)
as
select
  date_trunc('day', occurred_at)::date as day,
  count(*) as total_events,
  count(distinct session_id) as sessions,
  count(*) filter (where event_name = 'page_view') as page_views,
  count(*) filter (where event_name = 'project_view') as project_views,
  count(*) filter (where event_name = 'source_opened') as source_opens,
  count(*) filter (where event_name = 'share_record') as shares
from public.analytics_events
group by 1;

create view public.analytics_event_summary
with (security_invoker = true)
as
select
  event_name,
  count(*) as total_events,
  count(distinct session_id) as sessions,
  max(occurred_at) as last_seen_at
from public.analytics_events
group by event_name;

create view public.analytics_project_summary
with (security_invoker = true)
as
select
  project_code,
  count(distinct session_id) as sessions,
  count(*) filter (where event_name = 'project_view') as project_views,
  count(*) filter (where event_name = 'project_selected') as project_selections,
  count(*) filter (where event_name = 'record_field_expanded') as field_expansions,
  count(*) filter (where event_name = 'source_opened') as source_opens,
  count(*) filter (where event_name = 'share_record') as shares
from public.analytics_events
where project_code is not null
group by project_code;

create view public.analytics_section_summary
with (security_invoker = true)
as
select
  properties ->> 'section_id' as section_id,
  count(*) as section_views,
  count(distinct session_id) as sessions
from public.analytics_events
where event_name = 'section_view'
  and properties ? 'section_id'
group by properties ->> 'section_id';

revoke all on table public.analytics_daily_summary from public, anon, authenticated;
revoke all on table public.analytics_event_summary from public, anon, authenticated;
revoke all on table public.analytics_project_summary from public, anon, authenticated;
revoke all on table public.analytics_section_summary from public, anon, authenticated;

grant select on table public.analytics_daily_summary to service_role;
grant select on table public.analytics_event_summary to service_role;
grant select on table public.analytics_project_summary to service_role;
grant select on table public.analytics_section_summary to service_role;

comment on table public.analytics_events is
  'Anonymous Nagara product interaction events. Session IDs expire with the browser tab; no persistent visitor ID is stored.';
