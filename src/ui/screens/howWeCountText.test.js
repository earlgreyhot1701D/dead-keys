// "How we count" text: every number is read from the config, so changing the config changes the
// page. Proven by changing each number and looking for the old and new values.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildSections, CONFIG } from "./howWeCountText.js";
import { PRIVACY_PARAGRAPHS } from "./privacy.js";

const textOf = (c) =>
  buildSections(c)
    .flatMap((s) => [s.heading, ...s.paragraphs])
    .join("\n");

const CHANGED = {
  MIN_KEY_ATTEMPTS: 17,
  ENOUGH_DATA: 321,
  GROUP_MIN_ATTEMPTS: 44,
  GROUP_RATIO: 6,
  HIGH_RATIO: 9,
  GROUP_FLOOR: 0.27,
  BEST_ACCURACY: 0.77,
  STREAK_ROUNDS: 8,
  STREAK_ACCURACY: 0.66,
  STREAK_DAYS: 12,
  WPM_BAND: 25,
  MAX_ROUNDS: 321,
};

test("the page says what the config says today", () => {
  const t = textOf(CONFIG);
  for (const phrase of [
    "10 attempts",
    "100 keystrokes",
    "at least 20 attempts",
    "at least 2 times",
    "At 3 times or more",
    "at least 5%",
    "at 90% accuracy",
    "every 10 words per minute",
    "3 rounds in a row at 95%",
    "7 days in a row",
    "last 200 rounds",
    "Focus here (!): a miss rate of 15% or more.",
    "Practicing (~): 8% up to 15%.",
    "Almost there (?): 3% up to 8%.",
    "Steady (✓): under 3%.",
    "Escape drops the lock. If nothing is locked, Escape pauses.",
  ]) {
    assert.ok(t.includes(phrase), phrase);
  }
});

test("change a number in the config and the page changes with it", () => {
  const before = textOf(CONFIG);
  for (const [key, value] of Object.entries(CHANGED)) {
    const after = textOf({ ...CONFIG, [key]: value });
    assert.notEqual(after, before, `${key} is not read from the config`);
  }
  const all = textOf({ ...CONFIG, ...CHANGED });
  for (const phrase of [
    "17 attempts",
    "321 keystrokes",
    "at least 44 attempts",
    "at least 6 times",
    "At 9 times or more",
    "at least 27%",
    "at 77% accuracy",
    "every 25 words per minute",
    "8 rounds in a row at 66%",
    "12 days in a row",
    "last 321 rounds",
  ]) {
    assert.ok(all.includes(phrase), phrase);
  }
});

test("the band cutoffs and labels come from BANDS", () => {
  const change = { missed: { min: 0.4, label: "Zed" }, uneven: { min: 0.05 } };
  const bands = CONFIG.BANDS.map((b) => ({ ...b, ...change[b.name] }));
  const t = textOf({ ...CONFIG, BANDS: bands });
  assert.ok(t.includes("Zed (!): a miss rate of 40% or more."));
  assert.ok(t.includes("Practicing (~): 8% up to 40%."));
  assert.ok(t.includes("Almost there (?): 5% up to 8%."));
  assert.ok(t.includes("Steady (✓): under 5%.")); // follows the band above it
});

test("every number in the text is a config number; nothing is typed in twice", () => {
  const allowed = new Set();
  const add = (n) => {
    allowed.add(String(n));
    allowed.add(String(Math.round(n * 100)));
  };
  for (const [k, v] of Object.entries(CONFIG)) {
    if (typeof v === "number") add(v);
    if (k === "BANDS") for (const b of v) if (b.min !== null) add(b.min);
  }
  const found = textOf(CONFIG).match(/\d+/g) ?? [];
  for (const n of found) assert.ok(allowed.has(n), `${n} is not from the config`);
});

test("the band lines and the lock rule are the design table's approved copy", () => {
  const table = readFileSync(
    new URL("../../../.kiro/specs/shell/design.md", import.meta.url),
    "utf8",
  );
  const cell = (prefix) =>
    table
      .split("\n")
      .find((l) => l.startsWith(prefix))
      .split("|")[2]
      .trim();
  const paragraphs = buildSections().find((s) => s.id === "heat").paragraphs;
  assert.equal(paragraphs.slice(1, 5).join(" / "), cell("| How we count, band lines"));
  const misses = buildSections().find((s) => s.id === "misses").paragraphs;
  assert.equal(misses[1], cell("| How we count, lock"));
});

test("it names the key groups the diagnosis uses", () => {
  const t = textOf(CONFIG);
  for (const g of CONFIG.GROUPS) assert.ok(t.includes(g.phrase), g.phrase);
});

test("what leaves the browser is the privacy card's own text", () => {
  const s = buildSections().find((x) => x.id === "leaves");
  assert.deepEqual(s.paragraphs, [PRIVACY_PARAGRAPHS[1]]);
});

test("sections have unique ids and plain headings", () => {
  const sections = buildSections();
  assert.equal(new Set(sections.map((s) => s.id)).size, sections.length);
  assert.deepEqual(
    sections.map((s) => s.heading),
    [
      "Speed",
      "Accuracy",
      "What counts as a miss",
      "The heat map",
      "What we notice",
      "Bests and milestones",
      "What is stored",
      "What leaves your browser",
    ],
  );
});
