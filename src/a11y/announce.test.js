// The live region's lines during play (Req 6.3): exactly the copy table's five, nothing else.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { announce, announceAll } from "./announce.js";

const before = { targets: [{ id: 7, text: "harbor" }] };
const after = { lives: 3, targets: [] };

test("each of the five lines, word for word", () => {
  assert.equal(announce({ type: "cleared", targetId: 7 }, before, after), "Cleared harbor.");
  assert.equal(announce({ type: "lifeLost", targetId: 7 }, before, after), "Life lost. 3 left.");
  assert.equal(announce({ type: "waveUp", wave: 4 }, before, after), "Wave 4.");
  assert.equal(announce({ type: "outOfLives" }, before, after), "Out of lives.");
  assert.equal(announce({ type: "paused" }, before, after), "Paused.");
});

test("they are the copy table's live-region row", () => {
  const design = readFileSync(new URL("../../.kiro/specs/play/design.md", import.meta.url), "utf8");
  const row = design.split("\n").find((l) => l.startsWith("| Live region |"));
  assert.equal(
    row.split("|")[2].trim(),
    "Cleared <word>. / Life lost. <n> left. / Wave <n>. / Out of lives. / Paused.",
  );
});

test("keystrokes, misses, locks and everything else are never spoken", () => {
  for (const type of ["miss", "locked", "unlocked", "resumed", "continued", "ended", "nope"]) {
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
  assert.deepEqual(announceAll(events, before, { lives: 0 }), [
    "Cleared harbor.",
    "Life lost. 0 left.",
    "Out of lives.",
  ]);
  assert.deepEqual(announceAll([], before, after), []);
});
