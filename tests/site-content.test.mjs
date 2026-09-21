import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("ships Nagara's four-part public record", async () => {
  const [page, layout, schema] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("supabase/migrations/0001_nagara_core.sql", root), "utf8"),
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
  assert.match(schema, /create table public\.road_segments/i);
  assert.match(schema, /create table public\.projects/i);
  assert.match(schema, /enable row level security/i);
});
