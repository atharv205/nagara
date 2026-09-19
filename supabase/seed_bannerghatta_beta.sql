-- Idempotent public-data seed for Nagara Beta v1.
-- This does not invent missing government data. Missing fields are published
-- explicitly as "Not published / unavailable" with the reason recorded.

begin;

insert into public.agencies (
  slug, name, acronym, agency_type, review_status
)
values
  ('bwssb', 'Bangalore Water Supply and Sewerage Board', 'BWSSB', 'utility_agency', 'published'),
  ('bscc', 'Bengaluru South City Corporation', 'BSCC', 'public_authority', 'published'),
  ('bmrcl', 'Bangalore Metro Rail Corporation Limited', 'BMRCL', 'metro_or_transit', 'published')
on conflict (slug) do update set
  name = excluded.name,
  acronym = excluded.acronym,
  agency_type = excluded.agency_type,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.projects (
  project_code, slug, title, work_type, work_description, status,
  restoration_status, timeline_note, latest_official_update_on, review_status
)
values (
  'NAG-BAN-001',
  'bannerghatta-road-utility-works-restoration',
  'BWSSB sewer-pipeline work and road restoration — Bannerghatta Road',
  'Sewer pipeline excavation and associated road restoration',
  'Public record of authority excavation, restoration and re-excavation signals on Bannerghatta Main Road between Vega City Mall, IIMB/Fortis and Arekere Signal. The record keeps verified reporting separate from citizen evidence and from fields that public authorities have not published.',
  'partial_restoration',
  'partial',
  'The contractual start date and original completion deadline were not located. A public direction on 31 May 2026 is recorded separately from a contractual deadline.',
  date '2026-05-31',
  'published'
)
on conflict (project_code) do update set
  slug = excluded.slug,
  title = excluded.title,
  work_type = excluded.work_type,
  work_description = excluded.work_description,
  status = excluded.status,
  restoration_status = excluded.restoration_status,
  timeline_note = excluded.timeline_note,
  latest_official_update_on = excluded.latest_official_update_on,
  review_status = excluded.review_status,
  updated_at = now();

update public.projects
set title = 'BWSSB sewer-pipeline work and road restoration — Bannerghatta Road',
    work_type = 'Sewer pipeline excavation and associated road restoration',
    work_description = 'Public record of authority excavation, restoration and re-excavation signals on Bannerghatta Main Road between Vega City Mall, IIMB/Fortis and Arekere Signal. The record keeps verified reporting separate from citizen evidence and from fields that public authorities have not published.',
    status = 'partial_restoration',
    restoration_status = 'partial',
    timeline_note = 'The contractual start date and original completion deadline were not located. A public direction on 31 May 2026 is recorded separately from a contractual deadline.',
    latest_official_update_on = date '2026-05-31',
    review_status = 'published',
    updated_at = now()
where project_code = 'NAG-BAN-001';

insert into public.road_segments (
  slug, name, locality, corridor_description, road_owner_agency_id, review_status
)
values (
  'bannerghatta-road-vega-city-arekere',
  'Bannerghatta Road — Vega City Mall to Arekere Signal',
  'Bilekahalli, IIMB, Arekere',
  'Focused Nagara pilot segment covering Vega City Mall, IIMB/Fortis and Arekere Signal. No government road-segment identifier was located.',
  (select id from public.agencies where slug = 'bscc'),
  'published'
)
on conflict (slug) do update set
  name = excluded.name,
  locality = excluded.locality,
  corridor_description = excluded.corridor_description,
  road_owner_agency_id = excluded.road_owner_agency_id,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.project_segments (project_id, road_segment_id, impact_note)
select p.id, r.id,
  'Focused evidence corridor for the BWSSB sewer work and associated restoration record.'
from public.projects p
join public.road_segments r on r.slug = 'bannerghatta-road-vega-city-arekere'
where p.project_code = 'NAG-BAN-001'
on conflict (project_id, road_segment_id) do update
set impact_note = excluded.impact_note;

with source_data as (
  select * from jsonb_to_recordset($json$
  [
    {"source_code":"s1","source_kind":"news_report","publisher":"The South India Times","title":"BWSSB restores Bannerghatta Main Road surface; DPR preparation reported","canonical_url":"https://epaper.thesouthindiatimes.com/media/2026-04/hyd-tsit-23rd-apr-2026.pdf","published_on":"2026-04-23","display_date":"23 Apr 2026","display_class":"Institutional reporting","source_note":"Reports Commissioner K. N. Ramesh's statement: BWSSB sewage-pipeline work damaged the road; roughly 1 km from Kalyani Choultry to IIMB Metro station had been restored after an 8 Apr inspection.","has_photos":false},
    {"source_code":"s2","source_kind":"news_report","publisher":"Deccan Herald","title":"Civic agencies drag feet as Bannerghatta Road falls apart","canonical_url":"https://www.deccanherald.com/india/karnataka/bengaluru/civic-agencies-drag-feet-as-bannerghatta-road-falls-apart-3999322","published_on":"2026-05-11","display_date":"11 May 2026","display_class":"Investigative reporting","source_note":"Field report on the 2.5 km Arakere-Vega City stretch, describing a coordination problem between BWSSB and Bengaluru South City Corporation.","has_photos":true},
    {"source_code":"s3","source_kind":"news_report","publisher":"NammaWard","title":"Inspection direction: Vega City-Arekere sewer work and a proposed second phase","canonical_url":"https://nammaward.in/wardpulse/formulate-plan-to-prevent-waterlogging-on-bannerghatta-road-maheshwar-rao","published_on":"2026-05-31","display_date":"31 May 2026","display_class":"Institutional reporting","source_note":"Reports a direction for BWSSB to finish ongoing sewer-pipeline work between Vega City Mall and Arekere Signal within two days; asphalting was to follow, with a later phase to Hulimavu Metro Station.","has_photos":false},
    {"source_code":"s4","source_kind":"tender_or_contract","publisher":"Karnataka procurement listing (mirrored)","title":"Restoration of bad reaches and potholes: Dairy Circle to Vega City Mall","canonical_url":"https://tenders.infralens.in/tender/bscc-2026-27-rd-work-indent265-300782","published_on":"2026-05-26","display_date":"26 May 2026","display_class":"Procurement mirror","source_note":"Mirrors a Karnataka KPPP tender for a separate BSCC restoration work. Tender ID 2026_Bengalur_300782_1; reference BSCC/2026-27/RD/WORK_INDENT265; estimated value Rs 79.39 lakh. This is not evidence of the BWSSB sewer contract.","has_photos":false},
    {"source_code":"s5","source_kind":"news_report","publisher":"The Times of India","title":"Temporary fix, bigger upgrade awaited","canonical_url":"https://timesofindia.indiatimes.com/city/bengaluru/bengalurus-troubled-bannerghatta-road-gets-a-temporary-fix-bigger-upgrade-awaited/photostory/131631811.cms","published_on":"2026-06-10","display_date":"10 Jun 2026","display_class":"Investigative reporting","source_note":"Reports temporary pothole filling between Vega City Mall Junction and Arekere Junction, while noting that some BWSSB work remained pending.","has_photos":true},
    {"source_code":"s6","source_kind":"resident_submission","publisher":"r/bangalore community post","title":"Bannerghatta Road infrastructure in a nutshell","canonical_url":"https://www.reddit.com/r/bangalore/comments/1w26f5g/bannerghatta_road_infrastructure_in_a_nutshell/","published_on":"2026-08-30","display_date":"30 Aug 2026","display_class":"Citizen evidence","source_note":"A citizen post reported fresh digging near Fortis Hospital/IIMB. It corroborates the founder's on-ground observation, but it does not identify the excavating agency or authorise an attribution.","has_photos":true},
    {"source_code":"s7","source_kind":"other","publisher":"Bengaluru NavaNirmana Party","title":"B-RIGHT citizen portal: published dataset scope","canonical_url":"https://bright.nammabnp.org/","published_on":null,"display_date":"Accessed Sep 2026","display_class":"Dataset coverage","source_note":"B-RIGHT says it analysed 63,629 BBMP ward-level projects. A matching entry for this BWSSB sewer package was not located in the publicly browsable portal during this research.","has_photos":false},
    {"source_code":"s8","source_kind":"other","publisher":"Civic Data Commons","title":"BNP's B-RIGHT data lineage","canonical_url":"https://data.kaun.city/about/partners/","published_on":null,"display_date":"Accessed Sep 2026","display_class":"Dataset coverage","source_note":"Documents B-RIGHT as a BBMP-project dataset with contractor and payment traces, and identifies public-government data systems that feed the civic-data ecosystem.","has_photos":false}
  ]
  $json$::jsonb) as x(
    source_code text, source_kind text, publisher text, title text,
    canonical_url text, published_on date, display_date text,
    display_class text, source_note text, has_photos boolean
  )
)
insert into public.sources (
  source_code, source_kind, publisher, title, canonical_url, published_on,
  accessed_on, display_date, display_class, source_note, has_photos, review_status
)
select source_code, source_kind::public.source_kind, publisher, title, canonical_url,
  published_on, date '2026-09-19', display_date, display_class, source_note,
  has_photos, 'published'::public.review_state
from source_data
on conflict (canonical_url) do update set
  source_code = excluded.source_code,
  source_kind = excluded.source_kind,
  publisher = excluded.publisher,
  title = excluded.title,
  published_on = excluded.published_on,
  accessed_on = excluded.accessed_on,
  display_date = excluded.display_date,
  display_class = excluded.display_class,
  source_note = excluded.source_note,
  has_photos = excluded.has_photos,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.project_sources (project_id, source_id, claim_summary, source_locator)
select p.id, s.id,
  case s.source_code
    when 's1' then 'Supports the April inspection and the reported one-kilometre restoration.'
    when 's2' then 'Documents conditions on the Arakere-Vega City stretch and the inter-agency coordination issue.'
    when 's3' then 'Supports the public completion direction and the proposed Arekere-Hulimavu phase.'
    when 's4' then 'Documents a related but separate BSCC road-restoration procurement record.'
    when 's5' then 'Documents temporary repair and pending utility work in June.'
    when 's6' then 'Citizen evidence of fresh excavation near Fortis and IIMB in August.'
    when 's7' then 'Records the public B-RIGHT dataset comparison and its stated scope.'
    else 'Records the published description of B-RIGHT data lineage and coverage.'
  end,
  case when s.source_code = 's1' then 'PDF page 7' else null end
from public.projects p
join public.sources s on s.source_code between 's1' and 's8'
where p.project_code = 'NAG-BAN-001'
on conflict (project_id, source_id) do update set
  claim_summary = excluded.claim_summary,
  source_locator = excluded.source_locator;

with event_data as (
  select * from jsonb_to_recordset($json$
  [
    {"sort_order":10,"event_date":"2026-04-08","date_label":"8 APR 2026","title":"First located official intervention","detail":"During an inspection, the Commissioner directed urgent repair after BWSSB and BMRCL works were reported to have damaged Bannerghatta Main Road. The actual sewer-work commencement date was not published in the records located.","verification_level":"supported","display_zone":"PAST","source_codes":["s1"]},
    {"sort_order":20,"event_date":"2026-04-23","date_label":"23 APR 2026","title":"1 km restoration reported","detail":"A Commissioner statement reported that BWSSB had laid sewage pipelines and restored approximately 1 km from Kalyani Choultry to IIMB Metro station. This establishes a restoration event, not completion of the full corridor package.","verification_level":"supported","display_zone":"PAST","source_codes":["s1"]},
    {"sort_order":30,"event_date":"2026-05-11","date_label":"11 MAY 2026","title":"Arakere-Vega City condition documented","detail":"A field report described the 2.5 km stretch between Arakere and Vega City Mall as severely degraded and identified coordination between BWSSB and BSCC as a central issue.","verification_level":"reported","display_zone":"PAST","source_codes":["s2"]},
    {"sort_order":40,"event_date":"2026-05-31","date_label":"31 MAY 2026","title":"Public completion direction issued","detail":"BWSSB was reportedly directed to finish ongoing sewer-pipeline work from Vega City Mall to Arekere Signal within two days. This is a public direction, not a located contractual completion date. A second phase to Hulimavu Metro Station was said to follow.","verification_level":"reported","display_zone":"PAST","source_codes":["s3"]},
    {"sort_order":50,"event_date":"2026-06-10","date_label":"10 JUN 2026","title":"Temporary repair, pending utility work","detail":"Separate BSCC pothole filling between Vega City Mall Junction and Arekere Junction was reported as temporary; the report noted pending BWSSB work. It is not treated here as completion of the sewer project.","verification_level":"reported","display_zone":"PAST","source_codes":["s5"]},
    {"sort_order":60,"event_date":"2026-08-30","date_label":"30 AUG 2026","title":"Fresh excavation observed near Fortis / IIMB","detail":"Nagara's founder observed fresh excavation on the relaid corridor. A public community post independently reported digging nearby. The responsible agency, purpose, permission and related tender remain unverified.","verification_level":"citizen","display_zone":"NOW","source_codes":["s6"]},
    {"sort_order":70,"event_date":null,"date_label":"NEXT 24 MONTHS","title":"A proposed road-memory watch","detail":"The May direction referred to a further sewer phase from Arekere Signal to Hulimavu Metro Station. No accessible tender, work order or road-cutting permission was located for that phase, so it cannot yet be labelled confirmed.","verification_level":"missing","display_zone":"NEXT","source_codes":["s3"]}
  ]
  $json$::jsonb) as x(
    sort_order smallint, event_date date, date_label text, title text, detail text,
    verification_level text, display_zone text, source_codes jsonb
  )
)
insert into public.road_memory_events (
  project_id, event_date, date_label, title, detail, verification_level,
  display_zone, sort_order, review_status
)
select p.id, e.event_date, e.date_label, e.title, e.detail, e.verification_level,
  e.display_zone, e.sort_order, 'published'
from event_data e
cross join public.projects p
where p.project_code = 'NAG-BAN-001'
on conflict (project_id, sort_order) do update set
  event_date = excluded.event_date,
  date_label = excluded.date_label,
  title = excluded.title,
  detail = excluded.detail,
  verification_level = excluded.verification_level,
  display_zone = excluded.display_zone,
  review_status = excluded.review_status,
  updated_at = now();

with event_source_data(sort_order, source_code) as (
  values (10,'s1'), (20,'s1'), (30,'s2'), (40,'s3'), (50,'s5'), (60,'s6'), (70,'s3')
)
insert into public.road_memory_event_sources (event_id, source_id)
select e.id, s.id
from event_source_data d
join public.projects p on p.project_code = 'NAG-BAN-001'
join public.road_memory_events e on e.project_id = p.id and e.sort_order = d.sort_order
join public.sources s on s.source_code = d.source_code
on conflict (event_id, source_id) do nothing;

with field_data as (
  select * from jsonb_to_recordset($json$
  [
    {"sort_order":10,"group_name":"Identity & ownership","field_key":"working_project_title","field_label":"Working project title","display_value":"BWSSB sewer-pipeline work - Vega City Mall to Arekere Signal","verification_level":"supported","detail":"Working research title, not a published tender title."},
    {"sort_order":20,"group_name":"Identity & ownership","field_key":"road_segment","field_label":"Road segment","display_value":"Bannerghatta Main Road; Vega City Mall to IIMB/Fortis to Arekere Signal","verification_level":"supported","detail":"The public material uses partly overlapping place references; this page does not claim a government road-segment ID."},
    {"sort_order":30,"group_name":"Identity & ownership","field_key":"executing_agency","field_label":"Executing agency","display_value":"Bengaluru Water Supply and Sewerage Board (BWSSB)","verification_level":"supported","detail":"Named as undertaking sewer and sewage-pipeline work in the located reporting."},
    {"sort_order":40,"group_name":"Identity & ownership","field_key":"road_restoration_authority","field_label":"Road restoration authority","display_value":"Bengaluru South City Corporation (BSCC) - related restoration actions","verification_level":"reported","detail":"The scope and handover between utility work and road restoration are not published as one unified project record."},
    {"sort_order":50,"group_name":"Identity & ownership","field_key":"approving_minister","field_label":"Approving minister / representative","display_value":"Not published / not assigned","verification_level":"missing","detail":"No approving minister or elected representative was documented for this sewer package. Nagara does not infer political ownership from geography."},
    {"sort_order":60,"group_name":"Procurement & money","field_key":"bwssb_tender_id","field_label":"BWSSB tender ID","display_value":"Not published / unavailable in records reviewed","verification_level":"missing","detail":"No matching BWSSB tender could be located through the accessible public record trail. The separate BSCC restoration tender must not be substituted for it."},
    {"sort_order":70,"group_name":"Procurement & money","field_key":"bwssb_work_order","field_label":"BWSSB work order","display_value":"Not published / unavailable in records reviewed","verification_level":"missing","detail":"A work order was not linked from the articles or accessible portals checked."},
    {"sort_order":80,"group_name":"Procurement & money","field_key":"executing_contractor","field_label":"Executing contractor","display_value":"Not published / unavailable","verification_level":"missing","detail":"No contractor is named in the located sources. Nagara will not attribute the August excavation to an agency or contractor without documentary evidence."},
    {"sort_order":90,"group_name":"Procurement & money","field_key":"sanctioned_contract_value","field_label":"Sanctioned / contract value","display_value":"Not published for the BWSSB sewer package","verification_level":"missing","detail":"Rs 79.39 lakh is the estimate for a separate BSCC road-restoration tender, not the value of the sewer work."},
    {"sort_order":100,"group_name":"Procurement & money","field_key":"related_restoration_tender","field_label":"Related restoration tender","display_value":"2026_Bengalur_300782_1 - Rs 79.39 lakh estimate","verification_level":"reported","detail":"BSCC reference BSCC/2026-27/RD/WORK_INDENT265; Dairy Circle to Vega City Mall. This is displayed only as a related, separate work."},
    {"sort_order":110,"group_name":"Procurement & money","field_key":"payments_expenditure","field_label":"Payments / expenditure","display_value":"Not published / unavailable for the BWSSB sewer package","verification_level":"missing","detail":"No project-specific payment, bill, expenditure or utilisation record was located."},
    {"sort_order":120,"group_name":"Schedule & delivery","field_key":"work_commencement","field_label":"Work commencement","display_value":"Not published; public trail confirms work was already ongoing by 8 Apr 2026","verification_level":"supported","detail":"The inspection record is the earliest located public trace, not proof of the actual start date."},
    {"sort_order":130,"group_name":"Schedule & delivery","field_key":"original_contractual_deadline","field_label":"Original contractual deadline","display_value":"Not published / unavailable","verification_level":"missing","detail":"No tender or work-order schedule was located. A direction made in May must not be relabelled as an original contract deadline."},
    {"sort_order":140,"group_name":"Schedule & delivery","field_key":"public_completion_direction","field_label":"Publicly stated completion direction","display_value":"Within two days of 31 May 2026 (about 2 Jun 2026) for Vega City to Arekere","verification_level":"reported","detail":"Reported direction during an inspection; the source does not publish a contractual baseline or proof of completion."},
    {"sort_order":150,"group_name":"Schedule & delivery","field_key":"delay_reason","field_label":"Delay reason","display_value":"No verified BWSSB explanation located","verification_level":"missing","detail":"Reporting describes coordination and pending work, but no attributed BWSSB explanation for a contractual delay was located."},
    {"sort_order":160,"group_name":"Schedule & delivery","field_key":"restoration_record","field_label":"Restoration record","display_value":"About 1 km Kalyani Choultry to IIMB Metro reported restored by 23 Apr 2026","verification_level":"supported","detail":"This does not establish permanent restoration of the full Vega City-Arekere corridor."},
    {"sort_order":170,"group_name":"Coordination & future works","field_key":"road_cutting_permission","field_label":"Road-cutting permission","display_value":"Not located / unavailable","verification_level":"missing","detail":"No matching permission document was found. The public GBA and BBMP interfaces were unavailable during this research, so this is not a claim that no permission exists."},
    {"sort_order":180,"group_name":"Coordination & future works","field_key":"future_work_signal","field_label":"Future work signal","display_value":"Arekere Signal to Hulimavu Metro Station sewer phase announced","verification_level":"reported","detail":"The source says the phase would commence after Vega City-Arekere work. No public procurement or permission record was located to confirm schedule, scope or contractor."},
    {"sort_order":190,"group_name":"Coordination & future works","field_key":"august_excavation_planning","field_label":"Was August excavation planned before resurfacing?","display_value":"Unknown","verification_level":"missing","detail":"This requires a matched tender, work order or road-cutting permission. Without one, Nagara shows the chronology but does not allege a coordination failure."},
    {"sort_order":200,"group_name":"Ground truth & dataset check","field_key":"citizen_evidence","field_label":"Citizen evidence","display_value":"Fresh excavation reported near Fortis / IIMB on 30 Aug 2026","verification_level":"citizen","detail":"Founder observation with an independent community-post corroboration. It confirms a reported on-ground condition, not agency ownership or work purpose."},
    {"sort_order":210,"group_name":"Ground truth & dataset check","field_key":"bright_comparison","field_label":"B-RIGHT comparison","display_value":"No matching BWSSB sewer package located in public B-RIGHT search","verification_level":"missing","detail":"B-RIGHT describes its corpus as BBMP ward-level projects. This tracked subject is BWSSB work; absence from a public search is not proof BNP has no related information internally."}
  ]
  $json$::jsonb) as x(
    sort_order smallint, group_name text, field_key text, field_label text,
    display_value text, verification_level text, detail text
  )
)
insert into public.project_record_fields (
  project_id, group_name, field_key, field_label, display_value,
  verification_level, detail, sort_order, review_status
)
select p.id, f.group_name, f.field_key, f.field_label, f.display_value,
  f.verification_level, f.detail, f.sort_order, 'published'
from field_data f
cross join public.projects p
where p.project_code = 'NAG-BAN-001'
on conflict (project_id, field_key) do update set
  group_name = excluded.group_name,
  field_label = excluded.field_label,
  display_value = excluded.display_value,
  verification_level = excluded.verification_level,
  detail = excluded.detail,
  sort_order = excluded.sort_order,
  review_status = excluded.review_status,
  last_checked_at = now(),
  updated_at = now();

with field_source_data(field_key, source_code) as (
  values
    ('working_project_title','s1'), ('working_project_title','s3'),
    ('road_segment','s2'), ('road_segment','s3'),
    ('executing_agency','s1'), ('executing_agency','s3'),
    ('road_restoration_authority','s2'), ('road_restoration_authority','s5'),
    ('related_restoration_tender','s4'),
    ('work_commencement','s1'),
    ('public_completion_direction','s3'),
    ('restoration_record','s1'),
    ('future_work_signal','s3'),
    ('citizen_evidence','s6'),
    ('bright_comparison','s7'), ('bright_comparison','s8')
)
insert into public.project_record_field_sources (field_id, source_id)
select f.id, s.id
from field_source_data d
join public.projects p on p.project_code = 'NAG-BAN-001'
join public.project_record_fields f on f.project_id = p.id and f.field_key = d.field_key
join public.sources s on s.source_code = d.source_code
on conflict (field_id, source_id) do nothing;

insert into public.procurement_records (
  project_id, relationship, tender_id, tender_reference, title,
  procuring_authority, estimated_value, published_on, source_id,
  record_status, notes, review_status
)
select p.id, 'related_separate_work', '2026_Bengalur_300782_1',
  'BSCC/2026-27/RD/WORK_INDENT265',
  'Restoration of bad reaches and potholes on Bannerghatta Main Road from Dairy Circle to Vega City Mall',
  'Bengaluru South City Corporation', 7939000, date '2026-05-26', s.id,
  'reported',
  'Related restoration work only. It is not the unidentified BWSSB sewer contract.',
  'published'
from public.projects p
join public.sources s on s.source_code = 's4'
where p.project_code = 'NAG-BAN-001'
on conflict (tender_id) where tender_id is not null do update set
  relationship = excluded.relationship,
  tender_reference = excluded.tender_reference,
  title = excluded.title,
  procuring_authority = excluded.procuring_authority,
  estimated_value = excluded.estimated_value,
  published_on = excluded.published_on,
  source_id = excluded.source_id,
  record_status = excluded.record_status,
  notes = excluded.notes,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.project_deadlines (
  project_id, deadline_date, date_label, deadline_kind, deadline_status,
  reason_for_change, source_id, verification_level, sort_order, review_status
)
select p.id, date '2026-06-02', 'Within two days of 31 May 2026',
  'public_direction', 'unknown',
  'Public direction reported during inspection; not a contractual deadline.',
  s.id, 'reported', 10, 'published'
from public.projects p
join public.sources s on s.source_code = 's3'
where p.project_code = 'NAG-BAN-001'
on conflict (project_id, sort_order) do update set
  deadline_date = excluded.deadline_date,
  date_label = excluded.date_label,
  deadline_kind = excluded.deadline_kind,
  deadline_status = excluded.deadline_status,
  reason_for_change = excluded.reason_for_change,
  source_id = excluded.source_id,
  verification_level = excluded.verification_level,
  review_status = excluded.review_status,
  updated_at = now();

insert into public.financial_records (
  project_id, record_type, amount, source_id, verification_level, notes, review_status
)
select p.id, x.record_type, null, null, 'missing', x.notes, 'published'
from public.projects p
cross join (values
  ('sanctioned_amount', 'No sanctioned amount for the BWSSB sewer package was located.'),
  ('contract_value', 'No contract value for the BWSSB sewer package was located.'),
  ('expenditure', 'No project-specific payment or expenditure record was located.')
) as x(record_type, notes)
where p.project_code = 'NAG-BAN-001'
and not exists (
  select 1 from public.financial_records f
  where f.project_id = p.id and f.record_type = x.record_type and f.amount is null
);

insert into public.road_cutting_permissions (
  project_id, road_segment_id, record_status, notes, review_status
)
select p.id, r.id, 'not_published',
  'No matching road-cutting permission was located. Public GBA/BBMP interfaces were unavailable during research; this does not prove that no permission exists.',
  'published'
from public.projects p
join public.road_segments r on r.slug = 'bannerghatta-road-vega-city-arekere'
where p.project_code = 'NAG-BAN-001'
and not exists (
  select 1 from public.road_cutting_permissions x
  where x.project_id = p.id and x.road_segment_id = r.id
);

insert into public.future_works (
  project_id, road_segment_id, title, description, agency_id, confidence,
  source_id, verification_level, notes, review_status
)
select p.id, r.id,
  'Proposed sewer phase: Arekere Signal to Hulimavu Metro Station',
  'The May inspection report said this phase would begin after the Vega City-Arekere work. No matching tender, work order or road-cutting permission was located.',
  a.id, 'proposed', s.id, 'reported',
  'Dates, scope, contractor and procurement identifiers remain unpublished in the located record.',
  'published'
from public.projects p
join public.road_segments r on r.slug = 'bannerghatta-road-vega-city-arekere'
join public.agencies a on a.slug = 'bwssb'
join public.sources s on s.source_code = 's3'
where p.project_code = 'NAG-BAN-001'
and not exists (
  select 1 from public.future_works f
  where f.project_id = p.id and f.title = 'Proposed sewer phase: Arekere Signal to Hulimavu Metro Station'
);

commit;

notify pgrst, 'reload schema';
