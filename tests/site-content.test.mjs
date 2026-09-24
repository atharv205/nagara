import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships Nagara's four-part public record", async () => {
  const [page, layout, schema, analytics, analyticsMigration] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("supabase/migrations/0001_nagara_core.sql", root), "utf8"),
    readFile(new URL("lib/analytics.ts", root), "utf8"),
    readFile(new URL("supabase/migrations/0003_anonymous_product_analytics.sql", root), "utf8"),
  ]);

  assert.match(layout, /A public memory for Bengaluru/);
  assert.match(page, /WHY THIS CORRIDOR/);
  assert.match(page, /EXCAVATION HISTORY/);
  assert.match(page, /PROJECT RECORD/);
  assert.match(page, /DATA VERIFICATION/);
  assert.match(page, /Not published/);
  assert.match(page, /\.from\("projects"\)/);
  assert.match(page, /p_project_code: selectedProjectCode/);
  assert.match(page, /Bannerghatta Road project register/);
  assert.match(page, /ರಸ್ತೆ ಅಂದ್ರೆ ಈಗ ಹೇಗಿದೆ ಅನ್ನೋದು ಮಾತ್ರ ಅಲ್ಲ/);
  assert.match(page, /ಬನ್ನೇರುಘಟ್ಟ ರಸ್ತೆ ನೋಡಿದ್ರೆ <strong>ನಗರ<\/strong>/);
  assert.match(page, /ರಸ್ತೆಯ ದಾಖಲೆ/);
  assert.match(page, /ಯೋಜನೆಯ ದಾಖಲೆ/);
  assert.match(page, /ಮಾಹಿತಿ ಇಲ್ಲದ ಜಾಗವನ್ನು ಕೋಪದಿಂದ ತುಂಬೋದು ನಮ್ಮ ಉದ್ದೇಶ ಅಲ್ಲ/);
  assert.match(page, /className="section-scroller"/);
  assert.match(page, /section_scroller_/);
  assert.match(page, /--scroll-progress/);
  assert.match(page, /scroller-current-title/);
  assert.match(page, /ಮಾಹಿತಿ ಪರಿಶೀಲನೆ/);
  assert.match(schema, /create table public\.road_segments/i);
  assert.match(schema, /create table public\.projects/i);
  assert.match(schema, /enable row level security/i);
  assert.match(page, /trackSourceOpen/);
  assert.match(page, /section_view/);
  assert.match(analytics, /sessionStorage/);
  assert.match(analytics, /navigator\.doNotTrack/);
  assert.match(analyticsMigration, /create table public\.analytics_events/i);
  assert.match(analyticsMigration, /grant insert on table public\.analytics_events to anon, authenticated/i);
  assert.match(analyticsMigration, /revoke all on table public\.analytics_events from public, anon, authenticated/i);
});

test("feedback is private, bounded and integrated with navigation", async () => {
  const [page, feedback, migration, css] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/feedback.tsx", root), "utf8"),
    readFile(new URL("supabase/migrations/20260923175712_private_pilot_feedback.sql", root), "utf8"),
    readFile(new URL("app/globals.css", root), "utf8"),
  ]);
  assert.match(page, /href="#feedback"/);
  assert.match(page, /<Feedback projectCode=/);
  assert.match(feedback, /id="feedback"/);
  assert.match(feedback, /ನಿಮ್ಮ ಅಭಿಪ್ರಾಯ/);
  assert.match(feedback, /\.from\("pilot_feedback"\)/);
  assert.doesNotMatch(feedback, /\.select\(/);
  assert.match(feedback, /AbortSignal\.timeout\(15000\)/);
  assert.match(feedback, /error\.code !== "23505"/);
  assert.match(feedback, /name="consent" value="yes" required/);
  assert.match(feedback, /maxLength=\{2000\}/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on table public\.pilot_feedback from public, anon, authenticated/);
  assert.match(migration, /grant insert \(submission_id/);
  assert.doesNotMatch(migration, /for (select|update|delete)/i);
  assert.match(migration, /usefulness between 1 and 5/);
  assert.match(migration, /p\.review_status = 'published'/);
  assert.match(css, /repeat\(var\(--section-count, 7\)/);
});
