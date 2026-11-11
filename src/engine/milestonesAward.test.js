// Req 4.3 to 4.8: awarding milestones (split from milestones.test.js at the line cap).
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { newMilestones } from "./milestones.js";

const DAY = 86_400_000;
const at = (day) => Date.parse(`${day}T12:00:00Z`);
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);
const rnd = (id, day, over = {}) => ({
  id,
  mode: "falling",
  wpm: 5,
  accuracy: 0.5,
  date: at(day),
  ...over,
});
const prog = (rounds = [], over = {}) => ({
  rounds,
  milestones: [],
  lessonsPassed: [],
  dayStreak: { lastDay: null, count: 0 },
  ...over,
});
const run = (progress, result, day = dayOf(result.date)) => newMilestones(progress, result, day);
const ids = (list) => list.map((m) => m.id);

/** Freeze deep, so any mutation throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

test("every WPM band reached is awarded, once each, lowest first", () => {
  const got = run(prog(), rnd("a", "2026-03-01", { wpm: 34, accuracy: 0.95 }));
  assert.deepEqual(ids(got), ["wpm-10", "wpm-20", "wpm-30"]);
  assert.deepEqual(got[2], {
    id: "wpm-30",
    kind: "wpm-band",
    threshold: 30,
    label: "30 words per minute",
  });
  const have = prog([], { milestones: got.slice(0, 2) });
  const next = rnd("b", "2026-03-02", { wpm: 41, accuracy: 1 });
  assert.deepEqual(ids(run(have, next)), ["wpm-30", "wpm-40"]);
});

test("a WPM band needs the 90% accuracy floor: 30 wpm at 40% earns none, exactly 90% does", () => {
  assert.deepEqual(run(prog(), rnd("a", "2026-03-01", { wpm: 30, accuracy: 0.4 })), []);
  assert.deepEqual(run(prog(), rnd("a", "2026-03-01", { wpm: 30, accuracy: 0.8999 })), []);
  const got = run(prog(), rnd("a", "2026-03-01", { wpm: 30, accuracy: 0.9 }));
  assert.deepEqual(ids(got), ["wpm-10", "wpm-20", "wpm-30"]);
});

test("a fast sloppy round does not block a band from a slower, accurate one", () => {
  const sloppy = rnd("a", "2026-03-01", { wpm: 60, accuracy: 0.5 });
  const clean = rnd("b", "2026-03-02", { wpm: 22, accuracy: 0.97 });
  assert.deepEqual(ids(run(prog([sloppy]), clean)), ["wpm-10", "wpm-20"]);
});

test("practice counts toward streaks but not toward WPM bands", () => {
  const practice = (id, accuracy) => rnd(id, "2026-03-01", { mode: "practice", wpm: 90, accuracy });
  const past = [practice("a", 0.96), practice("b", 0.97)];
  assert.deepEqual(ids(run(prog(past), practice("c", 0.99))), ["acc-streak-3"]);
});

test("3 rounds in a row at 95% or better: exactly 95% counts, one dip resets, order is by date", () => {
  const good = (id, day, accuracy = 0.95) => rnd(id, day, { accuracy });
  const three = [good("a", "2026-03-01"), good("b", "2026-03-02")];
  assert.deepEqual(ids(run(prog(three), good("c", "2026-03-03"))), ["acc-streak-3"]);
  const dip = [good("a", "2026-03-01"), good("b", "2026-03-02", 0.9499)];
  assert.deepEqual(run(prog(dip), good("c", "2026-03-03")), []);
  const shuffled = [good("c", "2026-03-03"), good("a", "2026-03-01")];
  assert.deepEqual(ids(run(prog(shuffled), good("b", "2026-03-02"))), ["acc-streak-3"]);
});

test("the 7-day streak is awarded from the saved dayStreak, on the day the count reaches 7", () => {
  const six = prog([], { dayStreak: { lastDay: "2026-01-31", count: 6 } });
  const got = run(six, rnd("a", "2026-02-01"));
  assert.deepEqual(got, [
    { id: "day-streak-7", kind: "day-streak", threshold: 7, label: "7 days in a row" },
  ]);
  assert.deepEqual(run(six, rnd("a", "2026-01-31")), []); // same day: still 6
  assert.deepEqual(run(six, rnd("a", "2026-02-02")), []); // a gap: back to 1
});

test("the streak does not depend on the saved rounds, so the 200-round cap cannot hide it", () => {
  const busy = Array.from({ length: 200 }, (_, i) => rnd(`r${i}`, "2026-02-01"));
  const six = prog(busy, { dayStreak: { lastDay: "2026-01-31", count: 6 } });
  assert.deepEqual(ids(run(six, rnd("new", "2026-02-01"))), ["day-streak-7"]);
  const sevenDaysOfRounds = Array.from({ length: 7 }, (_, i) =>
    rnd(`d${i}`, dayOf(at("2026-01-26") + i * DAY)),
  );
  assert.deepEqual(run(prog(sevenDaysOfRounds), rnd("x", "2026-02-02")), []); // rounds alone earn nothing
});

test("it gives the same answer whether or not the caller already updated the streak", () => {
  const before = prog([], { dayStreak: { lastDay: "2026-01-31", count: 6 } });
  const after = prog([], { dayStreak: { lastDay: "2026-02-01", count: 7 } });
  const r = rnd("a", "2026-02-01");
  assert.deepEqual(run(before, r), run(after, r));
});

test("a streak already awarded is not awarded again, and a longer one adds nothing", () => {
  const card = { id: "day-streak-7", kind: "day-streak", threshold: 7, label: "7 days in a row" };
  const have = prog([], { milestones: [card], dayStreak: { lastDay: "2026-02-01", count: 7 } });
  assert.deepEqual(run(have, rnd("a", "2026-02-02")), []);
});

test("each lesson passed is awarded once, whatever the round's mode", () => {
  const passed = [
    { lessonId: "4", how: "lesson" },
    { lessonId: "2", how: "testout" },
    { lessonId: "4", how: "testout" },
  ];
  const got = run(
    prog([], { lessonsPassed: passed }),
    rnd("a", "2026-03-01", { mode: "practice" }),
  );
  assert.deepEqual(got, [
    { id: "lesson-4", kind: "lesson-passed", threshold: null, label: "Lesson 4 passed" },
    { id: "lesson-2", kind: "lesson-passed", threshold: null, label: "Lesson 2 passed" },
  ]);
  const have = prog([], { lessonsPassed: passed, milestones: [got[0]] });
  assert.deepEqual(ids(run(have, rnd("b", "2026-03-02"))), ["lesson-2"]);
});

test("a round already in progress.rounds is not counted twice", () => {
  const a = rnd("a", "2026-03-01", { accuracy: 0.96 });
  const b = rnd("b", "2026-03-02", { accuracy: 0.96 });
  assert.deepEqual(run(prog([a, b]), b), []); // two rounds, not three
});

test("an absurd WPM stays bounded", () => {
  const got = run(prog(), rnd("a", "2026-03-01", { wpm: 1e9, accuracy: 1 }));
  assert.equal(got.length, 100);
});

test("nothing earned from a quiet first round", () => {
  assert.deepEqual(run(prog(), rnd("a", "2026-03-01", { wpm: 4, accuracy: 0.5 })), []);
});

// Random histories: never a repeat, always valid, nothing about slowing down.
const roundArb = fc.record({
  mode: fc.constantFrom("falling", "corners", "practice", "lesson", "daily"),
  wpm: fc.integer({ min: 0, max: 80 }),
  accuracy: fc.constantFrom(0.5, 0.8999, 0.9, 0.9499, 0.95, 0.99, 1),
  off: fc.integer({ min: 0, max: 12 }),
});
const toRound = (r, i) => ({
  id: `r${i}`,
  mode: r.mode,
  wpm: r.wpm,
  accuracy: r.accuracy,
  date: at("2026-03-01") + r.off * DAY,
});
const lessonsArb = fc
  .subarray(["1", "2", "3"])
  .map((a) => a.map((lessonId) => ({ lessonId, how: "lesson" })));
const streakArb = fc.record({
  off: fc.integer({ min: 0, max: 12 }),
  count: fc.integer({ min: 0, max: 9 }),
});

test("random histories: awarded once, valid, and never about slowing down", () => {
  fc.assert(
    fc.property(
      fc.array(roundArb, { minLength: 1, maxLength: 30 }),
      lessonsArb,
      streakArb,
      (list, lessons, s) => {
        const rounds = list.map(toRound);
        const result = rounds.pop();
        const dayStreak =
          s.count === 0
            ? { lastDay: null, count: 0 }
            : { lastDay: dayOf(at("2026-03-01") + s.off * DAY), count: s.count };
        const progress = freeze(prog(rounds, { lessonsPassed: lessons, dayStreak }));
        const got = run(progress, result);
        assert.equal(new Set(ids(got)).size, got.length);
        for (const m of got) {
          assert.equal(validate("Milestone", m).status, "valid", JSON.stringify(m));
          assert.doesNotMatch(`${m.id} ${m.label}`, /bad|slow|dip|worse|decline/i);
        }
        assert.deepEqual(run({ ...progress, milestones: got }, result), []); // nothing awarded twice
        assert.deepEqual(got, run(progress, result)); // same input, same output
      },
    ),
  );
});

test("malformed input is a programmer error", () => {
  const ok = rnd("a", "2026-03-01");
  const bad =
    (p, r = ok, day = "2026-03-01") =>
    () =>
      newMilestones(p, r, day);
  assert.throws(bad(null), TypeError);
  assert.throws(bad({ rounds: [] }), TypeError);
  assert.throws(bad({ ...prog(), dayStreak: null }), TypeError);
  for (const day of ["2026-02-30", "2026-13-01", "2027-02-29", "tomorrow", ""]) {
    assert.throws(bad(prog(), ok, day), RangeError, day);
  }
  assert.throws(bad(prog(), { ...ok, accuracy: 2 }), RangeError);
  assert.throws(bad(prog([{ id: "x" }])), RangeError);
});
