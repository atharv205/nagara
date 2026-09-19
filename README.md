# Nagara

Nagara is building a public memory for Bengaluru's infrastructure.

This first public demonstration follows authority-led excavation and restoration work on Bannerghatta Road, especially the Vega City–IIMB/Fortis–Arekere corridor. It brings the known timeline, project fields, unavailable records, and source provenance into one understandable civic record.

## Product principles

- Important claims remain attached to their sources.
- Official records, reporting, and citizen evidence are labelled separately.
- Missing information is shown as missing, not guessed.
- Revised deadlines do not erase previous commitments.
- Accountability means preserving the record—not alleging corruption.

## Pages

1. Nagara and the Bannerghatta Road use case
2. Verified excavation history
3. The complete public project record
4. Data verification and missing-record register

## Prerequisites

- Node.js `>=22`

## Quick Start

```bash
npm install
npm run dev
npm run build
npm test
```

Create `.env.local` for local development:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Only the Supabase publishable key is used in the browser. Public access is restricted by row-level security; service-role credentials must never be added to this application.

## Data layer

The normalized Supabase/Postgres schema begins in [`supabase/migrations/0001_nagara_core.sql`](supabase/migrations/0001_nagara_core.sql). The additive Road Memory and public-record layer is in [`supabase/migrations/0002_bannerghatta_beta_record.sql`](supabase/migrations/0002_bannerghatta_beta_record.sql). It covers road segments, projects, agencies, contractors, deadlines, events, sources, verification, future works, road-cutting permissions, financial records, official updates, citizen evidence, and revision history.

[`supabase/seed_bannerghatta_beta.sql`](supabase/seed_bannerghatta_beta.sql) is the idempotent Beta v1 data import. The site reads the published `NAG-BAN-001` record through the RLS-protected `get_nagara_public_record` RPC. A local static copy remains only as a continuity fallback if the public database is temporarily unreachable.

## Verification boundary

The demonstration does not identify a verified BWSSB tender, contractor, work order, contractual start date, original contractual deadline, approved budget, payments, approving minister, or road-cutting permission for the examined sewer work. Those fields are explicitly marked **Not published / unavailable** until a reliable public record is found.
