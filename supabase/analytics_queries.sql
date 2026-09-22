-- Run these read-only queries in the Supabase SQL Editor.

-- Daily traffic and conversion signals.
select *
from public.analytics_daily_summary
order by day desc;

-- Which actions people actually take.
select *
from public.analytics_event_summary
order by total_events desc;

-- Which public projects earn attention and deeper research activity.
select *
from public.analytics_project_summary
order by project_views desc, source_opens desc;

-- Where readers reach in the page.
select *
from public.analytics_section_summary
order by section_views desc;

-- Which source documents are opened most often.
select
  project_code,
  properties ->> 'source_id' as source_id,
  properties ->> 'source_publisher' as publisher,
  count(*) as opens,
  count(distinct session_id) as sessions
from public.analytics_events
where event_name = 'source_opened'
group by project_code, properties ->> 'source_id', properties ->> 'source_publisher'
order by opens desc;

-- Instagram campaign traffic. Use the tagged bio link documented in README.
select
  utm_campaign,
  utm_content,
  count(distinct session_id) as sessions,
  count(*) filter (where event_name = 'source_opened') as source_opens,
  count(*) filter (where event_name = 'share_record') as shares
from public.analytics_events
where utm_source = 'instagram'
group by utm_campaign, utm_content
order by sessions desc;

-- Optional manual retention cleanup. Review before running.
-- delete from public.analytics_events
-- where occurred_at < now() - interval '180 days';
