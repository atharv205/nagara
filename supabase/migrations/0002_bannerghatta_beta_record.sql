-- Nagara Beta v1 — additive upgrade for the connected Supabase project.
-- Preserves the existing public civic-record tables and adds the structured
-- Road Memory / project-record layers used by the Bannerghatta Road beta.

alter table public.sources
  add column if not exists source_code text,
  add column if not exists display_class text,
  add column if not exists display_date text,
  add column if not exists has_photos boolean not null default false;

create unique index if not exists sources_source_code_key
  on public.sources (source_code)
  where source_code is not null;

create table if not exists public.contractors (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null unique,
  aliases text[] not null default '{}',
  registration_number text,
  official_url text,
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contractors_legal_name_length check (char_length(legal_name) between 2 and 220),
  constraint contractors_official_url_format check (official_url is null or official_url ~ '^https?://')
);

create table if not exists public.road_memory_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  event_date date,
  date_label text not null,
  title text not null,
  detail text not null,
  verification_level text not null,
  display_zone text not null,
  sort_order smallint not null,
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint road_memory_event_date_label_length check (char_length(date_label) between 3 and 80),
  constraint road_memory_event_title_length check (char_length(title) between 5 and 220),
  constraint road_memory_event_detail_length check (char_length(detail) between 20 and 5000),
  constraint road_memory_event_verification check (verification_level in ('supported', 'reported', 'citizen', 'missing')),
  constraint road_memory_event_zone check (display_zone in ('PAST', 'NOW', 'NEXT')),
  unique (project_id, sort_order)
);

create table if not exists public.road_memory_event_sources (
  event_id uuid not null references public.road_memory_events(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  source_locator text,
  primary key (event_id, source_id)
);

create table if not exists public.project_record_fields (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  group_name text not null,
  field_key text not null,
  field_label text not null,
  display_value text not null,
  verification_level text not null,
  detail text not null,
  sort_order smallint not null,
  review_status public.review_state not null default 'draft',
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_record_group_length check (char_length(group_name) between 3 and 120),
  constraint project_record_key_format check (field_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint project_record_label_length check (char_length(field_label) between 3 and 180),
  constraint project_record_value_length check (char_length(display_value) between 1 and 3000),
  constraint project_record_detail_length check (char_length(detail) between 10 and 5000),
  constraint project_record_verification check (verification_level in ('supported', 'reported', 'citizen', 'missing')),
  unique (project_id, field_key),
  unique (project_id, sort_order)
);

create table if not exists public.project_record_field_sources (
  field_id uuid not null references public.project_record_fields(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  source_locator text,
  primary key (field_id, source_id)
);

create table if not exists public.procurement_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  relationship text not null default 'primary_project',
  tender_id text,
  tender_reference text,
  work_order text,
  title text not null,
  procuring_authority text,
  contractor_id uuid references public.contractors(id) on delete set null,
  estimated_value numeric(16,2),
  awarded_value numeric(16,2),
  currency char(3) not null default 'INR',
  published_on date,
  source_id uuid references public.sources(id) on delete set null,
  record_status text not null default 'reported',
  notes text,
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint procurement_relationship check (relationship in ('primary_project', 'related_separate_work')),
  constraint procurement_record_status check (record_status in ('verified', 'reported', 'not_published', 'superseded')),
  constraint procurement_nonnegative_values check (
    (estimated_value is null or estimated_value >= 0) and
    (awarded_value is null or awarded_value >= 0)
  )
);

create unique index if not exists procurement_tender_id_key
  on public.procurement_records (tender_id)
  where tender_id is not null;

create table if not exists public.project_deadlines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  deadline_date date,
  date_label text not null,
  deadline_kind text not null,
  deadline_status text not null default 'unknown',
  reason_for_change text,
  source_id uuid references public.sources(id) on delete set null,
  verification_level text not null,
  sort_order smallint not null,
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_deadline_kind check (deadline_kind in ('original_contractual', 'revised_contractual', 'public_direction', 'estimated', 'not_published')),
  constraint project_deadline_status check (deadline_status in ('active', 'met', 'missed', 'superseded', 'unknown')),
  constraint project_deadline_verification check (verification_level in ('supported', 'reported', 'citizen', 'missing')),
  unique (project_id, sort_order)
);

create table if not exists public.financial_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  record_type text not null,
  amount numeric(16,2),
  currency char(3) not null default 'INR',
  as_of_date date,
  source_id uuid references public.sources(id) on delete set null,
  verification_level text not null,
  notes text,
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_record_type check (record_type in ('sanctioned_amount', 'estimated_value', 'contract_value', 'payment', 'expenditure', 'not_published')),
  constraint financial_amount_nonnegative check (amount is null or amount >= 0),
  constraint financial_verification check (verification_level in ('supported', 'reported', 'citizen', 'missing'))
);

create table if not exists public.road_cutting_permissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  road_segment_id uuid not null references public.road_segments(id) on delete cascade,
  permission_number text,
  issuing_authority text,
  permitted_agency_id uuid references public.agencies(id) on delete set null,
  valid_from date,
  valid_until date,
  purpose text,
  source_id uuid references public.sources(id) on delete set null,
  record_status text not null default 'not_published',
  notes text,
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint road_cutting_record_status check (record_status in ('verified', 'reported', 'not_published', 'superseded'))
);

create table if not exists public.future_works (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  road_segment_id uuid not null references public.road_segments(id) on delete cascade,
  title text not null,
  description text not null,
  agency_id uuid references public.agencies(id) on delete set null,
  contractor_id uuid references public.contractors(id) on delete set null,
  tender_id text,
  work_order text,
  expected_start_on date,
  expected_end_on date,
  confidence text not null,
  source_id uuid references public.sources(id) on delete set null,
  verification_level text not null,
  notes text,
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint future_work_confidence check (confidence in ('confirmed', 'planned', 'proposed', 'not_found')),
  constraint future_work_verification check (verification_level in ('supported', 'reported', 'citizen', 'missing'))
);

create table if not exists public.record_revisions (
  id bigint generated always as identity primary key,
  entity_table text not null,
  entity_id uuid not null,
  field_name text not null,
  previous_value jsonb,
  new_value jsonb,
  change_reason text,
  source_id uuid references public.sources(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists road_memory_events_project_order_idx
  on public.road_memory_events (project_id, sort_order);
create index if not exists project_record_fields_project_order_idx
  on public.project_record_fields (project_id, sort_order);
create index if not exists procurement_records_project_idx
  on public.procurement_records (project_id);
create index if not exists project_deadlines_project_order_idx
  on public.project_deadlines (project_id, sort_order);
create index if not exists financial_records_project_idx
  on public.financial_records (project_id, record_type);
create index if not exists road_cutting_permissions_segment_idx
  on public.road_cutting_permissions (road_segment_id, valid_from);
create index if not exists future_works_segment_start_idx
  on public.future_works (road_segment_id, expected_start_on);
create index if not exists record_revisions_entity_idx
  on public.record_revisions (entity_table, entity_id, changed_at desc);

alter table public.contractors enable row level security;
alter table public.road_memory_events enable row level security;
alter table public.road_memory_event_sources enable row level security;
alter table public.project_record_fields enable row level security;
alter table public.project_record_field_sources enable row level security;
alter table public.procurement_records enable row level security;
alter table public.project_deadlines enable row level security;
alter table public.financial_records enable row level security;
alter table public.road_cutting_permissions enable row level security;
alter table public.future_works enable row level security;
alter table public.record_revisions enable row level security;

create policy "Published contractors are public"
  on public.contractors for select to anon, authenticated
  using (review_status = 'published');

create policy "Published road memory events are public"
  on public.road_memory_events for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (
      select 1 from public.projects p
      where p.id = road_memory_events.project_id
        and p.review_status = 'published'
    )
  );

create policy "Sources for published road memory events are public"
  on public.road_memory_event_sources for select to anon, authenticated
  using (
    exists (
      select 1 from public.road_memory_events e
      join public.projects p on p.id = e.project_id
      join public.sources s on s.id = road_memory_event_sources.source_id
      where e.id = road_memory_event_sources.event_id
        and e.review_status = 'published'
        and p.review_status = 'published'
        and s.review_status = 'published'
    )
  );

create policy "Published project record fields are public"
  on public.project_record_fields for select to anon, authenticated
  using (
    review_status = 'published'
    and exists (
      select 1 from public.projects p
      where p.id = project_record_fields.project_id
        and p.review_status = 'published'
    )
  );

create policy "Sources for published project record fields are public"
  on public.project_record_field_sources for select to anon, authenticated
  using (
    exists (
      select 1 from public.project_record_fields f
      join public.projects p on p.id = f.project_id
      join public.sources s on s.id = project_record_field_sources.source_id
      where f.id = project_record_field_sources.field_id
        and f.review_status = 'published'
        and p.review_status = 'published'
        and s.review_status = 'published'
    )
  );

create policy "Published procurement records are public"
  on public.procurement_records for select to anon, authenticated
  using (review_status = 'published');
create policy "Published project deadlines are public"
  on public.project_deadlines for select to anon, authenticated
  using (review_status = 'published');
create policy "Published financial records are public"
  on public.financial_records for select to anon, authenticated
  using (review_status = 'published');
create policy "Published road cutting permissions are public"
  on public.road_cutting_permissions for select to anon, authenticated
  using (review_status = 'published');
create policy "Published future works are public"
  on public.future_works for select to anon, authenticated
  using (review_status = 'published');

grant select on public.contractors to anon, authenticated;
grant select on public.road_memory_events to anon, authenticated;
grant select on public.road_memory_event_sources to anon, authenticated;
grant select on public.project_record_fields to anon, authenticated;
grant select on public.project_record_field_sources to anon, authenticated;
grant select on public.procurement_records to anon, authenticated;
grant select on public.project_deadlines to anon, authenticated;
grant select on public.financial_records to anon, authenticated;
grant select on public.road_cutting_permissions to anon, authenticated;
grant select on public.future_works to anon, authenticated;

-- Revision history is intentionally not exposed through the Data API yet.
revoke all on public.record_revisions from anon, authenticated;

create or replace function public.get_nagara_public_record(p_project_code text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'project', jsonb_build_object(
      'code', p.project_code,
      'title', p.title,
      'status', p.status,
      'lastOfficialUpdate', p.latest_official_update_on
    ),
    'sources', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.source_code,
          'title', s.title,
          'publisher', s.publisher,
          'date', coalesce(s.display_date, to_char(s.published_on, 'DD Mon YYYY')),
          'url', s.canonical_url,
          'sourceClass', s.display_class,
          'note', s.source_note,
          'hasPhotos', s.has_photos
        ) order by ps.source_id
      )
      from public.project_sources ps
      join public.sources s on s.id = ps.source_id
      where ps.project_id = p.id
        and s.review_status = 'published'
        and s.source_code is not null
    ), '[]'::jsonb),
    'timeline', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', e.date_label,
          'title', e.title,
          'body', e.detail,
          'evidence', e.verification_level,
          'zone', e.display_zone,
          'sources', coalesce((
            select jsonb_agg(s.source_code order by s.source_code)
            from public.road_memory_event_sources es
            join public.sources s on s.id = es.source_id
            where es.event_id = e.id
              and s.review_status = 'published'
          ), '[]'::jsonb)
        ) order by e.sort_order
      )
      from public.road_memory_events e
      where e.project_id = p.id
        and e.review_status = 'published'
    ), '[]'::jsonb),
    'fields', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'group', f.group_name,
          'field', f.field_label,
          'value', f.display_value,
          'status', f.verification_level,
          'detail', f.detail,
          'sourceIds', coalesce((
            select jsonb_agg(s.source_code order by s.source_code)
            from public.project_record_field_sources fs
            join public.sources s on s.id = fs.source_id
            where fs.field_id = f.id
              and s.review_status = 'published'
          ), '[]'::jsonb)
        ) order by f.sort_order
      )
      from public.project_record_fields f
      where f.project_id = p.id
        and f.review_status = 'published'
    ), '[]'::jsonb)
  )
  from public.projects p
  where p.project_code = p_project_code
    and p.review_status = 'published'
  limit 1;
$$;

revoke all on function public.get_nagara_public_record(text) from public;
grant execute on function public.get_nagara_public_record(text) to anon, authenticated;

notify pgrst, 'reload schema';
