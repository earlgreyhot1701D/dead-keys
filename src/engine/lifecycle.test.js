// Req 3.3, 3.4 and Req 5: time, lives, wave up, the free continue, practice, ending.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BASE_TRAVEL_MS, LIVES_MAX } from "./config.js";
import { endRound, resolveOutOfLives, resume, tick } from "./lifecycle.js";
import { createRound, key, pressEscape } from "./round.js";

const items = [
  { id: "i1", text: "ab" },
  { id: "i2", text: "cd" },
  { id: "i3", text: "ef" },
  { id: "i4", text: "Ag" },
];
const opts = (over = {}) => ({
  mode: "falling",
  mechanic: "falling",
  items,
  seed: 7,
  speed: 1,
  ...over,
});

/** Freeze deep, so any mutation by the engine throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

/** A round with hand-placed targets and any state overrides. */
function round(list, over = {}, o = {}) {
  const { state } = createRound(opts(o));
  const targets = list.map(([id, text, progress], i) => ({
    id,
    itemId: `x${id}`,
    text,
    typed: 0,
    progress,
    slot: i,
  }));
  return freeze({ ...state, targets, nextId: 100, warmup: 0, ...over }); // past the warm-up
}

test("time moves targets by the travel formula and adds to activeMs", () => {
  const r = tick(round([[0, "ab", 0]]), BASE_TRAVEL_MS / 2);
  assert.equal(r.state.targets.find((t) => t.id === 0).progress, 0.5);
  assert.equal(r.state.activeMs, BASE_TRAVEL_MS / 2);
  assert.deepEqual(r.events, []);
});

test("a target reaching danger is removed, takes a life, releases the lock; a new word comes", () => {
  const s = round([[0, "ab", 0.99]], { lockId: 0 });
  const r = tick(s, 1000);
  assert.deepEqual(r.events, [{ type: "lifeLost", targetId: 0 }]);
  assert.equal(r.state.lives, LIVES_MAX - 1);
  assert.equal(r.state.lockId, null);
  assert.equal(
    r.state.targets.some((t) => t.id === 0),
    false,
  );
  assert.equal(r.state.targets.length, 1); // the spawn gap passed during the tick: one new word
});

test("a lock on another target is kept when a different target arrives", () => {
  const s = round(
    [
      [0, "ab", 0.99],
      [1, "cd", 0.1],
    ],
    { lockId: 1 },
  );
  assert.equal(tick(s, 1000).state.lockId, 1);
});

test("two targets arriving together take two lives", () => {
  const r = tick(
    round([
      [0, "ab", 0.99],
      [1, "cd", 0.995],
    ]),
    1000,
  );
  assert.equal(r.state.lives, LIVES_MAX - 2);
  assert.equal(r.events.filter((e) => e.type === "lifeLost").length, 2);
});

test("paused time does not count: pause freezes targets and the clock", () => {
  let s = round([[0, "ab", 0.2]]);
  s = tick(s, 1000).state;
  s = pressEscape(s).state;
  const frozen = tick(s, 5000);
  assert.equal(frozen.state, s);
  assert.deepEqual(frozen.events, []);
  s = pressEscape(s).state;
  s = tick(s, 1000).state;
  assert.equal(s.activeMs, 2000);
});

test("resume ends a pause and emits resumed; it is ignored when not paused", () => {
  const s = round([[0, "ab", 0.2]]);
  const paused = pressEscape(s).state;
  const r = resume(paused);
  assert.deepEqual(r.events, [{ type: "resumed" }]);
  assert.deepEqual(r.state, s);
  assert.equal(resume(s).state, s);
});

test("out of lives holds the round: no movement, no keys, no Escape, no more time", () => {
  const s = round([[0, "ab", 0.99]], { lives: 1 });
  const r = tick(s, 1000);
  assert.deepEqual(r.events, [{ type: "lifeLost", targetId: 0 }, { type: "outOfLives" }]);
  assert.equal(r.state.held, true);
  assert.equal(r.state.lives, 0);
  const h = r.state;
  assert.equal(tick(h, 1000).state, h);
  assert.equal(key(h, "a").state, h);
  assert.equal(pressEscape(h).state, h);
  assert.equal(resume(h).state, h);
});

test("continue refills lives, keeps score, wave and cleared count, and starts a fresh screen", () => {
  const held = tick(
    round([[0, "ab", 0.99]], { lives: 1, cleared: 12, wave: 3, clearedThisWave: 4, activeMs: 500 }),
    1000,
  ).state;
  const r = resolveOutOfLives(held, true);
  assert.deepEqual(r.events, [{ type: "continued" }]);
  const s = r.state;
  assert.equal(s.lives, LIVES_MAX);
  assert.equal(s.continueUsed, true);
  assert.equal(s.held, false);
  assert.equal(s.ended, false);
  assert.equal([s.cleared, s.wave, s.clearedThisWave].join(), "12,3,4");
  assert.equal(s.activeMs, held.activeMs);
  assert.ok(s.targets.length > 0 && s.targets.every((t) => t.progress === 0 && t.typed === 0));
  assert.equal(s.lockId, null);
  assert.equal(tick(s, 100).state.activeMs, held.activeMs + 100);
});

test("decline ends the round", () => {
  const held = tick(round([[0, "ab", 0.99]], { lives: 1 }), 1000).state;
  const r = resolveOutOfLives(held, false);
  assert.deepEqual(r.events, [{ type: "ended" }]);
  assert.equal(r.state.ended, true);
  assert.equal(r.state.held, false);
});

test("continue used, then out of lives again: the round ends, no second hold", () => {
  const s = round([[0, "ab", 0.99]], { lives: 1, continueUsed: true });
  const r = tick(s, 1000);
  assert.deepEqual(r.events, [{ type: "lifeLost", targetId: 0 }, { type: "ended" }]);
  assert.equal(r.state.ended, true);
  assert.equal(r.state.held, false);
});

test("resolveOutOfLives is ignored unless the round is held", () => {
  const s = round([[0, "ab", 0.2]]);
  assert.equal(resolveOutOfLives(s, true).state, s);
  assert.equal(resolveOutOfLives(s, false).state, s);
});

test("practice: targets never move, no lives are lost, time still counts, only endRound ends", () => {
  const s = round([[0, "ab", 0.3]], {}, { mode: "practice" });
  let r = tick(s, 1e9);
  assert.equal(r.state.targets[0].progress, 0.3);
  assert.equal(r.state.lives, LIVES_MAX);
  assert.equal(r.state.activeMs, 1e9);
  assert.equal(r.state.ended, false);
  assert.deepEqual(r.events, []);
  r = endRound(r.state);
  assert.deepEqual(r.events, [{ type: "ended" }]);
  assert.equal(r.state.ended, true);
});

test("endRound works from any state and is idempotent; an ended round ignores everything", () => {
  const paused = pressEscape(round([[0, "ab", 0.2]])).state;
  const ended = endRound(paused).state;
  assert.equal(ended.ended, true);
  assert.equal(ended.paused, false);
  assert.equal(endRound(ended).state, ended);
  assert.equal(tick(ended, 1000).state, ended);
  assert.equal(key(ended, "a").state, ended);
  assert.equal(pressEscape(ended).state, ended);
  assert.equal(resume(ended).state, ended);
  assert.equal(resolveOutOfLives(ended, true).state, ended);
  const held = tick(round([[0, "ab", 0.99]], { lives: 1 }), 1000).state;
  assert.equal(endRound(held).state.ended, true);
});

test("wave up: the tenth clear starts the next wave and gives a life back", () => {
  const s = round([[0, "a", 0.5]], { clearedThisWave: 9, cleared: 9, lives: 3, spawnWaitMs: 0 });
  const r = key(s, "a");
  assert.deepEqual(r.events, [
    { type: "locked", targetId: 0 },
    { type: "cleared", targetId: 0 },
    { type: "waveUp", wave: 2 },
  ]);
  assert.equal(r.state.wave, 2);
  assert.equal(r.state.clearedThisWave, 0);
  assert.equal(r.state.cleared, 10);
  assert.equal(r.state.lives, 4);
  assert.equal(r.state.targets.length, 1); // one at once; the rest come a spawn gap apart
});

test("wave up never gives more than the maximum lives", () => {
  const s = round([[0, "a", 0.5]], { clearedThisWave: 9, lives: LIVES_MAX });
  assert.equal(key(s, "a").state.lives, LIVES_MAX);
});

test("clears before the wave size do not start a wave", () => {
  const s = round([[0, "a", 0.5]], { clearedThisWave: 8, lives: 3 });
  const r = key(s, "a");
  assert.equal(r.state.wave, 1);
  assert.equal(r.state.lives, 3);
  assert.equal(
    r.events.some((e) => e.type === "waveUp"),
    false,
  );
});

test("practice has no waves: clears are counted but nothing waves up", () => {
  const s = round([[0, "a", 0.5]], { clearedThisWave: 9 }, { mode: "practice" });
  const r = key(s, "a");
  assert.equal(r.state.wave, 1);
  assert.equal(r.state.cleared, 1);
  assert.equal(
    r.events.some((e) => e.type === "waveUp"),
    false,
  );
});

test("bad time is a programmer error, even when the round is paused", () => {
  const paused = pressEscape(round([[0, "ab", 0.2]])).state;
  for (const dt of [-1, Number.NaN, Number.POSITIVE_INFINITY, "5"]) {
    assert.throws(() => tick(paused, dt), RangeError);
  }
});
