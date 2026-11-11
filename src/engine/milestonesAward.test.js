// Req 4.3 to 4.7: awarding milestones (split from milestones.test.js at the line cap).
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
  ...over,
});
const run = (progress, result) => newMilestones(progress, result, dayOf(result.date), dayOf);
const ids = (list) => list.map((m) => m.id);

/** Freeze deep, so any mutation throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

/** Consecutive days from a start, one round each (the last one is the new round). */
function streakOf(start, n, over = {}) {
  const rounds = Array.from({ length: n }, (_, i) =>
    rnd(`r${i}`, dayOf(at(start) + i * DAY), over),
  );
  return { past: rounds.slice(0, -1), last: rounds.at(-1) };
}

test("every WPM band reached is awarded, once each, lowest first", () => {
  const got = run(prog(), rnd("a", "2026-03-01", { wpm: 34 }));
  assert.deepEqual(ids(got), ["wpm-10", "wpm-20", "wpm-30"]);
  assert.deepEqual(got[2], {
    id: "wpm-30",
    kind: "wpm-band",
    threshold: 30,
    label: "30 words per minute",
  });
  const have = prog([], { milestones: got.slice(0, 2) });
  assert.deepEqual(ids(run(have, rnd("b", "2026-03-02", { wpm: 41 }))), ["wpm-30", "wpm-40"]);
});

test("practice counts toward streaks but not toward WPM bands", () => {
  const past = [rnd("a", "2026-03-01", { mode: "practice", wpm: 90, accuracy: 0.96 })];
  past.push(rnd("b", "2026-03-01", { mode: "practice", wpm: 90, accuracy: 0.97 }));
  const last = rnd("c", "2026-03-01", { mode: "practice", wpm: 90, accuracy: 0.99 });
  assert.deepEqual(ids(run(prog(past), last)), ["acc-streak-3"]);
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

test("7 days in a row, across a month end, a year end and a leap day", () => {
  for (const start of ["2026-01-28", "2026-12-29", "2028-02-26", "2027-02-25"]) {
    const { past, last } = streakOf(start, 7);
    assert.deepEqual(ids(run(prog(past), last)), ["day-streak-7"], start);
  }
});

test("6 days is not a streak, and a gap breaks it", () => {
  const six = streakOf("2026-01-28", 6);
  assert.deepEqual(run(prog(six.past), six.last), []);
  const { past, last } = streakOf("2027-02-25", 7);
  const gapped = past.map((r, i) => (i >= 3 ? { ...r, date: r.date + DAY } : r)); // skips Mar 1
  assert.deepEqual(run(prog(gapped), last), []);
});

test("several rounds on one day make one day", () => {
  const { past, last } = streakOf("2026-03-01", 7);
  const doubled = [...past, ...past.map((r) => ({ ...r, id: `${r.id}x` }))];
  assert.deepEqual(ids(run(prog(doubled), last)), ["day-streak-7"]);
});

test("the new round's day is the localDay passed in, not read from its date", () => {
  const { past } = streakOf("2026-01-28", 7); // Jan 28 to Feb 2: six days of history
  const last = rnd("new", "2026-02-02"); // dated Feb 2 UTC; the caller says which local day it is
  const sixDays = prog(past);
  assert.deepEqual(newMilestones(sixDays, last, "2026-02-02", dayOf), []);
  assert.deepEqual(ids(newMilestones(sixDays, last, "2026-02-03", dayOf)), ["day-streak-7"]);
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
  const got = run(prog(), rnd("a", "2026-03-01", { wpm: 1e9 }));
  assert.equal(got.length, 100);
});

test("nothing earned from a quiet first round", () => {
  assert.deepEqual(run(prog(), rnd("a", "2026-03-01", { wpm: 4, accuracy: 0.5 })), []);
});

// Random histories: never a repeat, always valid, nothing about slowing down.
const roundArb = fc.record({
  mode: fc.constantFrom("falling", "corners", "practice", "lesson", "daily"),
  wpm: fc.integer({ min: 0, max: 80 }),
  accuracy: fc.constantFrom(0.5, 0.9499, 0.95, 0.99, 1),
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

test("random histories: awarded once, valid, kind-checked, and never about slowing down", () => {
  fc.assert(
    fc.property(
      fc.array(roundArb, { minLength: 1, maxLength: 30 }),
      lessonsArb,
      (list, lessons) => {
        const rounds = list.map(toRound);
        const result = rounds.pop();
        const progress = freeze(prog(rounds, { lessonsPassed: lessons }));
        const got = run(progress, result);
        assert.equal(new Set(ids(got)).size, got.length);
        for (const m of got) {
          assert.equal(validate("Milestone", m).status, "valid", JSON.stringify(m));
          assert.doesNotMatch(`${m.id} ${m.label}`, /slow|dip|worse|decline/i);
        }
        const after = { ...progress, milestones: got };
        assert.deepEqual(run(after, result), []); // nothing is awarded twice
        assert.deepEqual(got, run(progress, result)); // same input, same output
      },
    ),
  );
});

test("malformed input is a programmer error", () => {
  const ok = rnd("a", "2026-03-01");
  assert.throws(() => newMilestones(null, ok, "2026-03-01", dayOf), TypeError);
  assert.throws(() => newMilestones({ rounds: [] }, ok, "2026-03-01", dayOf), TypeError);
  assert.throws(() => newMilestones(prog(), ok, "2026-03-01", null), TypeError);
  for (const day of ["2026-02-30", "2026-13-01", "2027-02-29", "tomorrow", ""]) {
    assert.throws(() => newMilestones(prog(), ok, day, dayOf), RangeError, day);
  }
  assert.throws(
    () => newMilestones(prog(), { ...ok, accuracy: 2 }, "2026-03-01", dayOf),
    RangeError,
  );
  assert.throws(() => newMilestones(prog([{ id: "x" }]), ok, "2026-03-01", dayOf), RangeError);
  assert.throws(
    () => newMilestones(prog([rnd("b", "2026-03-01")]), ok, "2026-03-01", () => "nope"),
    RangeError,
  );
});
