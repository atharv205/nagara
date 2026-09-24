-- Run as database owner. Everything, including synthetic test data, rolls back.
begin;
set local role anon;
insert into public.pilot_feedback (submission_id, usefulness, review, project_code, consent_version)
values ('ccdcb2f3-c6db-4b25-8de6-271e49a7ec81', 4, 'Automated test — ಕನ್ನಡ works', 'NAG-BAN-001', 'feedback_v1');

do $$
begin
  begin
    perform * from public.pilot_feedback;
    raise exception 'FAIL: anon could read private feedback';
  exception when insufficient_privilege then null; end;
  begin
    update public.pilot_feedback set review = 'changed';
    raise exception 'FAIL: anon could update feedback';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.pilot_feedback;
    raise exception 'FAIL: anon could delete feedback';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.pilot_feedback (submission_id, usefulness, review, consent_version, created_at)
    values (gen_random_uuid(), 4, 'test submission', 'feedback_v1', now());
    raise exception 'FAIL: anon could spoof server timestamp';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.pilot_feedback (submission_id, usefulness, review, consent_version)
    values (gen_random_uuid(), 6, 'test submission', 'feedback_v1');
    raise exception 'FAIL: invalid rating accepted';
  exception when check_violation then null; end;
  begin
    insert into public.pilot_feedback (submission_id, usefulness, review, consent_version)
    values (gen_random_uuid(), 4, repeat('x', 2001), 'feedback_v1');
    raise exception 'FAIL: oversized review accepted';
  exception when check_violation then null; end;
  begin
    insert into public.pilot_feedback (submission_id, usefulness, review, consent_version)
    values (gen_random_uuid(), 4, '   ', 'feedback_v1');
    raise exception 'FAIL: empty written response accepted';
  exception when check_violation then null; end;
  begin
    insert into public.pilot_feedback (submission_id, usefulness, review, consent_version, priorities)
    values (gen_random_uuid(), 4, 'test submission', 'feedback_v1', array['invalid']);
    raise exception 'FAIL: invalid priority accepted';
  exception when check_violation then null; end;
  begin
    insert into public.pilot_feedback (submission_id, usefulness, review, consent_version, website)
    values (gen_random_uuid(), 4, 'test submission', 'feedback_v1', 'spam');
    raise exception 'FAIL: honeypot accepted';
  exception when check_violation then null; end;
  begin
    insert into public.pilot_feedback (submission_id, usefulness, review, consent_version)
    values ('ccdcb2f3-c6db-4b25-8de6-271e49a7ec81', 4, 'same request retry', 'feedback_v1');
    raise exception 'FAIL: duplicate request accepted';
  exception when unique_violation then null; end;
end $$;

set local role authenticated;
insert into public.pilot_feedback (submission_id, usefulness, requested_additions, consent_version)
values ('3cc96950-5e15-4c58-a516-ac5b12c0a333', 5, 'Test future works', 'feedback_v1');
do $$
begin
  begin
    perform * from public.pilot_feedback;
    raise exception 'FAIL: authenticated user could read private feedback';
  exception when insufficient_privilege then null; end;
  begin
    update public.pilot_feedback set review = 'changed';
    raise exception 'FAIL: authenticated user could update feedback';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.pilot_feedback;
    raise exception 'FAIL: authenticated user could delete feedback';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'PASS: both roles can submit, cannot read/update/delete; validation, Unicode and deduplication checked' as result,
  count(*) as synthetic_rows
from public.pilot_feedback where submission_id in ('ccdcb2f3-c6db-4b25-8de6-271e49a7ec81','3cc96950-5e15-4c58-a516-ac5b12c0a333');
rollback;
