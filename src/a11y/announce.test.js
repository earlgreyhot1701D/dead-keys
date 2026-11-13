// The live region's lines during play (Req 6.3): exactly the copy table's six, nothing else.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { announce, announceAll, SPOKEN_BY_DIALOG } from "./announce.js";

const before = { targets: [{ id: 7, text: "harbor" }] };
const after = { lives: 3, targets: [] };

test("each of the six lines, word for word", () => {
  assert.equal(announce({ type: "cleared", targetId: 7 }, before, after), "Cleared harbor.");
  assert.equal(announce({ type: "lifeLost", targetId: 7 }, before, after), "Life lost. 3 left.");
  assert.equal(announce({ type: "waveUp", wave: 4 }, before, after), "Wave 4.");
  assert.equal(announce({ type: "warmupDone" }, before, after), "Warm-up done. Wave 1.");
  assert.equal(announce({ type: "outOfLives" }, before, after), "Out of lives.");
  assert.equal(announce({ type: "paused" }, before, after), "Paused.");
});

test("they are the copy table's live-region row", () => {
  const design = readFileSync(new URL("../../.kiro/specs/play/design.md", import.meta.url), "utf8");
  const row = design.split("\n").find((l) => l.startsWith("| Live region |"));
  assert.equal(
    row.split("|")[2].trim(),
    "Cleared <word>. / Life lost. <n> left. / Wave <n>. / Warm-up done. Wave 1. / Out of lives. / Paused.",
  );
});

test("keystrokes, misses, locks and everything else are never spoken", () => {
  for (const type of [
    "miss",
    "locked",
    "unlocked",
    "resumed",
    "continued",
    "ended",
    "warmupLanded",
    "nope",
  ]) {
    assert.equal(announce({ type, targetId: 7 }, before, after), null, type);
  }
  assert.equal(announce(null, before, after), null);
  assert.equal(announce({ type: "cleared", targetId: 99 }, before, after), null); // unknown word
});

test("one step: lines in order, and several lives lost say the count left once", () => {
  const events = [
    { type: "cleared", targetId: 7 },
    { type: "miss" },
    { type: "lifeLost", targetId: 1 },
    { type: "lifeLost", targetId: 2 },
    { type: "outOfLives" },
  ];
  // "Out of lives." is left to its dialog's title (Block 8a, Req 10.3).
  assert.deepEqual(announceAll(events, before, { lives: 0 }), [
    "Cleared harbor.",
    "Life lost. 0 left.",
  ]);
  assert.deepEqual(announceAll([], before, after), []);
});

test('"Paused." and "Out of lives." are spoken once, by their dialog, not also the live region', () => {
  assert.deepEqual([...SPOKEN_BY_DIALOG], ["paused", "outOfLives"]);
  assert.deepEqual(announceAll([{ type: "paused" }], before, after), []);
  assert.deepEqual(announceAll([{ type: "outOfLives" }], before, after), []);
  assert.deepEqual(announceAll([{ type: "waveUp", wave: 2 }, { type: "paused" }], before, after), [
    "Wave 2.",
  ]);
});
