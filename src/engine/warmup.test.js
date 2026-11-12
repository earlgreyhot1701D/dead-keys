// The warm-up (Shara, Nov 12): Falling words and Four corners open with WARMUP_WORDS slow words,
// one at a time. A warm-up word that lands costs no life, and none counts toward wave 1.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BASE_TRAVEL_MS, LIVES_MAX, TARGETS_START, WARMUP_SLOW, WARMUP_WORDS } from "./config.js";
import { tick } from "./lifecycle.js";
import { createRound, key } from "./round.js";
import { advance } from "./targets.js";

const items = ["ab", "cd", "ef", "gh", "ij", "kl"].map((text, i) => ({ id: `i${i}`, text }));
const start = (mode = "falling") =>
  createRound({
    mode,
    mechanic: mode === "corners" ? "corners" : "falling",
    items,
    seed: 3,
    speed: 1,
  }).state;
/** Type the one word on screen. */
const clearOne = (s) => {
  let r = { state: s, events: [] };
  for (const c of s.targets[0].text) r = key(r.state, c);
  return r;
};

test("the arcade modes start with the warm-up; practice does not", () => {
  assert.equal(start().warmup, WARMUP_WORDS);
  assert.equal(start("corners").warmup, WARMUP_WORDS);
  assert.equal(start("practice").warmup, 0);
});

test("one word at a time during the warm-up, however long you wait", () => {
  const s = tick(start(), 2000).state;
  assert.equal(s.targets.length, 1);
});

test("a warm-up word moves at WARMUP_SLOW of the round's speed", () => {
  const s = start();
  const p = (state) => advance(state, 100).state.targets[0].progress;
  assert.ok(Math.abs(p(s) - (100 * WARMUP_SLOW) / BASE_TRAVEL_MS) < 1e-12);
  assert.ok(Math.abs(p({ ...s, warmup: 0 }) - 100 / BASE_TRAVEL_MS) < 1e-12);
});

test("a warm-up word that lands costs no life and counts the warm-up down", () => {
  const travel = BASE_TRAVEL_MS / WARMUP_SLOW;
  const r = tick(start(), travel);
  assert.equal(r.state.lives, LIVES_MAX);
  assert.equal(r.state.warmup, WARMUP_WORDS - 1);
  assert.equal(r.events[0].type, "warmupLanded");
  assert.ok(!r.events.some((e) => e.type === "lifeLost"));
  assert.equal(r.state.targets.length, 1, "the next warm-up word comes");
});

test("a cleared warm-up word counts as cleared but not toward wave 1", () => {
  const r = clearOne(start());
  assert.equal(r.state.cleared, 1);
  assert.equal(r.state.clearedThisWave, 0);
  assert.equal(r.state.warmup, WARMUP_WORDS - 1);
});

test("after the last warm-up word: warmupDone once, then wave 1's full limit", () => {
  let s = start();
  const seen = [];
  for (let i = 0; i < WARMUP_WORDS; i++) {
    if (s.targets.length === 0) s = tick(s, 1000).state; // the next word, after the spawn gap
    const r = clearOne(s);
    seen.push(...r.events.map((e) => e.type));
    s = r.state;
  }
  assert.equal(seen.filter((t) => t === "warmupDone").length, 1);
  assert.equal(s.warmup, 0);
  assert.equal(s.wave, 1);
  for (let i = 0; i < TARGETS_START; i++) s = tick(s, 1000).state;
  assert.equal(s.targets.length, TARGETS_START);
});
