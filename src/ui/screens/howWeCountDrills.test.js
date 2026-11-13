// How we count's Drills section (drills Req 6.1): last, word for word from the copy table, with
// the base weight read from DRILL_BASE.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DRILL_BASE } from "../../drills/weights.js";
import { drillsSection } from "./howWeCountDrills.js";
import { buildSections, CONFIG } from "./howWeCountText.js";

const table = readFileSync(
  new URL("../../../.kiro/specs/drills/design.md", import.meta.url),
  "utf8",
);
const cell = (prefix) =>
  table
    .split("\n")
    .find((l) => l.startsWith(prefix))
    .split("|")[2]
    .trim();

test("the Drills section comes last, after What leaves your browser", () => {
  const ids = buildSections().map((s) => s.id);
  assert.deepEqual(ids.slice(-2), ["leaves", "drills"]);
});

test("its heading and lines are the copy table's, with DRILL_BASE in place of {DRILL_BASE}", () => {
  const s = buildSections().at(-1);
  assert.equal(`\`${s.heading}\``, cell("| How we count heading"));
  const lines = cell("| How we count lines")
    .split(" / ")
    .map((l) => l.replace(/^`|`$/g, "").replace("{DRILL_BASE}", String(DRILL_BASE)));
  assert.deepEqual(s.paragraphs, lines);
  assert.ok(s.paragraphs[0].includes("plus 0.05 to the word's score"));
});

test("change DRILL_BASE in the config and the line changes with it", () => {
  assert.ok(drillsSection({ DRILL_BASE: 0.2 }).paragraphs[0].includes("plus 0.2 to"));
  const changed = buildSections({ ...CONFIG, DRILL_BASE: 0.3 }).at(-1).paragraphs[0];
  assert.ok(changed.includes("plus 0.3 to"));
});
