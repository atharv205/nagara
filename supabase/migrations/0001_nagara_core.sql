-- Nagara v1 — evidence-led project records for Supabase/Postgres
-- Run in the Supabase SQL editor or as a migration.  This schema deliberately
-- separates claims, source documents and verification from public display fields.

create extension if not exists pgcrypto;

create type public.nagara_source_class as enum (
  'primary_document',
  'official_communication',
  'institutional_submission',
  'journalism',
  'citizen_evidence',
  'dataset_coverage'
);

create type public.nagara_verification_status as enum (
  'verified_primary',
  'verified_institutional',
  'supported_secondary',
  'citizen_reported',
  'not_published',
  'superseded',
  'disputed'
);

create type public.nagara_project_status as enum (
  'proposed', 'planned', 'tendered', 'ongoing', 'delayed', 'restoration_pending', 'completed', 'unknown'
);

create type public.nagara_event_type as enum (
  'work_started', 'inspection', 'deadline_announced', 'deadline_revised',
  'work_paused', 'work_resumed', 'road_cutting', 'restoration_started',
  'restoration_completed', 'official_update', 'citizen_observation', 'other'
);

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  acronym text,
  agency_type text,
  official_url text,
  created_at timestamptz not null default now()
);

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null unique,
  aliases text[] not null default '{}',
  registration_number text,
  official_url text,
  created_at timestamptz not null default now()
);

create table public.road_segments (
  id uuid primary key default gen_random_uuid(),
  road_segment_id text not null unique,
  road_name text not null,
  from_landmark text,
  to_landmark text,
  locality text,
  authority_road_id text,
  geometry jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  project_id text not null unique,
  title text not null,
  description text,
  project_type text,
  status public.nagara_project_status not null default 'unknown',
  agency_id uuid references public.agencies(id),
  contractor_id uuid references public.contractors(id),
  tender_id text,
  work_order text,
  start_date date,
  original_deadline date,
  restoration_date date,
  sanctioned_amount numeric(16,2),
  contract_value numeric(16,2),
  expenditure_reported numeric(16,2),
  approving_authority text,
  public_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_road_segments (
  project_id uuid not null references public.projects(id) on delete cascade,
  road_segment_id uuid not null references public.road_segments(id) on delete restrict,
  relationship text not null default 'primary',
  primary key (project_id, road_segment_id)
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  source_id text not null unique,
  title text not null,
  publisher text not null,
  published_on date,
  source_url text not null,
  archived_url text,
  source_class public.nagara_source_class not null,
  excerpt text,
  checksum text,
  submitted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.project_claims (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  claim_key text not null,
  claim_value jsonb not null,
  display_value text not null,
  verification_status public.nagara_verification_status not null default 'citizen_reported',
  valid_from date,
  valid_to date,
  supersedes_claim_id uuid references public.project_claims(id),
  is_current boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  unique (project_id, claim_key, created_at)
);

create table public.claim_sources (
  claim_id uuid not null references public.project_claims(id) on delete cascade,
  source_document_id uuid not null references public.source_documents(id) on delete cascade,
  source_locator text,
  primary key (claim_id, source_document_id)
);

create table public.verification_records (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.project_claims(id) on delete cascade,
  verification_status public.nagara_verification_status not null,
  verified_by uuid references auth.users(id),
  method text not null,
  rationale text,
  verified_at timestamptz not null default now()
);

create table public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type public.nagara_event_type not null,
  event_date date,
  title text not null,
  description text,
  verification_status public.nagara_verification_status not null default 'citizen_reported',
  created_at timestamptz not null default now()
);

create table public.project_event_sources (
  project_event_id uuid not null references public.project_events(id) on delete cascade,
  source_document_id uuid not null references public.source_documents(id) on delete cascade,
  primary key (project_event_id, source_document_id)
);

create table public.project_deadlines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  deadline_date date not null,
  deadline_kind text not null check (deadline_kind in ('original_contractual', 'revised_contractual', 'public_direction', 'estimated')),
  status text not null default 'active' check (status in ('active', 'met', 'missed', 'superseded', 'unknown')),
  reason_for_change text,
  source_document_id uuid references public.source_documents(id),
  created_at timestamptz not null default now()
);

create table public.future_works (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  road_segment_id uuid not null references public.road_segments(id) on delete cascade,
  future_work text not null,
  agency_id uuid references public.agencies(id),
  contractor_id uuid references public.contractors(id),
  tender_id text,
  work_order text,
  expected_start_date date,
  expected_end_date date,
  road_cutting_permission text,
  confidence text not null check (confidence in ('confirmed', 'planned', 'proposed', 'not_found')),
  verification_status public.nagara_verification_status not null default 'not_published',
  source_document_id uuid references public.source_documents(id),
  notes text,
  created_at timestamptz not null default now()
);

create table public.citizen_evidence (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  road_segment_id uuid references public.road_segments(id) on delete set null,
  observed_at timestamptz,
  observation text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  media_url text,
  consent_to_publish boolean not null default false,
  moderation_status text not null default 'pending' check (moderation_status in ('pending', 'published', 'rejected')),
  submitted_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.field_availability (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  field_name text not null,
  availability public.nagara_verification_status not null default 'not_published',
  explanation text not null,
  last_checked_at timestamptz not null default now(),
  source_document_id uuid references public.source_documents(id),
  unique (project_id, field_name)
);

create index projects_agency_idx on public.projects(agency_id);
create index projects_contractor_idx on public.projects(contractor_id);
create index project_claims_project_current_idx on public.project_claims(project_id, is_current);
create index project_events_project_date_idx on public.project_events(project_id, event_date desc);
create index project_deadlines_project_date_idx on public.project_deadlines(project_id, deadline_date);
create index future_works_segment_idx on public.future_works(road_segment_id, expected_start_date);
create index source_documents_class_idx on public.source_documents(source_class);

-- RLS-ready public read model.  Anonymous users can inspect published records;
-- direct public writes are forbidden. Create server/admin workflows or an
-- authenticated review queue before allowing submissions.
alter table public.agencies enable row level security;
alter table public.contractors enable row level security;
alter table public.road_segments enable row level security;
alter table public.projects enable row level security;
alter table public.project_road_segments enable row level security;
alter table public.source_documents enable row level security;
alter table public.project_claims enable row level security;
alter table public.claim_sources enable row level security;
alter table public.verification_records enable row level security;
alter table public.project_events enable row level security;
alter table public.project_event_sources enable row level security;
alter table public.project_deadlines enable row level security;
alter table public.future_works enable row level security;
alter table public.citizen_evidence enable row level security;
alter table public.field_availability enable row level security;

create policy "public can read agencies" on public.agencies for select using (true);
create policy "public can read contractors" on public.contractors for select using (true);
create policy "public can read road segments" on public.road_segments for select using (true);
create policy "public can read projects" on public.projects for select using (true);
create policy "public can read project road segments" on public.project_road_segments for select using (true);
create policy "public can read source documents" on public.source_documents for select using (true);
create policy "public can read project claims" on public.project_claims for select using (true);
create policy "public can read claim sources" on public.claim_sources for select using (true);
create policy "public can read verification records" on public.verification_records for select using (true);
create policy "public can read project events" on public.project_events for select using (true);
create policy "public can read project event sources" on public.project_event_sources for select using (true);
create policy "public can read project deadlines" on public.project_deadlines for select using (true);
create policy "public can read future works" on public.future_works for select using (true);
create policy "public can read published citizen evidence" on public.citizen_evidence for select using (moderation_status = 'published');
create policy "public can read field availability" on public.field_availability for select using (true);

-- Add privileged write policies only after creating a reviewer/admin role.
-- Use the Supabase service role in a server route for source ingestion; never
-- expose that key in browser code.
