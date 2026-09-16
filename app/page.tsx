"use client";

import { useMemo, useState } from "react";

type SourceClass =
  | "Institutional reporting"
  | "Investigative reporting"
  | "Procurement mirror"
  | "Citizen evidence"
  | "Dataset coverage";

type EvidenceLevel = "supported" | "reported" | "citizen" | "missing";

type SourceRef = {
  id: string;
  title: string;
  publisher: string;
  date: string;
  url: string;
  sourceClass: SourceClass;
  note: string;
  hasPhotos?: boolean;
};

const sources: SourceRef[] = [
  {
    id: "s1",
    title: "BWSSB restores Bannerghatta Main Road surface; DPR preparation reported",
    publisher: "The South India Times",
    date: "23 Apr 2026",
    url: "https://epaper.thesouthindiatimes.com/media/2026-04/hyd-tsit-23rd-apr-2026.pdf",
    sourceClass: "Institutional reporting",
    note:
      "Reports Commissioner K. N. Ramesh’s statement: BWSSB sewage-pipeline work damaged the road; roughly 1 km from Kalyani Choultry to IIMB Metro station had been restored after an 8 Apr inspection.",
  },
  {
    id: "s2",
    title: "Civic agencies drag feet as Bannerghatta Road falls apart",
    publisher: "Deccan Herald",
    date: "11 May 2026",
    url: "https://www.deccanherald.com/india/karnataka/bengaluru/civic-agencies-drag-feet-as-bannerghatta-road-falls-apart-3999322",
    sourceClass: "Investigative reporting",
    note:
      "Field report on the 2.5 km Arakere–Vega City stretch, describing a coordination problem between BWSSB and Bengaluru South City Corporation.",
    hasPhotos: true,
  },
  {
    id: "s3",
    title: "Inspection direction: Vega City–Arekere sewer work and a proposed second phase",
    publisher: "NammaWard",
    date: "31 May 2026",
    url: "https://nammaward.in/wardpulse/formulate-plan-to-prevent-waterlogging-on-bannerghatta-road-maheshwar-rao",
    sourceClass: "Institutional reporting",
    note:
      "Reports a direction for BWSSB to finish ongoing sewer-pipeline work between Vega City Mall and Arekere Signal within two days; asphalting was to follow, with a later phase to Hulimavu Metro Station.",
  },
  {
    id: "s4",
    title: "Restoration of bad reaches and potholes: Dairy Circle to Vega City Mall",
    publisher: "Karnataka procurement listing (mirrored)",
    date: "26 May 2026",
    url: "https://tenders.infralens.in/tender/bscc-2026-27-rd-work-indent265-300782",
    sourceClass: "Procurement mirror",
    note:
      "Mirrors a Karnataka KPPP tender for a separate BSCC restoration work. Tender ID 2026_Bengalur_300782_1; reference BSCC/2026-27/RD/WORK_INDENT265; estimated value ₹79.39 lakh. This is not evidence of the BWSSB sewer contract.",
  },
  {
    id: "s5",
    title: "Temporary fix, bigger upgrade awaited",
    publisher: "The Times of India",
    date: "10 Jun 2026",
    url: "https://timesofindia.indiatimes.com/city/bengaluru/bengalurus-troubled-bannerghatta-road-gets-a-temporary-fix-bigger-upgrade-awaited/photostory/131631811.cms",
    sourceClass: "Investigative reporting",
    note:
      "Reports temporary pothole filling between Vega City Mall Junction and Arekere Junction, while noting that some BWSSB work remained pending.",
    hasPhotos: true,
  },
  {
    id: "s6",
    title: "Bannerghatta Road infrastructure in a nutshell",
    publisher: "r/bangalore community post",
    date: "30 Aug 2026",
    url: "https://www.reddit.com/r/bangalore/comments/1w26f5g/bannerghatta_road_infrastructure_in_a_nutshell/",
    sourceClass: "Citizen evidence",
    note:
      "A citizen post reported fresh digging near Fortis Hospital/IIMB. It corroborates the on-ground observation below, but it does not identify the excavating agency or authorise an attribution.",
    hasPhotos: true,
  },
  {
    id: "s7",
    title: "B-RIGHT citizen portal: published dataset scope",
    publisher: "Bengaluru NavaNirmana Party",
    date: "Accessed Sep 2026",
    url: "https://bright.nammabnp.org/",
    sourceClass: "Dataset coverage",
    note:
      "B-RIGHT says it analysed 63,629 BBMP ward-level projects. A matching entry for this BWSSB sewer package was not located in the publicly browsable portal during this research.",
  },
  {
    id: "s8",
    title: "BNP’s B-RIGHT data lineage",
    publisher: "Civic Data Commons",
    date: "Accessed Sep 2026",
    url: "https://data.kaun.city/about/partners/",
    sourceClass: "Dataset coverage",
    note:
      "Documents B-RIGHT as a BBMP-project dataset with contractor and payment traces, and identifies public-government data systems that feed the civic-data ecosystem.",
  },
];

const timeline = [
  {
    date: "8 APR 2026",
    title: "First located official intervention",
    body:
      "During an inspection, the Commissioner directed urgent repair after BWSSB and BMRCL works were reported to have damaged Bannerghatta Main Road. The actual sewer-work commencement date was not published in the records located.",
    evidence: "supported" as EvidenceLevel,
    sources: ["s1"],
    zone: "PAST",
  },
  {
    date: "23 APR 2026",
    title: "1 km restoration reported",
    body:
      "A Commissioner statement reported that BWSSB had laid sewage pipelines and restored approximately 1 km from Kalyani Choultry to IIMB Metro station. This establishes a restoration event, not completion of the full corridor package.",
    evidence: "supported" as EvidenceLevel,
    sources: ["s1"],
    zone: "PAST",
  },
  {
    date: "11 MAY 2026",
    title: "Arakere–Vega City condition documented",
    body:
      "A field report described the 2.5 km stretch between Arakere and Vega City Mall as severely degraded and identified coordination between BWSSB and BSCC as a central issue.",
    evidence: "reported" as EvidenceLevel,
    sources: ["s2"],
    zone: "PAST",
  },
  {
    date: "31 MAY 2026",
    title: "Public completion direction issued",
    body:
      "BWSSB was reportedly directed to finish ongoing sewer-pipeline work from Vega City Mall to Arekere Signal within two days. This is a public direction, not a located contractual completion date. A second phase to Hulimavu Metro Station was said to follow.",
    evidence: "reported" as EvidenceLevel,
    sources: ["s3"],
    zone: "PAST",
  },
  {
    date: "10 JUN 2026",
    title: "Temporary repair, pending utility work",
    body:
      "Separate BSCC pothole filling between Vega City Mall Junction and Arekere Junction was reported as temporary; the report noted pending BWSSB work. It is not treated here as completion of the sewer project.",
    evidence: "reported" as EvidenceLevel,
    sources: ["s5"],
    zone: "PAST",
  },
  {
    date: "30 AUG 2026",
    title: "Fresh excavation observed near Fortis / IIMB",
    body:
      "Nagara’s founder observed fresh excavation on the relaid corridor. A public community post independently reported digging nearby. The responsible agency, purpose, permission and related tender remain unverified.",
    evidence: "citizen" as EvidenceLevel,
    sources: ["s6"],
    zone: "NOW",
  },
  {
    date: "NEXT 24 MONTHS",
    title: "A proposed road-memory watch",
    body:
      "The May direction referred to a further sewer phase from Arekere Signal to Hulimavu Metro Station. No accessible tender, work order or road-cutting permission was located for that phase, so it cannot yet be labelled confirmed.",
    evidence: "missing" as EvidenceLevel,
    sources: ["s3"],
    zone: "NEXT",
  },
];

type Field = {
  group: string;
  field: string;
  value: string;
  status: EvidenceLevel;
  sourceIds: string[];
  detail: string;
};

const fields: Field[] = [
  {
    group: "Identity & ownership",
    field: "Working project title",
    value: "BWSSB sewer-pipeline work — Vega City Mall ↔ Arekere Signal",
    status: "supported",
    sourceIds: ["s1", "s3"],
    detail: "Working research title, not a published tender title.",
  },
  {
    group: "Identity & ownership",
    field: "Road segment",
    value: "Bannerghatta Main Road; Vega City Mall → IIMB/Fortis → Arekere Signal",
    status: "supported",
    sourceIds: ["s2", "s3"],
    detail: "The public material uses partly overlapping place references; this page does not claim a government road-segment ID.",
  },
  {
    group: "Identity & ownership",
    field: "Executing agency",
    value: "Bengaluru Water Supply and Sewerage Board (BWSSB)",
    status: "supported",
    sourceIds: ["s1", "s3"],
    detail: "Named as undertaking sewer/sewage-pipeline work in the located reporting.",
  },
  {
    group: "Identity & ownership",
    field: "Road restoration authority",
    value: "Bengaluru South City Corporation (BSCC) — related restoration actions",
    status: "reported",
    sourceIds: ["s2", "s5"],
    detail: "The scope and handover between utility work and road restoration are not published as one unified project record.",
  },
  {
    group: "Identity & ownership",
    field: "Approving minister / representative",
    value: "Not published / not assigned",
    status: "missing",
    sourceIds: [],
    detail: "No approving minister or elected representative was documented for this sewer package. Nagara does not infer political ownership from geography.",
  },
  {
    group: "Procurement & money",
    field: "BWSSB tender ID",
    value: "Not published / unavailable in records reviewed",
    status: "missing",
    sourceIds: [],
    detail: "No matching BWSSB tender could be located through the accessible public record trail. The separate BSCC restoration tender must not be substituted for it.",
  },
  {
    group: "Procurement & money",
    field: "BWSSB work order",
    value: "Not published / unavailable in records reviewed",
    status: "missing",
    sourceIds: [],
    detail: "A work order was not linked from the articles or accessible portals checked.",
  },
  {
    group: "Procurement & money",
    field: "Executing contractor",
    value: "Not published / unavailable",
    status: "missing",
    sourceIds: [],
    detail: "No contractor is named in the located sources. Nagara will not attribute the August excavation to an agency or contractor without documentary evidence.",
  },
  {
    group: "Procurement & money",
    field: "Sanctioned / contract value",
    value: "Not published for the BWSSB sewer package",
    status: "missing",
    sourceIds: [],
    detail: "₹79.39 lakh is the estimate for a separate BSCC road-restoration tender, not the value of the sewer work.",
  },
  {
    group: "Procurement & money",
    field: "Related restoration tender",
    value: "2026_Bengalur_300782_1 · ₹79.39 lakh estimate",
    status: "reported",
    sourceIds: ["s4"],
    detail: "BSCC reference BSCC/2026-27/RD/WORK_INDENT265; Dairy Circle to Vega City Mall. This is displayed only as a related, separate work.",
  },
  {
    group: "Procurement & money",
    field: "Payments / expenditure",
    value: "Not published / unavailable for the BWSSB sewer package",
    status: "missing",
    sourceIds: [],
    detail: "No project-specific payment, bill, expenditure or utilisation record was located.",
  },
  {
    group: "Schedule & delivery",
    field: "Work commencement",
    value: "Not published; public trail confirms work was already ongoing by 8 Apr 2026",
    status: "supported",
    sourceIds: ["s1"],
    detail: "The inspection record is the earliest located public trace, not proof of the actual start date.",
  },
  {
    group: "Schedule & delivery",
    field: "Original contractual deadline",
    value: "Not published / unavailable",
    status: "missing",
    sourceIds: [],
    detail: "No tender/work order schedule was located. A direction made in May must not be relabelled as an original contract deadline.",
  },
  {
    group: "Schedule & delivery",
    field: "Publicly stated completion direction",
    value: "Within two days of 31 May 2026 (≈ 2 Jun 2026) for Vega City → Arekere",
    status: "reported",
    sourceIds: ["s3"],
    detail: "Reported direction during an inspection; the source does not publish a contractual baseline or proof of completion.",
  },
  {
    group: "Schedule & delivery",
    field: "Delay reason",
    value: "No verified BWSSB explanation located",
    status: "missing",
    sourceIds: [],
    detail: "Reporting describes coordination and pending work, but no attributed BWSSB explanation for a contractual delay was located.",
  },
  {
    group: "Schedule & delivery",
    field: "Restoration record",
    value: "~1 km Kalyani Choultry → IIMB Metro reported restored by 23 Apr 2026",
    status: "supported",
    sourceIds: ["s1"],
    detail: "This does not establish permanent restoration of the full Vega City–Arekere corridor.",
  },
  {
    group: "Coordination & future works",
    field: "Road-cutting permission",
    value: "Not located / unavailable",
    status: "missing",
    sourceIds: [],
    detail: "No matching permission document was found. The public GBA/BBMP interfaces were unavailable during this research, so this is not a claim that no permission exists.",
  },
  {
    group: "Coordination & future works",
    field: "Future work signal",
    value: "Arekere Signal → Hulimavu Metro Station sewer phase announced",
    status: "reported",
    sourceIds: ["s3"],
    detail: "The source says the phase would commence after Vega City–Arekere work. No public procurement or permission record was located to confirm schedule, scope or contractor.",
  },
  {
    group: "Coordination & future works",
    field: "Was August excavation planned before resurfacing?",
    value: "Unknown",
    status: "missing",
    sourceIds: [],
    detail: "This requires a matched tender, work order or road-cutting permission. Without one, Nagara shows the chronology but does not allege a coordination failure.",
  },
  {
    group: "Ground truth & dataset check",
    field: "Citizen evidence",
    value: "Fresh excavation reported near Fortis / IIMB on 30 Aug 2026",
    status: "citizen",
    sourceIds: ["s6"],
    detail: "Founder observation with an independent community-post corroboration. It confirms a reported on-ground condition, not agency ownership or work purpose.",
  },
  {
    group: "Ground truth & dataset check",
    field: "B-RIGHT comparison",
    value: "No matching BWSSB sewer package located in public B-RIGHT search",
    status: "missing",
    sourceIds: ["s7", "s8"],
    detail: "B-RIGHT describes its corpus as BBMP ward-level projects. This tracked subject is BWSSB work; absence from a public search is not proof BNP has no related information internally.",
  },
];

const evidenceStyles: Record<EvidenceLevel, { label: string; className: string }> = {
  supported: { label: "SUPPORTED", className: "tag tag-supported" },
  reported: { label: "REPORTED", className: "tag tag-reported" },
  citizen: { label: "CITIZEN EVIDENCE", className: "tag tag-citizen" },
  missing: { label: "NOT PUBLISHED", className: "tag tag-missing" },
};

function EvidenceTag({ status }: { status: EvidenceLevel }) {
  const item = evidenceStyles[status];
  return <span className={item.className}>{item.label}</span>;
}

function SourceLinks({ ids }: { ids: string[] }) {
  if (!ids.length) return <span className="muted">No source located</span>;
  return (
    <span className="source-inline">
      {ids.map((id, index) => {
        const source = sources.find((item) => item.id === id);
        if (!source) return null;
        return (
          <span key={id}>
            {index > 0 && ", "}
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.id.toUpperCase()}
            </a>
          </span>
        );
      })}
    </span>
  );
}

export default function Home() {
  const [timelineFilter, setTimelineFilter] = useState<"all" | EvidenceLevel>("all");
  const [dataFilter, setDataFilter] = useState<"all" | "available" | "missing">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | SourceClass>("all");
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const visibleTimeline = useMemo(
    () =>
      timelineFilter === "all"
        ? timeline
        : timeline.filter((item) => item.evidence === timelineFilter),
    [timelineFilter],
  );

  const visibleFields = useMemo(
    () =>
      fields.filter((item) => {
        if (dataFilter === "available") return item.status !== "missing";
        if (dataFilter === "missing") return item.status === "missing";
        return true;
      }),
    [dataFilter],
  );

  const fieldGroups = useMemo(() => {
    const groups = new Map<string, Field[]>();
    visibleFields.forEach((field) => {
      groups.set(field.group, [...(groups.get(field.group) ?? []), field]);
    });
    return [...groups.entries()];
  }, [visibleFields]);

  const visibleSources = useMemo(
    () =>
      sourceFilter === "all"
        ? sources
        : sources.filter((source) => source.sourceClass === sourceFilter),
    [sourceFilter],
  );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="#intro" aria-label="Nagara home">
          <span lang="kn">ನಗರ</span>
          <span>NAGARA</span>
        </a>
        <nav aria-label="Page sections">
          <a href="#intro">01 / CASE</a>
          <a href="#history">02 / HISTORY</a>
          <a href="#record">03 / RECORD</a>
          <a href="#verification">04 / SOURCES</a>
        </nav>
        <button className="quiet-action" type="button" onClick={copyLink}>
          {copied ? "LINK COPIED" : "SHARE RECORD"}
        </button>
      </header>

      <section id="intro" className="chapter hero-chapter">
        <div className="brick-field" aria-hidden="true">
          <span className="route-dot dot-one" />
          <span className="route-dot dot-two" />
          <span className="route-dot dot-three" />
          <span className="route-line" />
        </div>
        <div className="chapter-label">01 — THE CASE FOR A PUBLIC RECORD</div>
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">BENGALURU’S INFRASTRUCTURE MEMORY</p>
            <h1>
              A road is more than
              <em> its latest condition.</em>
            </h1>
            <p className="lede">
              Nagara connects the scattered record behind public works: who did the work,
              what was promised, what changed, and what comes next. It records evidence —
              not accusations.
            </p>
            <div className="hero-actions">
              <a className="text-action" href="#history">
                READ THE BANNERGHATTA RECORD <span>↓</span>
              </a>
              <a className="text-action secondary" href="#verification">
                SEE EVERY SOURCE <span>→</span>
              </a>
            </div>
          </div>
          <aside className="case-note">
            <p className="case-number">CASE 001</p>
            <h2>Bannerghatta Road</h2>
            <p className="route-name">Vega City → IIMB / Fortis → Arekere</p>
            <dl>
              <div>
                <dt>WHAT WE CAN ESTABLISH</dt>
                <dd>BWSSB sewer-pipeline work, partial restoration, public completion directions and renewed excavation reports.</dd>
              </div>
              <div>
                <dt>WHAT IS STILL ABSENT</dt>
                <dd>The matched work order, contractor, original deadline, project value and the August excavation’s permission.</dd>
              </div>
            </dl>
          </aside>
        </div>
        <div className="principle-strip">
          <span>PUBLIC MONEY</span>
          <span>PUBLIC WORK</span>
          <span>PUBLIC RECORD</span>
        </div>
      </section>

      <section className="chapter why-chapter" aria-labelledby="why-title">
        <div className="chapter-label">WHY THIS CORRIDOR</div>
        <div className="why-grid">
          <div>
            <p className="eyebrow">ONE CORRIDOR, MANY HANDOFFS</p>
            <h2 id="why-title">Bannerghatta Road shows the gap Nagara is built to close.</h2>
          </div>
          <div className="why-copy">
            <p>
              The issue is not simply a bad road. On this corridor, a utility agency’s underground work,
              a road authority’s restoration, a tender record and an on-ground excavation appear in different
              places — if they appear at all.
            </p>
            <p>
              A resident should not need a personal contact, multiple portals and a stack of news tabs to work
              out what happened to a road they use every day.
            </p>
          </div>
        </div>
        <div className="road-memory" aria-label="Nagara road memory concept">
          <div className="memory-head">
            <span className="section-kicker">NAGARA ROAD MEMORY</span>
            <span>PAST · NOW · NEXT</span>
          </div>
          <div className="memory-grid">
            <article>
              <p>PAST</p>
              <h3>What changed?</h3>
              <span>Excavation, restoration, deadline changes and handoffs stay visible.</span>
            </article>
            <article>
              <p>NOW</p>
              <h3>Who owns the work?</h3>
              <span>Agency, scope, current status and evidence are shown separately.</span>
            </article>
            <article>
              <p>NEXT</p>
              <h3>What may affect the road next?</h3>
              <span>Published tenders, permissions and plans become a coordination watch.</span>
            </article>
          </div>
        </div>
      </section>

      <section id="history" className="chapter history-chapter">
        <div className="chapter-label">02 — EXCAVATION HISTORY</div>
        <div className="section-intro">
          <div>
            <p className="eyebrow">BWSSB SEWER-PIPELINE RECORD</p>
            <h2>What the public record can — and cannot — tell us.</h2>
          </div>
          <div className="history-summary">
            <span className="route-badge">Vega City ↔ Arekere</span>
            <p>
              This is a focused record of authority excavation and its handoff to restoration. Generic local
              maintenance is excluded unless it directly explains the work’s condition or dependency.
            </p>
          </div>
        </div>

        <div className="history-layout">
          <aside className="route-panel" aria-label="Road segment orientation">
            <p className="section-kicker">CORRIDOR ORIENTATION</p>
            <ol>
              <li><span>01</span> Vega City Mall</li>
              <li><span>02</span> Kalyani Choultry</li>
              <li><span>03</span> IIMB / Fortis</li>
              <li><span>04</span> Arekere Signal</li>
              <li className="future-stop"><span>05</span> Hulimavu Metro <em>proposed next phase</em></li>
            </ol>
            <div className="route-legend">
              <span><i className="line-solid" /> located public record</span>
              <span><i className="line-dashed" /> future / unverified link</span>
            </div>
          </aside>
          <div className="timeline-area">
            <div className="filter-row" aria-label="Filter timeline evidence">
              {([
                ["all", "ALL EVIDENCE"],
                ["supported", "SUPPORTED"],
                ["reported", "REPORTED"],
                ["citizen", "CITIZEN"],
                ["missing", "GAPS"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={timelineFilter === value ? "filter active" : "filter"}
                  onClick={() => setTimelineFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="timeline">
              {visibleTimeline.map((event) => (
                <article className="timeline-event" key={event.date + event.title}>
                  <div className="timeline-date">
                    <span>{event.zone}</span>
                    <strong>{event.date}</strong>
                  </div>
                  <div className="timeline-content">
                    <div className="event-topline"><EvidenceTag status={event.evidence} /><SourceLinks ids={event.sources} /></div>
                    <h3>{event.title}</h3>
                    <p>{event.body}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="method-note">
              <strong>Read this correctly:</strong> “within two days” is a reported public direction, not a
              contractual baseline. The original contract schedule has not been located, so Nagara does not
              manufacture one.
            </p>
          </div>
        </div>
      </section>

      <section id="record" className="chapter record-chapter">
        <div className="chapter-label">03 — PROJECT RECORD</div>
        <div className="record-title-row">
          <div>
            <p className="eyebrow">CASE 001 / LIVE RESEARCH RECORD</p>
            <h2>Every field has a source — or a visible gap.</h2>
          </div>
          <div className="record-status">
            <span>RESEARCH SNAPSHOT</span>
            <strong>16 SEP 2026</strong>
          </div>
        </div>

        <div className="record-scoreboard">
          <div><span>IDENTIFIED</span><strong>7</strong><small>project facts with evidence</small></div>
          <div><span>OPEN GAPS</span><strong>10</strong><small>fields not publicly located</small></div>
          <div><span>ASSUMPTIONS</span><strong>0</strong><small>never substituted for evidence</small></div>
          <div><span>DATASETS CHECKED</span><strong>2</strong><small>public procurement trail + B-RIGHT comparison</small></div>
        </div>

        <div className="data-toolbar">
          <p>FILTER THE RECORD</p>
          <div>
            {([
              ["all", "ALL FIELDS"],
              ["available", "SOURCED"],
              ["missing", "NOT PUBLISHED"],
            ] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={dataFilter === value ? "filter active" : "filter"}
                onClick={() => setDataFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="project-record">
          {fieldGroups.map(([group, groupFields]) => (
            <section className="record-group" key={group}>
              <h3>{group}</h3>
              <div className="field-table" role="table" aria-label={group}>
                {groupFields.map((field) => {
                  const isExpanded = expandedField === field.field;
                  return (
                    <button
                      className={isExpanded ? "field-row expanded" : "field-row"}
                      key={field.field}
                      type="button"
                      onClick={() => setExpandedField(isExpanded ? null : field.field)}
                    >
                      <span className="field-name">{field.field}</span>
                      <span className="field-value">{field.value}</span>
                      <span className="field-proof"><EvidenceTag status={field.status} /><SourceLinks ids={field.sourceIds} /></span>
                      <span className="field-chevron" aria-hidden="true">{isExpanded ? "−" : "+"}</span>
                      {isExpanded && <span className="field-detail">{field.detail}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="coordination-watch">
          <div>
            <p className="eyebrow">COORDINATION WATCH</p>
            <h3>Was the new excavation already known before the road was restored?</h3>
          </div>
          <div className="watch-outcome">
            <EvidenceTag status="missing" />
            <p>
              <strong>Unknown.</strong> No matched tender, work order or accessible road-cutting permission was
              located for the August excavation. A gap in the public record is not evidence of a coordination failure.
            </p>
          </div>
        </div>
      </section>

      <section id="verification" className="chapter verification-chapter">
        <div className="chapter-label">04 — DATA VERIFICATION</div>
        <div className="verification-title">
          <div>
            <p className="eyebrow">PROVENANCE, NOT JUST ASSERTION</p>
            <h2>Inspect the trail behind every claim.</h2>
          </div>
          <p>
            Nagara separates a primary document, institutional reporting, independent journalism and citizen
            evidence. They answer different questions and should never be collapsed into one unlabelled “fact”.
          </p>
        </div>

        <div className="evidence-standard">
          <div><EvidenceTag status="supported" /><p>Documented by an attributable institutional statement or record.</p></div>
          <div><EvidenceTag status="reported" /><p>Published reporting; attributed but not a matched contract document.</p></div>
          <div><EvidenceTag status="citizen" /><p>On-ground observation; condition can be reported without assigning ownership.</p></div>
          <div><EvidenceTag status="missing" /><p>No record located. This is a question for the authority, not an accusation.</p></div>
        </div>

        <div className="source-toolbar">
          <p>FILTER SOURCE LIBRARY</p>
          <div>
            {(["all", "Institutional reporting", "Investigative reporting", "Procurement mirror", "Citizen evidence", "Dataset coverage"] as const).map((value) => (
              <button
                key={value}
                className={sourceFilter === value ? "filter active" : "filter"}
                onClick={() => setSourceFilter(value)}
                type="button"
              >
                {value === "all" ? "ALL" : value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="source-library">
          {visibleSources.map((source) => (
            <article className="source-entry" key={source.id}>
              <div className="source-code">{source.id.toUpperCase()}</div>
              <div>
                <p className="source-meta">{source.sourceClass} · {source.publisher} · {source.date}</p>
                <h3>{source.title}</h3>
                <p>{source.note}</p>
                <a href={source.url} target="_blank" rel="noreferrer" className="source-link">
                  OPEN ORIGINAL {source.hasPhotos ? "ARTICLE / PHOTO EVIDENCE" : "SOURCE"} ↗
                </a>
              </div>
              {source.hasPhotos && <div className="photo-marker">PHOTO<br />EVIDENCE<br />AT SOURCE</div>}
            </article>
          ))}
        </div>

        <div className="gaps-register">
          <div>
            <p className="eyebrow">MISSING-DATA REGISTER</p>
            <h3>What this research could not verify.</h3>
          </div>
          <div className="gaps-list">
            <p><strong>Contractor, tender and work order:</strong> no matching BWSSB package was located. The related BSCC tender is deliberately kept separate.</p>
            <p><strong>Original deadline and delay explanation:</strong> public reporting contains a May completion direction, but no underlying contractual schedule or formal delay explanation was found.</p>
            <p><strong>Payments and project value:</strong> no project-level BWSSB financial record was found in the accessible source trail.</p>
            <p><strong>Road-cutting permission for August:</strong> no matching permission document was located; GBA/BBMP public interfaces were unavailable during research. This does not prove that permission does not exist.</p>
            <p><strong>BNP / B-RIGHT comparison:</strong> no matching sewer-package record was located in its public portal; its stated dataset is centred on BBMP ward-level projects rather than a complete all-agency project register.</p>
          </div>
        </div>

        <div className="close-statement">
          <p>THE POINT IS NOT TO FILL THE GAPS WITH ANGER.</p>
          <h2>It is to make the gaps impossible to quietly forget.</h2>
          <span>People. Projects. Accountability.</span>
        </div>
      </section>

      <footer>
        <div className="footer-wordmark"><span lang="kn">ನಗರ</span> NAGARA</div>
        <p>Case 001 is an evidence-led prototype. A source-linked public record, not a final administrative finding.</p>
        <a href="#intro">BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}
