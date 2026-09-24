"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { trackEvent, trackEventOnce } from "@/lib/analytics";
import { getPublicSupabaseClient } from "@/lib/supabase/public";
import Feedback from "./feedback";

type SourceClass = string;

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

type TimelineEvent = {
  date: string;
  title: string;
  body: string;
  evidence: EvidenceLevel;
  sources: string[];
  zone: "PAST" | "NOW" | "NEXT";
};

type PublicRecordBundle = {
  project: {
    code: string;
    title: string;
    status: string;
    lastOfficialUpdate: string | null;
  };
  sources: SourceRef[];
  timeline: TimelineEvent[];
  fields: Field[];
};

type ProjectIndexItem = {
  project_code: string;
  slug: string;
  title: string;
  work_type: string;
  work_description: string;
  status: string;
  restoration_status: string;
  latest_official_update_on: string | null;
  timeline_note: string | null;
};

const pageSections = [
  {
    id: "intro",
    label: "CASE",
    labelKn: "ಪರಿಚಯ",
    title: "THE CASE FOR A PUBLIC RECORD",
    titleKn: "ಈ ದಾಖಲೆ ಯಾಕೆ ಬೇಕು",
  },
  {
    id: "projects",
    label: "PROJECTS",
    labelKn: "ಯೋಜನೆಗಳು",
    title: "BANNERGHATTA ROAD PROJECTS",
    titleKn: "ಬನ್ನೇರುಘಟ್ಟ ರಸ್ತೆ ಯೋಜನೆಗಳು",
  },
  {
    id: "why",
    label: "WHY",
    labelKn: "ಯಾಕೆ",
    title: "WHY THIS CORRIDOR",
    titleKn: "ಈ ರಸ್ತೆ ಯಾಕೆ",
  },
  {
    id: "history",
    label: "HISTORY",
    labelKn: "ಹಿಂದಿನ ದಾಖಲೆ",
    title: "EXCAVATION HISTORY",
    titleKn: "ಅಗೆತದ ಹಿಂದಿನ ದಾಖಲೆ",
  },
  {
    id: "record",
    label: "RECORD",
    labelKn: "ದಾಖಲೆ",
    title: "PROJECT RECORD",
    titleKn: "ಯೋಜನೆಯ ದಾಖಲೆ",
  },
  {
    id: "verification",
    label: "SOURCES",
    labelKn: "ಮೂಲಗಳು",
    title: "DATA VERIFICATION",
    titleKn: "ಮಾಹಿತಿ ಪರಿಶೀಲನೆ",
  },
  {
    id: "feedback",
    label: "FEEDBACK",
    labelKn: "ಅಭಿಪ್ರಾಯ",
    title: "YOUR FEEDBACK",
    titleKn: "ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ",
  },
] as const;

const fallbackProject: ProjectIndexItem = {
  project_code: "NAG-BAN-001",
  slug: "bannerghatta-road-utility-works-restoration",
  title: "BWSSB sewer-pipeline work and road restoration — Bannerghatta Road",
  work_type: "Sewer pipeline excavation and associated road restoration",
  work_description:
    "A public record of BWSSB sewer-pipeline excavation, partial restoration, official completion directions and later excavation reports along the Vega City–IIMB/Fortis–Arekere corridor.",
  status: "partial_restoration",
  restoration_status: "partial",
  latest_official_update_on: "2026-05-31",
  timeline_note:
    "The matched BWSSB tender, work order, contractor, original deadline, project value and later road-cutting permission remain unavailable in the public record reviewed.",
};

const fallbackSources: SourceRef[] = [
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

const fallbackTimeline: TimelineEvent[] = [
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

const fallbackFields: Field[] = [
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

function SourceLinks({
  ids,
  sourceList,
  onOpen,
}: {
  ids: string[];
  sourceList: SourceRef[];
  onOpen?: (source: SourceRef) => void;
}) {
  if (!ids.length) return <span className="muted">No source located</span>;
  return (
    <span className="source-inline">
      {ids.map((id, index) => {
        const source = sourceList.find((item) => item.id === id);
        if (!source) return null;
        return (
          <span key={id}>
            {index > 0 && ", "}
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                event.stopPropagation();
                onOpen?.(source);
              }}
            >
              {source.id.toUpperCase()}
            </a>
          </span>
        );
      })}
    </span>
  );
}

export default function Home() {
  const [projectIndex, setProjectIndex] = useState<ProjectIndexItem[]>([fallbackProject]);
  const [selectedProjectCode, setSelectedProjectCode] = useState(fallbackProject.project_code);
  const [recordProject, setRecordProject] = useState<PublicRecordBundle["project"]>({
    code: fallbackProject.project_code,
    title: fallbackProject.title,
    status: fallbackProject.status,
    lastOfficialUpdate: fallbackProject.latest_official_update_on,
  });
  const [sources, setSources] = useState<SourceRef[]>(fallbackSources);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(fallbackTimeline);
  const [fields, setFields] = useState<Field[]>(fallbackFields);
  const [dataOrigin, setDataOrigin] = useState<"loading" | "live" | "fallback">(() =>
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ? "loading"
      : "fallback",
  );
  const [timelineFilter, setTimelineFilter] = useState<"all" | EvidenceLevel>("all");
  const [dataFilter, setDataFilter] = useState<"all" | "available" | "missing">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | SourceClass>("all");
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<(typeof pageSections)[number]["id"]>("intro");
  const feedbackAnchorApplied = useRef(false);

  useEffect(() => {
    if (dataOrigin === "loading" || feedbackAnchorApplied.current) return;
    feedbackAnchorApplied.current = true;
    // Loading the live record changes the height above the form. Restore a
    // direct feedback link once, after that content has settled.
    if (window.location.hash === "#feedback") {
      window.requestAnimationFrame(() => document.getElementById("feedback")?.scrollIntoView({ behavior: "instant" }));
    }
  }, [dataOrigin]);

  useEffect(() => {
    trackEventOnce("page-view", "page_view", {
      properties: { entry_point: "site" },
    });
  }, []);

  useEffect(() => {
    let active = true;
    const client = getPublicSupabaseClient();

    if (!client) {
      return () => {
        active = false;
      };
    }

    void client
      .from("projects")
      .select(
        "project_code,slug,title,work_type,work_description,status,restoration_status,latest_official_update_on,timeline_note",
      )
      .eq("review_status", "published")
      .like("project_code", "NAG-BAN-%")
      .order("project_code", { ascending: true })
      .then(({ data, error }) => {
        if (!active || error || !data?.length) return;

        const publishedProjects = data as ProjectIndexItem[];
        setProjectIndex(publishedProjects);

        const requestedProject = new URLSearchParams(window.location.search).get("project");
        const requestedMatch = publishedProjects.find(
          (project) =>
            project.project_code.toLowerCase() === requestedProject?.toLowerCase() ||
            project.slug === requestedProject,
        );

        setDataOrigin("loading");
        setDataError(null);
        setExpandedField(null);
        setSelectedProjectCode(requestedMatch?.project_code ?? publishedProjects[0].project_code);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const client = getPublicSupabaseClient();

    if (!client) return () => { active = false; };

    void client
      .rpc("get_nagara_public_record", { p_project_code: selectedProjectCode })
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data || typeof data !== "object") {
          if (selectedProjectCode === fallbackProject.project_code) {
            setRecordProject({
              code: fallbackProject.project_code,
              title: fallbackProject.title,
              status: fallbackProject.status,
              lastOfficialUpdate: fallbackProject.latest_official_update_on,
            });
            setSources(fallbackSources);
            setTimeline(fallbackTimeline);
            setFields(fallbackFields);
          } else {
            setSources([]);
            setTimeline([]);
            setFields([]);
          }
          setDataOrigin("fallback");
          setDataError("The live record could not be loaded. No database value has been replaced with a guess.");
          return;
        }

        const record = data as unknown as Partial<PublicRecordBundle>;
        if (
          !record.project ||
          !Array.isArray(record.sources) ||
          !Array.isArray(record.timeline) ||
          !Array.isArray(record.fields)
        ) {
          setDataOrigin("fallback");
          setDataError("The live record returned an incomplete data structure.");
          return;
        }

        setRecordProject(record.project);
        setSources(record.sources);
        setTimeline(record.timeline);
        setFields(record.fields);
        setSourceFilter("all");
        setTimelineFilter("all");
        setDataFilter("all");
        setDataOrigin("live");
      });

    return () => {
      active = false;
    };
  }, [selectedProjectCode]);

  useEffect(() => {
    if (dataOrigin === "loading") return;
    trackEventOnce(`project-view:${selectedProjectCode}`, "project_view", {
      projectCode: selectedProjectCode,
    });
  }, [dataOrigin, selectedProjectCode]);

  useEffect(() => {
    if (dataOrigin === "loading" || typeof IntersectionObserver === "undefined") return;

    const sections = pageSections
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const sectionId = (entry.target as HTMLElement).id;
          trackEventOnce(
            `section-view:${selectedProjectCode}:${sectionId}`,
            "section_view",
            {
              projectCode: selectedProjectCode,
              properties: { section_id: sectionId },
            },
          );
        });
      },
      { threshold: 0.28 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [dataOrigin, selectedProjectCode]);

  useEffect(() => {
    let framePending = false;

    const updateActiveSection = () => {
      if (framePending) return;
      framePending = true;

      window.requestAnimationFrame(() => {
        const readingLine = Math.min(window.innerHeight * 0.32, 280);
        let nextSection: (typeof pageSections)[number]["id"] = "intro";

        pageSections.forEach(({ id }) => {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top <= readingLine) {
            nextSection = id;
          }
        });

        setActiveSection((current) => current === nextSection ? current : nextSection);
        framePending = false;
      });
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  useEffect(() => {
    const handleHistoryChange = () => {
      const requestedProject = new URLSearchParams(window.location.search).get("project");
      const match = projectIndex.find(
        (project) =>
          project.project_code.toLowerCase() === requestedProject?.toLowerCase() ||
          project.slug === requestedProject,
      );
      if (match) {
        setDataOrigin("loading");
        setDataError(null);
        setExpandedField(null);
        setSelectedProjectCode(match.project_code);
      }
    };

    window.addEventListener("popstate", handleHistoryChange);
    return () => window.removeEventListener("popstate", handleHistoryChange);
  }, [projectIndex]);

  const visibleTimeline = useMemo(
    () =>
      timelineFilter === "all"
        ? timeline
        : timeline.filter((item) => item.evidence === timelineFilter),
    [timeline, timelineFilter],
  );

  const visibleFields = useMemo(
    () =>
      fields.filter((item) => {
        if (dataFilter === "available") return item.status !== "missing";
        if (dataFilter === "missing") return item.status === "missing";
        return true;
      }),
    [dataFilter, fields],
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
    [sourceFilter, sources],
  );

  const sourceClasses = useMemo(
    () => [...new Set(sources.map((source) => source.sourceClass))],
    [sources],
  );

  const selectedProject = useMemo(
    () =>
      projectIndex.find((project) => project.project_code === selectedProjectCode) ??
      fallbackProject,
    [projectIndex, selectedProjectCode],
  );

  const missingFields = useMemo(
    () => fields.filter((field) => field.status === "missing"),
    [fields],
  );

  const availableFieldCount = fields.filter((field) => field.status !== "missing").length;
  const missingFieldCount = fields.filter((field) => field.status === "missing").length;

  const selectProject = (project: ProjectIndexItem) => {
    trackEvent("project_selected", {
      projectCode: project.project_code,
      properties: {
        from_project: selectedProjectCode,
        to_project: project.project_code,
      },
    });
    setDataOrigin("loading");
    setDataError(null);
    setExpandedField(null);
    setSelectedProjectCode(project.project_code);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("project", project.slug);
    window.history.pushState({}, "", `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  };

  const formatStatus = (value: string) => value.replaceAll("_", " ").toUpperCase();

  const formatRecordDate = (value: string | null) => {
    if (!value) return "NO OFFICIAL UPDATE DATE";
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date).toUpperCase();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      trackEvent("share_record", {
        projectCode: selectedProjectCode,
        properties: { target: "clipboard" },
      });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const trackSourceOpen = (source: SourceRef) => {
    trackEvent("source_opened", {
      projectCode: selectedProjectCode,
      properties: {
        source_id: source.id,
        source_publisher: source.publisher,
      },
    });
  };

  const trackNavigation = (target: string) => {
    trackEvent("navigation_click", {
      projectCode: selectedProjectCode,
      properties: { target },
    });
  };

  const activeSectionIndex = Math.max(
    0,
    pageSections.findIndex(({ id }) => id === activeSection),
  );
  const sectionProgress = ((activeSectionIndex + 1) / pageSections.length) * 100;

  return (
    <main>
      <header className="topbar">
        <a className="wordmark" href="#intro" aria-label="Nagara home" onClick={() => trackNavigation("intro")}>
          <span lang="kn">ನಗರ</span>
          <span>NAGARA</span>
        </a>
        <nav aria-label="Page sections">
          <a href="#intro" onClick={() => trackNavigation("intro")}>01 / CASE</a>
          <a href="#projects" onClick={() => trackNavigation("projects")}>02 / PROJECTS</a>
          <a href="#history" onClick={() => trackNavigation("history")}>03 / HISTORY</a>
          <a href="#record" onClick={() => trackNavigation("record")}>04 / RECORD</a>
          <a href="#verification" onClick={() => trackNavigation("verification")}>05 / SOURCES</a>
          <a href="#feedback" onClick={() => trackNavigation("feedback")}>06 / FEEDBACK</a>
        </nav>
        <button className="quiet-action" type="button" onClick={copyLink}>
          {copied ? "LINK COPIED" : "SHARE RECORD"}
        </button>
      </header>

      <nav
        className="section-scroller"
        aria-label="Jump through this Nagara record"
        style={{
          "--scroll-progress": `${sectionProgress}%`,
          "--section-count": pageSections.length,
        } as CSSProperties}
      >
        <div className="scroller-links">
          <span className="scroller-progress" aria-hidden="true"><i /></span>
          {pageSections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={activeSection === section.id ? "active" : undefined}
              aria-label={`${String(index + 1).padStart(2, "0")} — ${section.title} — ${section.titleKn}`}
              aria-current={activeSection === section.id ? "location" : undefined}
              onClick={() => trackNavigation(`section_scroller_${section.id}`)}
            >
              <span className="scroller-meta" aria-hidden="true">
                <span className="scroller-current-number">
                  {String(index + 1).padStart(2, "0")} / {String(pageSections.length).padStart(2, "0")}
                </span>
                <span className="scroller-current-title">
                  <strong>{section.title}</strong>
                  <b lang="kn">{section.titleKn}</b>
                </span>
              </span>
              <span className="scroller-node" aria-hidden="true" />
              <small>{String(index + 1).padStart(2, "0")}</small>
              <span className="scroller-label">
                {section.label}
                <b lang="kn">{section.labelKn}</b>
              </span>
            </a>
          ))}
        </div>
      </nav>

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
            <h1>
              A road is more than
              <em> its latest condition.</em>
            </h1>
            <p className="hero-kannada" lang="kn">
              ರಸ್ತೆ ಅಂದ್ರೆ ಈಗ ಹೇಗಿದೆ ಅನ್ನೋದು ಮಾತ್ರ ಅಲ್ಲ.
            </p>
            <p className="lede">
              Nagara connects the scattered record behind public works: who did the work,
              what was promised, what changed, and what comes next. It records evidence —
              not accusations.
            </p>
            <div className="hero-actions">
              <a className="text-action" href="#history" onClick={() => trackNavigation("history")}>
                READ THE BANNERGHATTA RECORD <span>↓</span>
              </a>
              <a className="text-action secondary" href="#verification" onClick={() => trackNavigation("verification")}>
                SEE EVERY SOURCE <span>→</span>
              </a>
            </div>
          </div>
          <aside className="case-note">
            <p className="case-number">{recordProject.code}</p>
            <h2>{recordProject.title}</h2>
            <p className="route-name">{selectedProject.work_type}</p>
            <dl>
              <div>
                <dt>CURRENT PUBLIC STATUS</dt>
                <dd>{formatStatus(recordProject.status)}</dd>
              </div>
              <div>
                <dt>WHAT THIS RECORD TRACKS</dt>
                <dd>{selectedProject.work_description}</dd>
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

      <section id="projects" className="project-register" aria-labelledby="project-register-title">
        <div className="register-heading">
          <div>
            <p className="eyebrow">LIVE FROM SUPABASE</p>
            <h2 id="project-register-title">Bannerghatta Road project register</h2>
          </div>
          <p>
            {projectIndex.length} published records. Choose one to load its timeline, project fields,
            unresolved gaps and complete source trail from the database.
          </p>
        </div>
        <div className="project-list" role="list" aria-label="Published Nagara projects">
          {projectIndex.map((project) => (
            <button
              key={project.project_code}
              className={project.project_code === selectedProjectCode ? "project-row active" : "project-row"}
              type="button"
              role="listitem"
              aria-current={project.project_code === selectedProjectCode ? "true" : undefined}
              onClick={() => selectProject(project)}
            >
              <span className="project-code">{project.project_code}</span>
              <span className="project-name">{project.title}</span>
              <span className="project-type">{project.work_type}</span>
              <span className="project-state">{formatStatus(project.status)}</span>
              <span className="project-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
        {dataError && <p className="data-error" role="status">{dataError}</p>}
      </section>

      <section id="why" className="chapter why-chapter" aria-labelledby="why-title">
        <div className="chapter-label">WHY THIS CORRIDOR</div>
        <div className="why-grid">
          <div>
            <p className="eyebrow">ONE CORRIDOR, MANY HANDOFFS</p>
            <h2 id="why-title">Bannerghatta Road shows the gap Nagara is built to close.</h2>
            <p className="why-kannada" lang="kn">
              ಬನ್ನೇರುಘಟ್ಟ ರಸ್ತೆ ನೋಡಿದ್ರೆ <strong>ನಗರ</strong> ಯಾಕೆ ಬೇಕು ಅನ್ನೋದು ಗೊತ್ತಾಗುತ್ತೆ.
            </p>
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
            <span className="section-kicker">NAGARA ROAD MEMORY · <b lang="kn">ರಸ್ತೆಯ ದಾಖಲೆ</b></span>
            <span>PAST · NOW · NEXT&nbsp;&nbsp; / &nbsp;&nbsp;<b lang="kn">ಹಿಂದೆ · ಈಗ · ಮುಂದೆ</b></span>
          </div>
          <div className="memory-grid">
            <article>
              <p>PAST · <b lang="kn">ಹಿಂದೆ</b></p>
              <h3>What changed?</h3>
              <h4 lang="kn">ಏನು ಆಯ್ತು?</h4>
              <span>Excavation, restoration, deadline changes and handoffs stay visible.</span>
              <span className="memory-kannada" lang="kn">ಅಗೆತ, ರಿಪೇರಿ, ಬದಲಾದ ಗಡುವು—ಎಲ್ಲವೂ ದಾಖಲಾಗುತ್ತೆ.</span>
            </article>
            <article>
              <p>NOW · <b lang="kn">ಈಗ</b></p>
              <h3>Who owns the work?</h3>
              <h4 lang="kn">ಕೆಲಸ ಯಾರ ಹೊಣೆ?</h4>
              <span>Agency, scope, current status and evidence are shown separately.</span>
              <span className="memory-kannada" lang="kn">ಯಾವ ಸಂಸ್ಥೆ ಹೊಣೆ, ಕೆಲಸದ ಸ್ಥಿತಿ ಏನು—ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣುತ್ತೆ.</span>
            </article>
            <article>
              <p>NEXT · <b lang="kn">ಮುಂದೆ</b></p>
              <h3>What may affect the road next?</h3>
              <h4 lang="kn">ಮುಂದೆ ಇನ್ನೇನು ಕೆಲಸ ಬರಬಹುದು?</h4>
              <span>Published tenders, permissions and plans become a coordination watch.</span>
              <span className="memory-kannada" lang="kn">ಪ್ರಕಟವಾದ ಮುಂದಿನ ಕೆಲಸಗಳು ಒಂದೇ ಜಾಗದಲ್ಲಿ ಕಾಣುತ್ತವೆ.</span>
            </article>
          </div>
        </div>
      </section>

      <section id="history" className="chapter history-chapter">
        <div className="chapter-label">03 — EXCAVATION HISTORY</div>
        <div className="section-intro">
          <div>
            <p className="eyebrow">{recordProject.code} / {formatStatus(recordProject.status)}</p>
            <h2>What the public record can — and cannot — tell us.</h2>
          </div>
          <div className="history-summary">
            <span className="route-badge">{selectedProject.work_type}</span>
            <p>{selectedProject.work_description}</p>
          </div>
        </div>

        <div className="history-layout">
          <aside className="route-panel project-context" aria-label="Selected project context">
            <p className="section-kicker">SELECTED PUBLIC RECORD</p>
            <strong>{selectedProject.project_code}</strong>
            <h3>{selectedProject.title}</h3>
            <dl>
              <div><dt>STATUS</dt><dd>{formatStatus(selectedProject.status)}</dd></div>
              <div><dt>RESTORATION</dt><dd>{formatStatus(selectedProject.restoration_status)}</dd></div>
              <div><dt>LAST OFFICIAL UPDATE</dt><dd>{formatRecordDate(selectedProject.latest_official_update_on)}</dd></div>
            </dl>
            <a href="#projects" onClick={() => trackNavigation("projects")}>CHANGE PROJECT ↑</a>
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
                  onClick={() => {
                    setTimelineFilter(value);
                    trackEvent("timeline_filter", {
                      projectCode: selectedProjectCode,
                      properties: { filter_value: value },
                    });
                  }}
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
                    <div className="event-topline"><EvidenceTag status={event.evidence} /><SourceLinks ids={event.sources} sourceList={sources} onOpen={trackSourceOpen} /></div>
                    <h3>{event.title}</h3>
                    <p>{event.body}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="method-note"><strong>Record note:</strong> {selectedProject.timeline_note ?? "No additional timeline note has been published."}</p>
          </div>
        </div>
      </section>

      <section id="record" className="chapter record-chapter">
        <div className="chapter-label">04 — PROJECT RECORD · <span lang="kn">ಯೋಜನೆಯ ದಾಖಲೆ</span></div>
        <div className="record-title-row">
          <div>
            <p className="eyebrow">{recordProject.code} / LIVE RESEARCH RECORD</p>
            <h2>Every field has a source — or a visible gap.</h2>
            <p className="record-kannada" lang="kn">
              ಪ್ರತಿ ಮಾಹಿತಿಗೂ ಮೂಲ ತೋರಿಸುತ್ತೇವೆ — ಮಾಹಿತಿ ಸಿಗದಿದ್ದರೆ ಅದನ್ನೂ ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳುತ್ತೇವೆ.
            </p>
          </div>
          <div className="record-status">
            <span>{dataOrigin === "live" ? "LIVE DATABASE RECORD" : dataOrigin === "loading" ? "CONNECTING TO RECORD" : "RESEARCH SNAPSHOT"}</span>
            <strong>{formatRecordDate(recordProject.lastOfficialUpdate)}</strong>
          </div>
        </div>

        <div className="record-scoreboard">
          <div><span>IDENTIFIED · <b lang="kn">ಸಿಕ್ಕ ಮಾಹಿತಿ</b></span><strong>{availableFieldCount}</strong><small>project facts with evidence</small></div>
          <div><span>OPEN GAPS · <b lang="kn">ಇನ್ನೂ ಸಿಗದ ಮಾಹಿತಿ</b></span><strong>{missingFieldCount}</strong><small>fields not publicly located</small></div>
          <div><span>ASSUMPTIONS · <b lang="kn">ಊಹೆಗಳು</b></span><strong>0</strong><small>never substituted for evidence</small></div>
          <div><span>SOURCES · <b lang="kn">ಮೂಲಗಳು</b></span><strong>{sources.length}</strong><small>linked directly to this public record</small></div>
        </div>

        <div className="data-toolbar">
          <p>FILTER THE RECORD · <b lang="kn">ಮಾಹಿತಿ ಹುಡುಕಿ</b></p>
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
                onClick={() => {
                  setDataFilter(value);
                  trackEvent("record_filter", {
                    projectCode: selectedProjectCode,
                    properties: { filter_value: value },
                  });
                }}
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
                      onClick={() => {
                        setExpandedField(isExpanded ? null : field.field);
                        if (!isExpanded) {
                          trackEvent("record_field_expanded", {
                            projectCode: selectedProjectCode,
                            properties: { field_name: field.field },
                          });
                        }
                      }}
                    >
                      <span className="field-name">{field.field}</span>
                      <span className="field-value">{field.value}</span>
                      <span className="field-proof"><EvidenceTag status={field.status} /><SourceLinks ids={field.sourceIds} sourceList={sources} onOpen={trackSourceOpen} /></span>
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
            <p className="eyebrow">OPEN RECORD QUESTIONS</p>
            <h3>What remains unresolved for this project?</h3>
          </div>
          <div className="watch-outcome">
            <EvidenceTag status={missingFieldCount > 0 ? "missing" : "supported"} />
            <p>
              <strong>{missingFieldCount} fields remain open.</strong>{" "}
              {selectedProject.timeline_note ?? "The available record does not contain a published explanation for every project field."}
            </p>
          </div>
        </div>
      </section>

      <section id="verification" className="chapter verification-chapter">
        <div className="chapter-label">05 — DATA VERIFICATION</div>
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
            {(["all", ...sourceClasses] as const).map((value) => (
              <button
                key={value}
                className={sourceFilter === value ? "filter active" : "filter"}
                onClick={() => {
                  setSourceFilter(value);
                  trackEvent("source_filter", {
                    projectCode: selectedProjectCode,
                    properties: { filter_value: value },
                  });
                }}
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
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="source-link"
                  onClick={() => trackSourceOpen(source)}
                >
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
            {missingFields.length ? missingFields.map((field) => (
              <p key={`${field.group}-${field.field}`}><strong>{field.field}:</strong> {field.detail}</p>
            )) : <p><strong>No open fields:</strong> every currently tracked field has published supporting evidence.</p>}
          </div>
        </div>

        <div className="close-statement">
          <p lang="kn">ಮಾಹಿತಿ ಇಲ್ಲದ ಜಾಗವನ್ನು ಕೋಪದಿಂದ ತುಂಬೋದು ನಮ್ಮ ಉದ್ದೇಶ ಅಲ್ಲ.</p>
          <h2>It is to make the gaps impossible to quietly forget.</h2>
          <h3 lang="kn">ಆ ಖಾಲಿ ಜಾಗಗಳು ಸುಮ್ಮನೆ ಮರೆತು ಹೋಗದಂತೆ ಮಾಡೋದೇ ನಮ್ಮ ಉದ್ದೇಶ.</h3>
          <span>People. Projects. Accountability. <b lang="kn">ಜನರು. ಯೋಜನೆಗಳು. ಜವಾಬ್ದಾರಿ.</b></span>
        </div>
      </section>

      <Feedback projectCode={selectedProjectCode} projectTitle={selectedProject.title} />

      <footer>
        <div className="footer-wordmark"><span lang="kn">ನಗರ</span> NAGARA</div>
        <p>
          {recordProject.code} is an evidence-led public record, not a final administrative finding.
          <span className="analytics-disclosure">Anonymous interaction counts help improve Nagara. Analytics do not collect names, email addresses or precise location. Feedback you choose to send is saved separately and privately.</span>
        </p>
        <a href="#intro" onClick={() => trackNavigation("intro")}>BACK TO TOP ↑</a>
      </footer>
    </main>
  );
}
