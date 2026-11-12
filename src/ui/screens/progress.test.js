// The progress screen with the normal and ugly fixtures (fixtures are read here, in tests only).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import {
  EMPTY_LINE,
  EVEN_LINE,
  FEW_LINE,
  MODE_NAMES,
  NO_BESTS_LINE,
  progressScreen,
  setOn,
} from "./progress.js";

const design = () =>
  readFileSync(new URL("../../../.kiro/specs/shell/design.md", import.meta.url), "utf8");
const rowText = (prefix) =>
  design()
    .split("\n")
    .find((l) => l.startsWith(prefix))
    .split("|")[2]
    .trim();

const fixture = (p) =>
  JSON.parse(readFileSync(new URL(`../../../fixtures/${p}`, import.meta.url), "utf8")).value;

function draw(progress) {
  let out;
  withFakeDocument(() => {
    const went = [];
    const node = progressScreen.render({ state: { progress }, back: () => went.push("back") });
    out = { node, text: textOf(node), went };
  });
  return out;
}

test("zero rounds: the empty line, the few-data line, no bests, no crash", () => {
  const { text } = draw(fixture("ugly/progress.zero-rounds.json"));
  assert.ok(text.includes(EMPTY_LINE));
  assert.ok(text.includes(FEW_LINE));
  assert.ok(text.includes("No personal bests yet. Play a round to set one."));
  assert.ok(text.includes("Not enough yet:"));
});

test("a few rounds: bests show, 'not enough yet' still covers the thin keys", () => {
  const { text } = draw(fixture("normal/progress.basic.json"));
  assert.ok(!text.includes(EMPTY_LINE));
  assert.ok(text.includes(`Four corners: 30 WPM, ${setOn(1793000000000)}`));
  assert.ok(text.includes("Not enough yet:"));
});

test("200 rounds and every key: at most three sentences, a summary line per band", () => {
  const { node, text } = draw(fixture("ugly/progress.200-rounds-all-keys.json"));
  assert.ok(!text.includes(EMPTY_LINE));
  const section = findAll(node, (n) => n.attrs?.["aria-labelledby"] === "pg-diag")[0];
  const items = findAll(section, (n) => n.tag === "li" || n.tagName === "LI");
  assert.ok(items.length <= 3, `${items.length} sentences`);
  assert.ok(text.includes("Heat map in words"));
});

test("Back goes back", () => {
  withFakeDocument(() => {
    const went = [];
    const node = progressScreen.render({
      state: { progress: fixture("ugly/progress.zero-rounds.json") },
      back: () => went.push("back"),
    });
    const btn = findAll(node, (n) => textOf(n) === "Back" && n.attrs?.type === "button")[0];
    btn.click?.();
    assert.deepEqual(went, ["back"]);
  });
});

test("the lines are the approved copy, word for word, and match the design table", () => {
  assert.equal(EMPTY_LINE, "Play a round and your keys will show up here.");
  assert.equal(FEW_LINE, "Not enough typing yet to say anything about your keys. Keep playing.");
  assert.equal(EVEN_LINE, "Nothing stands out. Your keys look even.");
  assert.equal(NO_BESTS_LINE, "No personal bests yet. Play a round to set one.");
  assert.equal(rowText("| Progress, no rounds"), EMPTY_LINE);
  assert.equal(rowText("| Progress, too little data"), FEW_LINE);
  assert.equal(rowText("| Progress, nothing flagged"), EVEN_LINE);
  assert.equal(rowText("| Personal bests, none"), NO_BESTS_LINE);
});

test("the headings are the approved four", () => {
  const { node } = draw(fixture("normal/progress.basic.json"));
  const heads = findAll(node, (n) => n.tag === "h2" || n.tag === "h3").map(textOf);
  assert.deepEqual(heads, ["Your keys", "Heat map in words", "What we notice", "Personal bests"]);
});

test("mode names are the approved ones, and the design table lists them", () => {
  assert.deepEqual(MODE_NAMES, {
    corners: "Four corners",
    falling: "Falling words",
    lesson: "Lessons",
    testout: "Test outs",
    daily: "Daily drill",
    specwave: "Spec Wave",
  });
  const row = rowText("| Personal best names");
  for (const [k, v] of Object.entries(MODE_NAMES)) assert.ok(row.includes(`${k}: ${v}`), k);
});

test("a best's date reads 'set Nov 11' in local time, and bad dates are left out", () => {
  assert.equal(setOn(new Date(2026, 10, 11, 23, 59).getTime()), "set Nov 11");
  assert.equal(setOn(new Date(2027, 0, 1, 0, 1).getTime()), "set Jan 1");
  for (const bad of [undefined, null, "x", Number.NaN, Number.POSITIVE_INFINITY, 1e20]) {
    assert.equal(setOn(bad), "", String(bad));
  }
  const progress = { keys: [], rounds: [], bests: { corners: { wpm: 30 }, weird: { wpm: 5 } } };
  const { text } = draw(progress);
  assert.ok(text.includes("Four corners: 30 WPM"));
  assert.ok(!text.includes("Four corners: 30 WPM,"));
  assert.ok(text.includes("weird: 5 WPM")); // an unknown mode shows its own name, never crashes
});
