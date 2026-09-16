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

- Node.js `>=20`

## Quick Start

```bash
npm install
npm run dev
npm run build
npm test
```

## Data layer

The normalized Supabase/Postgres schema is in [`supabase/migrations/0001_nagara_core.sql`](supabase/migrations/0001_nagara_core.sql). It covers road segments, projects, agencies, contractors, deadlines, events, sources, verification, future works, road-cutting permissions, financial records, official updates, citizen evidence, and revision history.

The current site uses a carefully sourced static demonstration record. Connecting the interface to Supabase is the next implementation stage.

## Verification boundary

The demonstration does not identify a verified BWSSB tender, contractor, work order, contractual start date, original contractual deadline, approved budget, payments, approving minister, or road-cutting permission for the examined sewer work. Those fields are explicitly marked **Not published / unavailable** until a reliable public record is found.
