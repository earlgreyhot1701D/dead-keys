// Req 4.1, 4.2, 4.4: personal bests. (newMilestones tests are added below in task 7.)
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { updateBests } from "./milestones.js";
import { BEST_ACCURACY } from "./progressConfig.js";

const modes = ["corners", "falling", "practice", "lesson", "testout", "daily", "specwave"];
const round = (mode, wpm, accuracy, date = 100) => ({ mode, wpm, accuracy, date });

/** Freeze deep, so any mutation throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

/** A minimal valid Progress around some bests, to run them through the contract. */
const progressWith = (bests) => ({
  schemaVersion: 1,
  createdAt: 0,
  rounds: [],
  keys: [],
  bests,
  dayStreak: { lastDay: null, count: 0 },
  lessonsPassed: [],
  milestones: [],
  settings: {},
  ghosts: [],
});

const anyRound = fc.record({
  mode: fc.constantFrom(...modes),
  wpm: fc.oneof(fc.integer({ min: 0, max: 150 }), fc.double({ min: 0, max: 150, noNaN: true })),
  accuracy: fc.oneof(
    fc.double({ min: 0, max: 1, noNaN: true }),
    fc.constantFrom(0, 1, BEST_ACCURACY, 0.89999),
  ),
  date: fc.nat(1_000_000),
});

/** What a best should be, worked out the slow way. */
function expected(rounds) {
  const out = {};
  for (const r of rounds) {
    const qualifies = r.mode !== "practice" && r.accuracy >= BEST_ACCURACY && r.wpm > 0;
    if (qualifies && (!(r.mode in out) || r.wpm > out[r.mode].wpm)) {
      out[r.mode] = { wpm: r.wpm, date: r.date };
    }
  }
  return out;
}

test("bests follow the rules over any run of rounds, and the result passes the contract", () => {
  fc.assert(
    fc.property(fc.array(anyRound, { maxLength: 40 }), (rounds) => {
      let bests = {};
      rounds.forEach((r, i) => {
        const before = bests;
        const got = updateBests(freeze(before), r);
        bests = got.bests;
        const wasBetter = expected(rounds.slice(0, i))[r.mode];
        const qualifies = r.mode !== "practice" && r.accuracy >= BEST_ACCURACY && r.wpm > 0;
        assert.equal(got.newBest, qualifies && (!wasBetter || r.wpm > wasBetter.wpm));
        if (!got.newBest) assert.equal(got.bests, before);
      });
      assert.deepEqual(bests, expected(rounds));
      assert.equal(validate("Progress", progressWith(bests)).status, "valid");
    }),
  );
});

test("practice never sets a best, however fast", () => {
  const r = updateBests({}, round("practice", 120, 1));
  assert.equal(r.newBest, false);
  assert.deepEqual(r.bests, {});
});

test("under 90% accuracy never sets a best; exactly 90% can", () => {
  assert.equal(updateBests({}, round("falling", 80, 0.8999)).newBest, false);
  assert.equal(updateBests({}, round("falling", 80, 0.9)).newBest, true);
});

test("a tie is not a new best, and the older date is kept", () => {
  const bests = { falling: { wpm: 40, date: 10 } };
  const r = updateBests(bests, round("falling", 40, 1, 99));
  assert.equal(r.newBest, false);
  assert.equal(r.bests, bests);
});

test("a faster round replaces the best, with its own date", () => {
  const r = updateBests({ falling: { wpm: 40, date: 10 } }, round("falling", 41, 0.95, 99));
  assert.equal(r.newBest, true);
  assert.deepEqual(r.bests, { falling: { wpm: 41, date: 99 } });
});

test("a slower round leaves the best alone: nothing is reported for getting slower", () => {
  const bests = { falling: { wpm: 40, date: 10 } };
  const r = updateBests(bests, round("falling", 20, 1));
  assert.deepEqual(r, { bests, newBest: false });
});

test("each mode has its own best", () => {
  const first = updateBests({}, round("falling", 40, 1)).bests;
  const second = updateBests(first, round("corners", 25, 1)).bests;
  assert.deepEqual(second, { falling: { wpm: 40, date: 100 }, corners: { wpm: 25, date: 100 } });
});

test("a round with no speed (0 wpm) never sets a best", () => {
  assert.equal(updateBests({}, round("falling", 0, 1)).newBest, false);
});

test("a mode named like an inherited property is treated as a new mode", () => {
  const r = updateBests({}, round("constructor", 30, 1));
  assert.equal(r.newBest, true);
  assert.equal(Object.hasOwn(r.bests, "constructor"), true);
});

test("malformed input is a programmer error", () => {
  assert.throws(() => updateBests(null, round("falling", 1, 1)), TypeError);
  assert.throws(() => updateBests([], round("falling", 1, 1)), TypeError);
  for (const bad of [
    null,
    {},
    round("", 1, 1),
    round("falling", -1, 1),
    round("falling", Number.NaN, 1),
    round("falling", 1, 1.5),
    round("falling", 1, -0.1),
    round("falling", 1, 1, -1),
    round("falling", 1, 1, 1.5),
  ]) {
    assert.throws(() => updateBests({}, bad), RangeError);
  }
});
