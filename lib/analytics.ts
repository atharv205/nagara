import { getPublicSupabaseClient } from "@/lib/supabase/public";

export type AnalyticsEventName =
  | "page_view"
  | "project_view"
  | "project_selected"
  | "section_view"
  | "navigation_click"
  | "timeline_filter"
  | "record_filter"
  | "record_field_expanded"
  | "source_filter"
  | "source_opened"
  | "share_record";

type AnalyticsValue = string | number | boolean;

type TrackEventOptions = {
  projectCode?: string | null;
  properties?: Record<string, AnalyticsValue | null | undefined>;
};

const SESSION_KEY = "nagara_analytics_session";
const SITE_VERSION = "beta_1";
const trackedOnce = new Set<string>();

const allowedPropertyKeys = new Set([
  "entry_point",
  "field_name",
  "filter_value",
  "from_project",
  "section_id",
  "source_id",
  "source_publisher",
  "target",
  "to_project",
]);

function getSessionId() {
  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const sessionId = window.crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

function getReferrerHost() {
  if (!document.referrer) return null;
  try {
    return new URL(document.referrer).hostname.slice(0, 255);
  } catch {
    return null;
  }
}

function getAttribution() {
  const params = new URLSearchParams(window.location.search);
  const clean = (value: string | null) => value?.trim().slice(0, 120) || null;

  return {
    utm_source: clean(params.get("utm_source")),
    utm_medium: clean(params.get("utm_medium")),
    utm_campaign: clean(params.get("utm_campaign")),
    utm_content: clean(params.get("utm_content")),
  };
}

function getDeviceClass() {
  if (window.innerWidth < 600) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

function cleanProperties(properties: TrackEventOptions["properties"] = {}) {
  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key, value]) => allowedPropertyKeys.has(key) && value !== null && value !== undefined)
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim().slice(0, 240) : value,
      ]),
  );
}

export function trackEvent(eventName: AnalyticsEventName, options: TrackEventOptions = {}) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;

  const client = getPublicSupabaseClient();
  if (!client) return;

  const payload = {
    session_id: getSessionId(),
    event_name: eventName,
    project_code: options.projectCode ?? null,
    page_path: window.location.pathname.slice(0, 255),
    referrer_host: getReferrerHost(),
    device_class: getDeviceClass(),
    viewport_width: Math.min(window.innerWidth, 32767),
    site_version: SITE_VERSION,
    properties: cleanProperties(options.properties),
    ...getAttribution(),
  };

  void client
    .from("analytics_events")
    .insert(payload)
    .then(({ error }) => {
      if (error && process.env.NODE_ENV === "development") {
        console.warn("Nagara analytics event was not recorded", error.message);
      }
    });
}

export function trackEventOnce(
  onceKey: string,
  eventName: AnalyticsEventName,
  options: TrackEventOptions = {},
) {
  if (trackedOnce.has(onceKey)) return;
  trackedOnce.add(onceKey);
  trackEvent(eventName, options);
}
