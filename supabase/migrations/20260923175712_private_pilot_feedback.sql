-- Private pilot research. Deliberately separate from public project evidence
-- and from anonymous interaction analytics. No public read/update/delete path.
create table public.pilot_feedback (
  submission_id uuid primary key,
  created_at timestamptz not null default now(),
  site_version text not null default 'beta_1',
  usefulness smallint not null check (usefulness between 1 and 5),
  review text not null default '' check (char_length(review) <= 2000),
  requested_additions text not null default '' check (char_length(requested_additions) <= 2000),
  priorities text[] not null default '{}' check (
    cardinality(priorities) <= 3
    and array_position(priorities, null) is null
    and priorities <@ array['deadlines','budgets','contractors','future_works','more_roads','usability']::text[]
  ),
  project_code text references public.projects(project_code) on delete set null,
  consent_version text not null check (consent_version = 'feedback_v1'),
  website text not null default '' check (website = ''),
  constraint feedback_has_written_answer check (
    greatest(char_length(btrim(review)), char_length(btrim(requested_additions))) >= 5
  )
);

comment on table public.pilot_feedback is
  'Private voluntary pilot reviews and feature requests. Unverified user feedback; never project evidence. Public clients may only insert bounded fields. No names, emails, IPs or analytics session IDs requested.';

create index pilot_feedback_created_at_idx on public.pilot_feedback (created_at desc);
create index pilot_feedback_project_code_idx on public.pilot_feedback (project_code) where project_code is not null;

alter table public.pilot_feedback enable row level security;
revoke all on table public.pilot_feedback from public, anon, authenticated;
grant insert (submission_id, usefulness, review, requested_additions, priorities, project_code, consent_version, website)
  on public.pilot_feedback to anon, authenticated;
grant all on table public.pilot_feedback to service_role;

create policy "Visitors can send private pilot feedback"
  on public.pilot_feedback for insert to anon, authenticated
  with check (
    project_code is null or exists (
      select 1 from public.projects p
      where p.project_code = pilot_feedback.project_code and p.review_status = 'published'
    )
  );

-- No SELECT, UPDATE or DELETE policies. Read responses through the private
-- Supabase Dashboard/SQL editor with an authorized administrative account.
