// The progress screen with the normal and ugly fixtures (fixtures are read here, in tests only).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { quietLine } from "../components/progressPanels.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import {
  EMPTY_LINE,
  EVEN_LINE,
  FEW_LINE,
  keyList,
  MODE_NAMES,
  NO_BESTS_LINE,
  NO_GROUP_LINE,
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

/** The first personal-best tile's three lines. */
const tile = (node) => findAll(node, (n) => n.attrs?.class === "best-tile")[0].children.map(textOf);

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
  assert.ok(text.includes("No personal bests yet. A best needs 90% accuracy or better."));
  assert.ok(text.includes("Not enough yet:"));
});

test("a few rounds: bests show, 'not enough yet' still covers the thin keys", () => {
  const { node, text } = draw(fixture("normal/progress.basic.json"));
  assert.ok(!text.includes(EMPTY_LINE));
  assert.deepEqual(tile(node), ["Four corners", "30 WPM", setOn(1793000000000)]);
  assert.ok(text.includes("Not enough yet:"));
});

test("200 rounds and every key: at most three sentences, a summary line per band", () => {
  const { node, text } = draw(fixture("ugly/progress.200-rounds-all-keys.json"));
  assert.ok(!text.includes(EMPTY_LINE));
  const section = findAll(node, (n) => n.attrs?.["aria-labelledby"] === "pg-diag")[0];
  const items = findAll(section, (n) => n.attrs?.class === "finding");
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
  assert.equal(NO_BESTS_LINE, "No personal bests yet. A best needs 90% accuracy or better.");
  assert.equal(
    NO_GROUP_LINE,
    "No group of keys stands out. Single keys to work on are listed under Keys to practice.",
  );
  assert.equal(rowText("| Progress, no group flagged"), NO_GROUP_LINE);
  assert.equal(rowText("| Progress, no rounds"), EMPTY_LINE);
  assert.equal(rowText("| Progress, too little data"), FEW_LINE);
  assert.equal(rowText("| Progress, nothing flagged"), EVEN_LINE);
  assert.equal(rowText("| Personal bests, none"), NO_BESTS_LINE);
});

test("the approved four headings are visible, in order, among the mock's panel titles", () => {
  const { node } = draw(fixture("normal/progress.basic.json"));
  const heads = findAll(node, (n) => n.tag === "h2" || n.tag === "h3").map(textOf);
  assert.deepEqual(heads, [
    "Your keys",
    "Heat map in words",
    "What we notice",
    "SPEED // LAST 14 ROUNDS",
    "Personal bests",
    "Your top weak keys",
  ]);
});

test("the drill and lesson buttons are there, marked Not built yet, and do nothing", () => {
  const { node } = draw(fixture("ugly/progress.200-rounds-all-keys.json"));
  const later = findAll(node, (n) => n.tag === "button" && n.attrs?.["aria-disabled"] === "true");
  // the label alone in the button; "Not built yet" is a line under it, tied by aria-describedby
  assert.deepEqual(later.map(textOf), ["Drill these keys", "Lessons"]);
  for (const b of later) {
    assert.equal(b.listeners.click, undefined);
    const note = findAll(node, (n) => n.attrs?.id === b.attrs["aria-describedby"])[0];
    assert.equal(textOf(note), "Not built yet");
    assert.ok(!b.children.includes(note));
  }
});

test("no group flagged: 'even' only when no single key is Focus here or Practicing", () => {
  const sufficient = { sufficientData: true };
  assert.equal(quietLine(sufficient, [{ band: "steady" }, { band: "uneven" }]), EVEN_LINE);
  assert.equal(quietLine(sufficient, [{ band: "steady" }, { band: "missed" }]), NO_GROUP_LINE);
  assert.equal(quietLine(sufficient, [{ band: "shaky" }]), NO_GROUP_LINE);
  assert.equal(quietLine({ sufficientData: false }, [{ band: "missed" }]), FEW_LINE);
  // the 200-round fixture has Focus-here keys and no flagged group
  const { text } = draw(fixture("ugly/progress.200-rounds-all-keys.json"));
  assert.ok(text.includes(NO_GROUP_LINE));
  assert.ok(!text.includes(EVEN_LINE));
});

test("key lists use ' · ' and name the hard keys, for eyes and screen readers", () => {
  assert.equal(
    keyList(["a", ",", ".", " ", ";", "'", "`", "q"]),
    "a · comma · period · space · semicolon · apostrophe · backtick · q",
  );
  assert.equal(rowText("| Key lists").includes('" · "'), true);
  const { node } = draw(fixture("ugly/progress.200-rounds-all-keys.json"));
  const line = textOf(findAll(node, (n) => n.attrs?.class === "weak-line")[0]);
  assert.match(line, /^Keys to practice: \S+( · \S+)+$/);
  assert.ok(!line.includes(","), line); // no bare commas: a comma key is spelled "comma"
  const words = findAll(node, (n) => n.tag === "li").map(textOf);
  assert.ok(
    words.some((w) => w.startsWith("Focus here:") && w.includes("comma")),
    words.join("|"),
  );
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
  const { node } = draw(progress);
  const tiles = findAll(node, (n) => n.attrs?.class === "best-tile").map((t) =>
    t.children.map(textOf),
  );
  assert.deepEqual(tiles, [
    ["Four corners", "30 WPM", ""], // no date, no "set" line
    ["weird", "5 WPM", ""], // an unknown mode shows its own name, never crashes
  ]);
});
