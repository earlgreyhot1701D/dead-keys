// Results (Req 7.2 to 7.5): the round's own numbers, the copy table's words, the pill only when
// faster, new best and milestones or "No new records", the continue line, the word log, the
// save status, and the keys (Enter plays the same mode again, Escape goes to the main menu).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CHARS_PER_WORD } from "../../engine/config.js";
import { MAIN_MENU } from "../components/chrome.js";
import {
  BREAKDOWN_EXPLAIN,
  CONTINUE_USED,
  fasterBy,
  fasterLine,
  missedText,
  NO_RECORDS,
  newBestLine,
  STAT_EXPLAIN,
  topBandOnly,
} from "../components/resultsPanels.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { chooseRound, nextRound, roundItems } from "./play.js";
import { HOW_LINK, overLine, resultsScreen, SHARE, showResults } from "./results.js";

const ACCURACY_BAR = "Accuracy bar"; // the copy table's name for the bar panel (Req 10.1)

const design = readFileSync(
  new URL("../../../.kiro/specs/play/design.md", import.meta.url),
  "utf8",
);
const row = (prefix) => design.split("\n").find((l) => l.startsWith(prefix));

const result = (over = {}) => ({
  id: "round-1",
  date: 0,
  mode: "falling",
  packId: "general",
  lessonId: null,
  durationMs: 72000,
  correctChars: 380,
  totalKeystrokes: 396,
  wpm: 38.2,
  accuracy: 0.96,
  cleared: 41,
  wave: 4,
  keyDeltas: {
    a: { attempts: 40, misses: 9 },
    q: { attempts: 5, misses: 4 },
    s: { attempts: 9, misses: 3 },
  },
  drillSource: null,
  continued: false,
  ...over,
});
const outcome = (over = {}) => ({
  recorded: true,
  saved: true,
  newBest: null,
  milestones: [],
  previous: null,
  ...over,
});
const words = [
  { text: "lantern", cleared: true },
  { text: "quiet", cleared: false },
];

function draw(data) {
  showResults({ result: result(), log: { words, breaches: 1 }, outcome: outcome(), ...data });
  const log = [];
  let node;
  const ctx = {
    state: { persist: true },
    go: (id) => log.push(["go", id]),
    replace: (id) => log.push(["replace", id]),
    announce: (t) => log.push(["say", t]),
  };
  withFakeDocument(() => {
    node = resultsScreen.render(ctx);
  });
  return { node, log, ctx, text: textOf(node) };
}

test("every new word is the copy table's, word for word", () => {
  const ex = row("| Results stat explanations");
  for (const [k, label] of [
    ["wpm", "WPM"],
    ["accuracy", "Accuracy"],
    ["cleared", "Cleared"],
    ["time", "Time"],
  ])
    assert.ok(ex.includes(`${label}: "${STAT_EXPLAIN[k]}"`), k);
  assert.ok(STAT_EXPLAIN.wpm.includes(`Every ${CHARS_PER_WORD} correct letters`));
  const bd = row("| Results breakdown explanations");
  for (const v of Object.values(BREAKDOWN_EXPLAIN)) assert.ok(bd.includes(`"${v}"`), v);
  assert.ok(row("| Results, faster").includes(`"${fasterLine("<n>", "<mode>")}"`));
  assert.ok(row("| Results link under the stats").includes(`"${HOW_LINK}"`));
  assert.ok(row("| Results, no records").includes(NO_RECORDS));
  assert.ok(row("| Results, continue used").includes(CONTINUE_USED));
  const best = row("| Results, new best");
  assert.ok(
    best.includes(newBestLine("<n>", "<m>")) && best.includes(`"${newBestLine("<n>", null)}"`),
  );
  assert.ok(row("| Share card button").includes(SHARE));
});

test("the round's own numbers, mode and wave, with every explanation always on the page", () => {
  const { node, text } = draw();
  assert.equal(textOf(findAll(node, (n) => n.tag === "h1")[0]), "DEAD KEYS // ROUND RESULTS");
  for (const s of [
    "38",
    "96%",
    "41",
    "1:12",
    "MODE: FALLING // PACK: GENERAL",
    "ROUND_OVER // WAVE_04_REACHED",
  ])
    assert.ok(text.includes(s), s);
  for (const s of [...Object.values(STAT_EXPLAIN), BREAKDOWN_EXPLAIN.breaches])
    assert.ok(text.includes(s), s);
  for (const s of ["396", "380", "16 [TOP: a, q]", "01"]) assert.ok(text.includes(s), s);
  assert.equal(overLine(result({ mode: "practice", wave: 0 })), "ROUND_OVER // PRACTICE");
  assert.ok(
    draw({ result: result({ mode: "corners" }) }).text.includes(BREAKDOWN_EXPLAIN.breachesCorners),
  );
});

test("the faster pill shows only when faster than the last round in this mode", () => {
  assert.equal(fasterBy(result(), null), 0);
  assert.equal(fasterBy(result(), { wpm: 34 }), 4);
  assert.equal(fasterBy(result(), { wpm: 40 }), 0);
  assert.ok(
    draw({ outcome: outcome({ previous: { wpm: 34 } }) }).text.includes(fasterLine(4, "falling")),
  );
  assert.ok(
    !draw({ outcome: outcome({ previous: { wpm: 40 } }) }).text.includes("WPM over your last"),
  );
});

test("new best and milestones, or no new records; the continue line only when used", () => {
  const none = draw().text;
  assert.ok(none.includes(NO_RECORDS) && !none.includes(CONTINUE_USED));
  const got = draw({
    result: result({ continued: true }),
    outcome: outcome({
      newBest: { wpm: 38.2, old: 35 },
      milestones: [{ label: "30 words per minute" }],
    }),
  }).text;
  assert.ok(got.includes("New best: 38 WPM. Your old best was 35."));
  assert.ok(got.includes("MILESTONE: 30 words per minute"));
  assert.ok(got.includes(CONTINUE_USED) && !got.includes(NO_RECORDS));
  assert.ok(
    draw({ outcome: outcome({ newBest: { wpm: 38, old: null } }) }).text.includes(
      "New best: 38 WPM.",
    ),
  );
});

test("word log, more cleared, and the save status says what really happened", () => {
  const { text } = draw();
  assert.ok(text.includes("[·] lantern") && text.includes("CLEARED"));
  assert.ok(text.includes("[!] quiet") && text.includes("BREACHED"));
  assert.ok(text.includes("+ 40 more cleared"));
  assert.ok(text.includes("STATUS: SAVED IN THIS BROWSER"));
  const off = draw({ outcome: outcome({ saved: false }) }).text;
  assert.ok(off.includes("STATUS: NOT SAVING") && off.includes("NOT SAVING"));
  assert.equal(missedText(result({ totalKeystrokes: 10, correctChars: 10, keyDeltas: {} })), "0");
});

test("Enter plays the same mode again, Escape goes to the menu; Share card is not built yet", () => {
  for (const [mode, screen] of [
    ["corners", "round"],
    ["practice", "practice"],
  ]) {
    const { log, ctx } = draw({ result: result({ mode }) });
    assert.equal(resultsScreen.onKey(ctx, { key: "Enter", target: { tagName: "BODY" } }), true);
    assert.deepEqual(log, [["replace", screen]]);
    assert.equal(nextRound().mode, mode);
  }
  const { log, ctx, node } = draw();
  assert.equal(resultsScreen.onKey(ctx, { key: "Enter", target: { tagName: "BUTTON" } }), false);
  assert.equal(resultsScreen.onKey(ctx, { key: "Escape" }), true);
  assert.deepEqual(log, [["go", "menu"]]);
  const share = findAll(node, (n) => n.tag === "button" && textOf(n) === SHARE)[0];
  assert.equal(share.attrs["aria-disabled"], "true");
  share.click();
  assert.deepEqual(log.at(-1), ["say", "Share card: not built yet"]);
  const how = findAll(node, (n) => n.tag === "button" && textOf(n) === HOW_LINK)[0];
  how.click();
  assert.deepEqual(log.at(-1), ["go", "howWeCount"]);
});

test("a Main menu button sits in the header, top right, and opens the menu (Shara, Nov 12)", () => {
  const { node, log } = draw();
  const head = findAll(node, (n) => n.tag === "header")[0];
  const b = findAll(head, (n) => n.tag === "button")[0];
  assert.equal(textOf(b), MAIN_MENU);
  b.listeners.click();
  assert.deepEqual(log, [["go", "menu"]]);
});

test("Block 8a carry-ins: the h1 sits inside <main>, and the two accuracy regions have their own names", () => {
  const { node } = draw();
  const main = findAll(node, (n) => n.tag === "main");
  assert.equal(main.length, 1);
  assert.equal(findAll(main[0], (n) => n.tag === "h1").length, 1, "Req 10.1");
  const lessons = readFileSync(
    new URL("../../../.kiro/specs/lessons/design.md", import.meta.url),
    "utf8",
  );
  assert.ok(
    lessons.includes(`panel's name becomes \`${ACCURACY_BAR}\` (the tile stays \`Accuracy\`)`),
  );
  const names = findAll(node, (n) => n.attrs?.["aria-label"]).map((n) => n.attrs["aria-label"]);
  assert.ok(names.includes(ACCURACY_BAR) && names.includes("ACCURACY"));
  const lower = names.map((n) => n.toLowerCase());
  assert.equal(new Set(lower).size, lower.length, "no two regions share a name");
});

test("a round that earns several WPM bands shows only the highest one (Req 10.2)", () => {
  const band = (w) => ({
    id: `wpm-${w}`,
    kind: "wpm-band",
    threshold: w,
    label: `${w} words per minute`,
  });
  const streak = { id: "acc-streak-3", kind: "accuracy-streak", threshold: 3, label: "3 rounds" };
  const earned = [band(10), band(20), band(30), streak];
  assert.deepEqual(topBandOnly(earned), [band(30), streak]);
  assert.deepEqual(topBandOnly([streak]), [streak]);
  const { text } = draw({ outcome: outcome({ milestones: earned }) });
  assert.ok(text.includes("MILESTONE: 30 words per minute"));
  assert.ok(!text.includes("MILESTONE: 10 words") && !text.includes("MILESTONE: 20 words"));
});

test("Play again after Play these keys keeps the same words", () => {
  const items = [{ id: "L01-k1", text: "sad", kind: "word", source: "lesson" }];
  chooseRound("practice", items);
  const { log, ctx } = draw({ result: result({ mode: "practice" }) });
  resultsScreen.onKey(ctx, { key: "Enter", target: { tagName: "BODY" } });
  assert.deepEqual(log, [["replace", "round"]]);
  assert.equal(nextRound().items, items);
  chooseRound("practice");
  assert.equal(roundItems(), null);
});
