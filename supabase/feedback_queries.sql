-- Run privately in Supabase's SQL editor. Never expose these queries to visitors.
-- Counts represent submissions, not unique people. Change the window as needed.
select count(*) as responses, round(avg(usefulness), 2) as average_usefulness,
       count(*) filter (where usefulness >= 4) as useful_or_very_useful
from public.pilot_feedback
where created_at >= now() - interval '7 days';

select topic, count(*) as requests
from public.pilot_feedback cross join lateral unnest(priorities) as topic
where created_at >= now() - interval '7 days'
group by topic order by requests desc;

select created_at, usefulness, project_code, review, requested_additions, priorities
from public.pilot_feedback
order by created_at desc limit 200;
