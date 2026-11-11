// Req 4.7 and 4.8: the saved day streak.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { updateDayStreak } from "./dayStreak.js";

const start = { lastDay: null, count: 0 };
const DAY = 86_400_000;
const BASE = Date.parse("2026-12-20T12:00:00Z");
const dayAt = (offset) => new Date(BASE + offset * DAY).toISOString().slice(0, 10);

/** Play on each day in turn and return the streak. */
const play = (days, from = start) => days.reduce(updateDayStreak, from);

test("the first round starts a streak of 1", () => {
  assert.deepEqual(updateDayStreak(start, "2026-03-01"), { lastDay: "2026-03-01", count: 1 });
});

test("the same day twice keeps the count and returns the same object", () => {
  const once = updateDayStreak(start, "2026-03-01");
  assert.equal(updateDayStreak(once, "2026-03-01"), once);
  assert.equal(play(["2026-03-01", "2026-03-01", "2026-03-01"]).count, 1);
});

test("the next day adds 1: across a month end, a year end and a leap day", () => {
  const cases = [
    ["2026-01-31", "2026-02-01"],
    ["2026-12-31", "2027-01-01"],
    ["2028-02-28", "2028-02-29"],
    ["2028-02-29", "2028-03-01"],
    ["2027-02-28", "2027-03-01"],
  ];
  for (const [a, b] of cases) {
    assert.deepEqual(play([a, b]), { lastDay: b, count: 2 }, `${a} then ${b}`);
  }
});

test("seven days in a row across a month end reach 7", () => {
  const days = [
    "2026-01-28",
    "2026-01-29",
    "2026-01-30",
    "2026-01-31",
    "2026-02-01",
    "2026-02-02",
    "2026-02-03",
  ];
  assert.equal(play(days).count, 7);
});

test("a gap resets the count to 1, including a skipped leap day", () => {
  assert.deepEqual(play(["2027-02-27", "2027-02-28", "2027-03-02"]), {
    lastDay: "2027-03-02",
    count: 1,
  });
  assert.deepEqual(play(["2028-02-28", "2028-03-01"]), { lastDay: "2028-03-01", count: 1 });
});

test("an earlier day changes nothing: a clock or time zone change must not break a streak", () => {
  const s = play(["2026-03-01", "2026-03-02", "2026-03-03"]);
  assert.equal(updateDayStreak(s, "2026-03-02"), s);
  assert.equal(updateDayStreak(s, "2025-01-01"), s);
});

test("random plays: the count is the length of the run of consecutive days ending on the last day", () => {
  fc.assert(
    fc.property(fc.array(fc.integer({ min: 0, max: 3 }), { maxLength: 40 }), (steps) => {
      let offset = 0;
      const offsets = [];
      for (const s of steps) {
        offset += s; // each step: same day, next day, or a gap
        offsets.push(offset);
      }
      let want = 0;
      offsets.forEach((o, i) => {
        if (i === 0) want = 1;
        else if (o - offsets[i - 1] === 1) want += 1;
        else if (o - offsets[i - 1] > 1) want = 1;
      });
      const got = play(offsets.map(dayAt));
      if (offsets.length === 0) assert.deepEqual(got, start);
      else {
        assert.equal(got.count, want);
        assert.equal(got.lastDay, dayAt(offsets.at(-1)));
      }
    }),
  );
});

test("the input is never changed", () => {
  const s = Object.freeze({ lastDay: "2026-03-01", count: 4 });
  assert.deepEqual(updateDayStreak(s, "2026-03-02"), { lastDay: "2026-03-02", count: 5 });
  assert.deepEqual(updateDayStreak(s, "2026-03-09"), { lastDay: "2026-03-09", count: 1 });
});

test("malformed input is a programmer error", () => {
  for (const day of [
    "2026-02-30",
    "2027-02-29",
    "2026-13-01",
    "2026-00-10",
    "2026-1-1",
    "today",
    "",
    null,
  ]) {
    assert.throws(() => updateDayStreak(start, day), RangeError, String(day));
  }
  for (const bad of [
    null,
    undefined,
    {},
    { lastDay: null },
    { lastDay: null, count: -1 },
    { lastDay: null, count: 1.5 },
    { lastDay: 5, count: 1 },
  ]) {
    assert.throws(() => updateDayStreak(bad, "2026-03-01"), TypeError);
  }
  assert.throws(() => updateDayStreak({ lastDay: "nope", count: 1 }, "2026-03-01"), RangeError);
});
