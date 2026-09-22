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

[`supabase/seed_bannerghatta_beta.sql`](supabase/seed_bannerghatta_beta.sql) is the idempotent Beta v1 data import. The public site first queries the RLS-protected `projects` register, then reads the selected project through `get_nagara_public_record`. Project links are shareable with `?project=<project-slug>`. A local static copy of `NAG-BAN-001` remains only as a continuity fallback if the public database is temporarily unreachable; other projects are never replaced by invented fallback values.

The connected production database currently publishes six Bannerghatta Road records: the BWSSB sewer-work history, the BSCC restoration tender, the announced end-to-end white-topping project, current asphalt/patchwork activity, footpath clearance, and the Sarakki utility-cut restoration. Adding another published `NAG-BAN-*` project makes it appear in the frontend project register without a code change.

## Product analytics

Nagara records anonymous, purpose-specific interaction events in Supabase through [`supabase/migrations/0003_anonymous_product_analytics.sql`](supabase/migrations/0003_anonymous_product_analytics.sql). These include page and project views, section reach, project selection, timeline/record/source filters, field expansion, source-document opens, navigation and record sharing.

The site uses an ephemeral UUID stored in `sessionStorage`, so a session ends with the browser tab. It does not store a persistent visitor ID, names, email addresses, form content, precise location or raw IP addresses in the analytics table. Browser Do Not Track is respected. Public clients can append constrained events but cannot read analytics data.

Summary views and useful research queries are documented in [`supabase/analytics_queries.sql`](supabase/analytics_queries.sql). For Instagram attribution, use a tagged link such as:

```text
https://nagara-beta.vercel.app/?utm_source=instagram&utm_medium=social&utm_campaign=beta_launch&utm_content=bio
```

Review retention periodically. A commented 180-day cleanup query is included in the analytics query file.

## Verification boundary

The demonstration does not identify a verified BWSSB tender, contractor, work order, contractual start date, original contractual deadline, approved budget, payments, approving minister, or road-cutting permission for the examined sewer work. Those fields are explicitly marked **Not published / unavailable** until a reliable public record is found.
