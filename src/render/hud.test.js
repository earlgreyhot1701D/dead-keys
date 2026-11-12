// HUD values (Req 3.2, 3.3): only true numbers, in the mock's formats.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { LIVES_MAX, WAVE_SIZE } from "../engine/config.js";
import { toResult } from "../engine/result.js";
import { createRound, key } from "../engine/round.js";
import {
  accuracyBar,
  accuracyText,
  CORNERS,
  counts,
  dangerMark,
  dist,
  heartsText,
  hostilesText,
  inDanger,
  LOG_WORDS,
  leftText,
  liveAccuracy,
  livesLabel,
  livesText,
  liveWpm,
  lockBar,
  lockColumn,
  lockParts,
  logWords,
  quadrantText,
  speedText,
  timeText,
  vectorText,
  waveText,
} from "./hud.js";

const items = [{ id: "w1", text: "harbor" }];
const start = (mechanic = "falling") =>
  createRound({ mode: mechanic, mechanic, items, seed: 3, speed: 1 }).state;

test("lives: one heart per life, five at most, filled for lives left", () => {
  assert.equal(LIVES_MAX, 5);
  assert.equal(livesText(5), "[ ♥ ♥ ♥ ♥ ♥ ]");
  assert.equal(livesText(2), "[ ♥ ♥ ♡ ♡ ♡ ]");
  assert.equal(livesText(0), "[ ♡ ♡ ♡ ♡ ♡ ]");
  assert.equal(livesText(9), "[ ♥ ♥ ♥ ♥ ♥ ]");
  assert.equal(heartsText(2), "♥ ♥ ♡ ♡ ♡"); // corners: no brackets, as the mock draws
  assert.equal(livesLabel(2), "2 of 5 lives left");
});

test("the warm-up shows WARM-UP and the warm-up words left (Shara, Nov 12)", () => {
  const s = { wave: 1, clearedThisWave: 0, warmup: 2 };
  assert.equal(waveText(s), "WARM-UP");
  assert.equal(leftText(s), "· 2 LEFT");
  assert.equal(waveText({ ...s, warmup: 0 }), "WAVE 01");
});

test("wave and words left in it", () => {
  const s = { ...start(), wave: 4, clearedThisWave: 3, warmup: 0 };
  assert.equal(waveText(s), "WAVE 04");
  assert.equal(leftText(s), `· ${WAVE_SIZE - 3} LEFT`);
  assert.equal(waveText({ ...s, wave: 12 }), "WAVE 12");
});

test("live WPM and accuracy use the same counts as the round's result", () => {
  let s = start();
  for (const ch of "harbz") s = key(s, ch).state; // four right, one wrong
  s = { ...s, activeMs: 3000 };
  const r = toResult(
    { ...s, ended: true },
    {
      id: "r",
      date: 0,
      packId: "general",
      lessonId: null,
      drillSource: null,
    },
  );
  assert.deepEqual(counts(s), { correct: r.correctChars, total: r.totalKeystrokes });
  assert.equal(liveWpm(s), Math.round(r.wpm));
  assert.equal(liveAccuracy(s), Math.round(r.accuracy * 100));
  assert.equal(liveAccuracy(start()), 0); // no keys yet: the same 0 results would show
  assert.equal(accuracyText(start()), "--"); // ...but the HUD shows "--" until a key is pressed
  assert.equal(accuracyText(s), `${liveAccuracy(s)}%`);
});

test("accuracy bar: ten cells, one per 10%", () => {
  assert.equal(accuracyBar(95), "█████████░"); // as the mock draws 95%
  assert.equal(accuracyBar(85), "████████░░"); // whole tens only
  assert.equal(accuracyBar(0), "░░░░░░░░░░");
  assert.equal(accuracyBar(100), "██████████");
  fc.assert(
    fc.property(fc.integer({ min: -50, max: 150 }), (p) => assert.equal(accuracyBar(p).length, 10)),
  );
});

test("time as m:ss; speed as 0.8×", () => {
  assert.equal(timeText(0), "0:00");
  assert.equal(timeText(72_400), "1:12");
  assert.equal(timeText(600_000), "10:00");
  assert.equal(speedText(0.8), "0.8×");
  assert.equal(speedText(1), "1×");
});

test("the lock: its lane, its typed and remaining parts; nothing when unlocked", () => {
  let s = start();
  assert.equal(lockColumn(s), null);
  assert.equal(vectorText(s), null);
  s = key(key(key(s, "h").state, "a").state, "r").state;
  const t = s.targets.find((x) => x.id === s.lockId);
  assert.equal(lockColumn(s), `LOCK: COLUMN_${t.slot + 1}`);
  assert.deepEqual(lockParts(t), { typed: "har", wrong: "", rest: "bor" });
  assert.equal(lockParts({ ...t, wrong: "x" }).wrong, "x");
  assert.equal(lockBar(t, "LOCKED"), "LOCKED");
  assert.equal(lockBar({ ...t, wrong: "x" }, "LOCKED"), 'TYPE "b" TO FIX');
  const odd = { ...t, text: "A<'b", typed: 1, wrong: "x" };
  assert.equal(lockBar(odd, "LOCKED"), 'TYPE "<" TO FIX'); // shown as text, never markup
  assert.equal(lockBar({ ...odd, typed: 0 }, "LOCKED"), 'TYPE "A" TO FIX');
  assert.equal(
    lockBar({ ...odd, wrong: false }, "LOCKED"),
    "LOCKED",
    "back to normal once cleared",
  );
});

test("danger from 80% of the way: [!], otherwise [·]", () => {
  assert.equal(inDanger({ progress: 0.79 }), false);
  assert.equal(inDanger({ progress: 0.8 }), true);
  assert.equal(dangerMark({ progress: 0.9 }), "[!]");
  assert.equal(dangerMark({ progress: 0.1 }), "[·]");
});

test("corners: distance, hostiles, quadrant names and the locked vector", () => {
  assert.equal(dist({ progress: 0 }), "10");
  assert.equal(dist({ progress: 0.5 }), "05");
  assert.equal(dist({ progress: 0.96 }), "00");
  let s = start("corners");
  assert.equal(hostilesText(s), `HOSTILES ACTIVE: ${String(s.targets.length).padStart(2, "0")}`);
  assert.equal(quadrantText(0, s), "QUADRANT // ALPHA [NW]");
  s = key(s, "h").state;
  const t = s.targets.find((x) => x.id === s.lockId);
  assert.equal(quadrantText(t.slot, s).endsWith(" [LOCKED]"), true);
  assert.equal(vectorText(s), `VECTOR ${CORNERS[t.slot]} // CHAR BUFFER: 1/6`);
  assert.deepEqual(CORNERS, ["NW", "NE", "SW", "SE"]);
});

test("word log: cleared and breached words, the last 8, and every breach counted", () => {
  const before = {
    targets: [
      { id: 1, text: "lantern" },
      { id: 2, text: "quiet" },
    ],
  };
  let log = { words: [], breaches: 0 };
  log = logWords(log, [{ type: "cleared", targetId: 1 }, { type: "miss" }], before);
  log = logWords(log, [{ type: "lifeLost", targetId: 2 }], before);
  assert.deepEqual(log, {
    words: [
      { text: "lantern", cleared: true },
      { text: "quiet", cleared: false },
    ],
    breaches: 1,
  });
  assert.equal(logWords(log, [{ type: "paused" }], before), log, "no words: the same log");
  for (let i = 0; i < 10; i++) log = logWords(log, [{ type: "lifeLost", targetId: 2 }], before);
  assert.equal(log.words.length, LOG_WORDS);
  assert.equal(log.breaches, 11);
});
