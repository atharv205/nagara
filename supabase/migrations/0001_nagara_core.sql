-- Nagara production baseline.
-- Public records are readable only after editorial review; browser clients
-- receive SELECT access but no direct write access.

create extension if not exists pgcrypto;

create type public.review_state as enum (
  'draft', 'pending_review', 'published', 'disputed', 'archived'
);
create type public.project_status as enum (
  'planned', 'active', 'delayed', 'paused', 'partial_restoration',
  'restoration', 'completed', 'unknown'
);
create type public.restoration_status as enum (
  'not_started', 'temporary', 'partial', 'permanent', 'verified', 'unknown'
);
create type public.agency_role as enum (
  'lead', 'utility_executor', 'road_authority', 'project_partner',
  'funder', 'contractor', 'traffic_management'
);
create type public.source_kind as enum (
  'official_update', 'tender_or_contract', 'news_report',
  'field_verification', 'resident_submission', 'other'
);
create type public.update_kind as enum (
  'commencement', 'deadline', 'deadline_revision', 'delay', 'dependency',
  'restoration', 'inspection', 'closure', 'other'
);
create type public.dependency_status as enum ('active', 'cleared', 'unclear');
create type public.report_category as enum (
  'pothole', 'excavation', 'drainage', 'footpath', 'signage',
  'lane_marking', 'obstruction', 'unsafe_access', 'other'
);
create type public.report_state as enum ('pending', 'published', 'rejected', 'archived');
create type public.asset_state as enum ('pending_review', 'redacted', 'published', 'removed');

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique check (char_length(name) between 2 and 180),
  acronym text unique check (acronym is null or char_length(acronym) between 2 and 20),
  agency_type text not null default 'public_authority'
    check (agency_type in ('public_authority','utility_agency','metro_or_transit','contractor','other')),
  website_url text check (website_url is null or website_url ~ '^https?://'),
  description text check (description is null or char_length(description) <= 1000),
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.road_segments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 3 and 180),
  locality text,
  city text not null default 'Bengaluru',
  corridor_description text check (corridor_description is null or char_length(corridor_description) <= 2000),
  route_geojson jsonb check (
    route_geojson is null or (
      jsonb_typeof(route_geojson) = 'object' and route_geojson ? 'type'
      and route_geojson ->> 'type' in ('LineString','MultiLineString')
    )
  ),
  centre_latitude numeric,
  centre_longitude numeric,
  road_owner_agency_id uuid references public.agencies(id) on delete set null,
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null unique check (project_code ~ '^[A-Z0-9][A-Z0-9-]{2,31}$'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 5 and 180),
  work_type text not null check (char_length(work_type) between 3 and 100),
  work_description text not null check (char_length(work_description) between 30 and 5000),
  status public.project_status not null default 'unknown',
  work_started_on date,
  original_completion_on date,
  current_expected_completion_on date,
  restoration_status public.restoration_status not null default 'unknown',
  timeline_note text check (timeline_note is null or char_length(timeline_note) <= 2000),
  latest_official_update_on date,
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_segments (
  project_id uuid not null references public.projects(id) on delete cascade,
  road_segment_id uuid not null references public.road_segments(id) on delete cascade,
  impact_note text check (impact_note is null or char_length(impact_note) <= 1000),
  primary key (project_id, road_segment_id)
);

create table public.project_agencies (
  project_id uuid not null references public.projects(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  role public.agency_role not null,
  responsibility_note text check (responsibility_note is null or char_length(responsibility_note) <= 1500),
  started_on date,
  ended_on date,
  primary key (project_id, agency_id, role)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  source_kind public.source_kind not null,
  publisher text not null check (char_length(publisher) between 2 and 180),
  title text not null check (char_length(title) between 5 and 500),
  canonical_url text not null unique check (canonical_url ~ '^https?://'),
  published_on date,
  accessed_on date not null default current_date,
  source_note text check (source_note is null or char_length(source_note) <= 2000),
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_sources (
  project_id uuid not null references public.projects(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  claim_summary text not null check (char_length(claim_summary) between 20 and 1500),
  source_locator text check (source_locator is null or char_length(source_locator) <= 300),
  primary key (project_id, source_id)
);

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  kind public.update_kind not null,
  occurred_on date not null,
  title text not null check (char_length(title) between 5 and 220),
  detail text not null check (char_length(detail) between 20 and 5000),
  deadline_before date,
  deadline_after date,
  delay_reason text check (delay_reason is null or char_length(delay_reason) <= 2000),
  is_official boolean not null default false,
  review_status public.review_state not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_dependencies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  depends_on_project_id uuid references public.projects(id) on delete set null,
  depends_on_agency_id uuid references public.agencies(id) on delete set null,
  source_id uuid references public.sources(id) on delete set null,
  description text not null check (char_length(description) between 20 and 2000),
  status public.dependency_status not null default 'unclear',
  review_status public.review_state not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.resident_reports (
  id uuid primary key default gen_random_uuid(),
  road_segment_id uuid references public.road_segments(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  category public.report_category not null,
  description text not null check (char_length(btrim(description)) between 20 and 1500),
  severity smallint not null default 3 check (severity between 1 and 5),
  observed_at timestamptz not null default now(),
  latitude numeric,
  longitude numeric,
  moderation_state public.report_state not null default 'pending',
  moderation_note text check (moderation_note is null or char_length(moderation_note) <= 1000),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence_assets (
  id uuid primary key default gen_random_uuid(),
  project_update_id uuid references public.project_updates(id) on delete set null,
  resident_report_id uuid references public.resident_reports(id) on delete set null,
  bucket_id text not null check (bucket_id in ('nagara-pending-evidence','nagara-public-evidence')),
  object_path text not null check (char_length(object_path) between 3 and 1024),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
  alt_text text check (alt_text is null or char_length(alt_text) <= 300),
  asset_status public.asset_state not null default 'pending_review',
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index road_segments_review_status_idx on public.road_segments(review_status);
create index project_segments_road_segment_idx on public.project_segments(road_segment_id);
create index project_agencies_agency_idx on public.project_agencies(agency_id);
create index project_updates_project_date_idx on public.project_updates(project_id, occurred_on desc);
create index resident_reports_moderation_idx on public.resident_reports(moderation_state, observed_at desc);
create index resident_reports_project_idx on public.resident_reports(project_id);
create index evidence_assets_public_idx on public.evidence_assets(asset_status);

alter table public.agencies enable row level security;
alter table public.road_segments enable row level security;
alter table public.projects enable row level security;
alter table public.project_segments enable row level security;
alter table public.project_agencies enable row level security;
alter table public.sources enable row level security;
alter table public.project_sources enable row level security;
alter table public.project_updates enable row level security;
alter table public.project_dependencies enable row level security;
alter table public.resident_reports enable row level security;
alter table public.evidence_assets enable row level security;

create policy "Published agencies are public" on public.agencies
  for select to anon, authenticated using (review_status = 'published');
create policy "Published road segments are public" on public.road_segments
  for select to anon, authenticated using (review_status = 'published');
create policy "Published projects are public" on public.projects
  for select to anon, authenticated using (review_status = 'published');
create policy "Segments for published projects are public" on public.project_segments
  for select to anon, authenticated using (
    exists (select 1 from public.projects p where p.id = project_id and p.review_status = 'published')
    and exists (select 1 from public.road_segments r where r.id = road_segment_id and r.review_status = 'published')
  );
create policy "Agencies for published projects are public" on public.project_agencies
  for select to anon, authenticated using (
    exists (select 1 from public.projects p where p.id = project_id and p.review_status = 'published')
    and exists (select 1 from public.agencies a where a.id = agency_id and a.review_status = 'published')
  );
create policy "Published sources are public" on public.sources
  for select to anon, authenticated using (review_status = 'published');
create policy "Sources for published projects are public" on public.project_sources
  for select to anon, authenticated using (
    exists (select 1 from public.projects p where p.id = project_id and p.review_status = 'published')
    and exists (select 1 from public.sources s where s.id = source_id and s.review_status = 'published')
  );
create policy "Published updates are public" on public.project_updates
  for select to anon, authenticated using (review_status = 'published');
create policy "Published dependencies are public" on public.project_dependencies
  for select to anon, authenticated using (review_status = 'published');
create policy "Published resident reports are public" on public.resident_reports
  for select to anon, authenticated using (moderation_state = 'published');
create policy "Published evidence assets are public" on public.evidence_assets
  for select to anon, authenticated using (asset_status = 'published');

grant select on public.agencies, public.road_segments, public.projects,
  public.project_segments, public.project_agencies, public.sources,
  public.project_sources, public.project_updates, public.project_dependencies,
  public.resident_reports, public.evidence_assets to anon, authenticated;
