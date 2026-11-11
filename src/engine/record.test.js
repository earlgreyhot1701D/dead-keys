// Req 4: record one finished round into Progress.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { loadSchemas } from "../../contract/schemas.js";
import { validate } from "../../contract/validate.js";
import { vet } from "../storage/vet.js";
import { MAX_ROUNDS, record } from "./record.js";

const DAY = 86_400_000;
const BASE = Date.parse("2026-11-01T12:00:00Z");
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
const fixture = (path) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${path}`, import.meta.url), "utf8")).value;
const fresh = () => ({
  schemaVersion: 1,
  createdAt: 0,
  rounds: [],
  keys: [],
  bests: {},
  dayStreak: { lastDay: null, count: 0 },
  lessonsPassed: [],
  milestones: [],
  settings: {},
  ghosts: [],
});

/** A contract-valid round on day `dayOffset` from BASE. */
function round(i, over = {}) {
  const dayOffset = over.dayOffset ?? 0;
  const { dayOffset: _drop, ...rest } = over;
  return {
    id: `r${i}`,
    date: BASE + dayOffset * DAY + i,
    mode: "falling",
    packId: "mini",
    lessonId: null,
    durationMs: 60000,
    correctChars: 150,
    totalKeystrokes: 160,
    wpm: 30,
    accuracy: 0.95,
    cleared: 10,
    wave: 2,
    keyDeltas: { a: { attempts: 10, misses: 1 }, b: { attempts: 5, misses: 0 } },
    drillSource: null,
    continued: false,
    ...rest,
  };
}
const dayOf = (r) => isoDay(r.date);
const rec = (p, r) => record(p, r, dayOf(r));

/** Freeze deep, so any mutation throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

function assertUsable(p) {
  assert.equal(
    validate("Progress", p).status,
    "valid",
    JSON.stringify(validate("Progress", p).errors),
  );
  assert.deepEqual(vet(p), []);
}

test("one round: keys merged, best set, streak started, milestones added, round appended", () => {
  const r = round(1, { wpm: 34 });
  const after = rec(fresh(), r);
  assertUsable(after);
  assert.deepEqual(after.keys, [
    { key: "a", attempts: 10, misses: 1, lastSeen: r.date },
    { key: "b", attempts: 5, misses: 0, lastSeen: r.date },
  ]);
  assert.deepEqual(after.bests, { falling: { wpm: 34, date: r.date } });
  assert.deepEqual(after.dayStreak, { lastDay: "2026-11-01", count: 1 });
  assert.deepEqual(
    after.milestones.map((m) => m.id),
    ["wpm-10", "wpm-20", "wpm-30"],
  );
  assert.deepEqual(after.rounds, [r]);
});

test("practice counts for the streak and keys, but not for bests or WPM milestones", () => {
  const r = round(1, { mode: "practice", wpm: 90 });
  const after = rec(fresh(), r);
  assertUsable(after);
  assert.deepEqual(after.bests, {});
  assert.deepEqual(after.milestones, []);
  assert.equal(after.dayStreak.count, 1);
  assert.equal(after.keys.length, 2);
  assert.equal(after.rounds.length, 1);
});

test("the day streak is moved before milestones are worked out, so the 7th day awards its card now", () => {
  const p = { ...fresh(), dayStreak: { lastDay: "2026-10-31", count: 6 } };
  const after = rec(p, round(1)); // 2026-11-01, the day after
  assert.equal(after.dayStreak.count, 7);
  assert.ok(after.milestones.some((m) => m.id === "day-streak-7"));
  assertUsable(after);
});

test("a lesson already added to lessonsPassed is awarded at record time", () => {
  const p = { ...fresh(), lessonsPassed: [{ lessonId: "3", how: "lesson" }] };
  assert.ok(
    rec(p, round(1, { wpm: 5, accuracy: 0.5 })).milestones.some((m) => m.id === "lesson-3"),
  );
});

test("milestones already earned are not added again", () => {
  const once = rec(fresh(), round(1, { wpm: 34 }));
  const twice = rec(once, round(2, { wpm: 34 }));
  assert.deepEqual(
    twice.milestones.map((m) => m.id),
    once.milestones.map((m) => m.id),
  );
});

test("a new best is a new bests object; no new best leaves bests as the same object", () => {
  const first = rec(fresh(), round(1, { wpm: 40 }));
  const slower = rec(first, round(2, { wpm: 30 }));
  assert.equal(slower.bests, first.bests);
  const faster = rec(first, round(3, { wpm: 41 }));
  assert.notEqual(faster.bests, first.bests);
  assert.equal(faster.bests.falling.wpm, 41);
});

test("rounds are capped at 200: the oldest are dropped, the newest is last", () => {
  const n = fixture("ugly/progress.200-rounds-all-keys.json");
  assert.equal(n.rounds.length, MAX_ROUNDS);
  const r = round(999, { dayOffset: 40 });
  const after = rec(n, r);
  assert.equal(after.rounds.length, MAX_ROUNDS);
  assert.deepEqual(after.rounds.at(-1), r);
  assert.deepEqual(after.rounds[0], n.rounds[1]);
  assertUsable(after);
});

test("the cap matches the contract", () => {
  assert.equal(MAX_ROUNDS, loadSchemas().get("progress.json").properties.rounds.maxItems);
});

test("the inputs are never changed", () => {
  const p = freeze({ ...fresh(), dayStreak: { lastDay: "2026-10-31", count: 6 } });
  const r = freeze(round(1, { wpm: 34 }));
  rec(p, r);
  const full = freeze(fixture("ugly/progress.200-rounds-all-keys.json"));
  rec(full, freeze(round(5000, { dayOffset: 40 })));
});

test("the same input gives the same output", () => {
  const p = { ...fresh(), dayStreak: { lastDay: "2026-10-31", count: 6 } };
  assert.deepEqual(rec(p, round(1, { wpm: 34 })), rec(p, round(1, { wpm: 34 })));
});

test("recording the same round twice is refused, so its keys are never counted twice", () => {
  const once = rec(fresh(), round(1));
  assert.throws(() => rec(once, round(1)), RangeError);
});

test("malformed input is a programmer error", () => {
  const r = round(1);
  for (const p of [null, undefined, 5, "x", [], {}, { rounds: [] }, { ...fresh(), keys: null }]) {
    assert.throws(
      () => record(p, r, "2026-11-01"),
      (e) => e instanceof TypeError || e instanceof RangeError,
    );
  }
  for (const day of ["2026-02-30", "tomorrow", "", null]) {
    assert.throws(() => record(fresh(), r, day), RangeError);
  }
  assert.throws(() => record(fresh(), null, "2026-11-01"));
});

// Whatever rounds are played, in whatever mix, the save stays valid and within the cap.
const spec = fc.record({
  mode: fc.constantFrom("falling", "corners", "practice", "lesson", "daily"),
  wpm: fc.integer({ min: 0, max: 80 }),
  accuracy: fc.constantFrom(0.5, 0.9, 0.95, 1),
  gap: fc.integer({ min: 0, max: 2 }), // days to move on: same day, next day, or a gap
});

test("random runs of rounds never exceed 200, never break the contract, and keep their promises", () => {
  fc.assert(
    fc.property(fc.array(spec, { maxLength: 260 }), (specs) => {
      let p = fresh();
      let day = 0;
      specs.forEach((s, i) => {
        day += s.gap;
        const r = round(i, { mode: s.mode, wpm: s.wpm, accuracy: s.accuracy, dayOffset: day });
        const before = p;
        p = rec(p, r);
        assert.ok(p.rounds.length <= MAX_ROUNDS);
        assert.equal(p.rounds.at(-1), r);
        assert.ok(p.dayStreak.count >= 1);
        assert.equal(new Set(p.milestones.map((m) => m.id)).size, p.milestones.length);
        assert.ok(p.milestones.length >= before.milestones.length);
        const attempts = (k) => k.reduce((n, x) => n + x.attempts, 0);
        assert.equal(attempts(p.keys), attempts(before.keys) + 15);
      });
      assertUsable(p);
    }),
    { numRuns: 25 },
  );
});
