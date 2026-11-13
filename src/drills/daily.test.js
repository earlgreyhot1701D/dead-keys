// The daily drill's rules (daily Reqs 1 and 2): the date seed, the 2-minute clock with one
// warning and one end, and today's best.
import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { createRound } from "../engine/round.js";
import { createWatch, DAILY_MS, DAILY_SAY, dailySeed, timeLeft, todayBest } from "./daily.js";

test("the seed is the local date as YYYYMMDD", () => {
  assert.equal(dailySeed(new Date(2026, 10, 13, 23, 59)), 20261113);
  assert.equal(dailySeed(new Date(2027, 0, 1, 0, 0)), 20270101);
});

test("property: any two times on the same local day give the same seed", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 86_399_999 }),
      fc.integer({ min: 0, max: 86_399_999 }),
      (a, b) => {
        const day = new Date(2026, 10, 13).getTime();
        assert.equal(dailySeed(new Date(day + a)), dailySeed(new Date(day + b)));
      },
    ),
  );
});

test("the same seed gives the same first words to everyone", () => {
  const items = ["alpha", "bravo", "cargo", "delta", "eagle", "fable", "gamma"].map((t) => ({
    id: t,
    text: t,
  }));
  const words = (speed) =>
    createRound({
      mode: "daily",
      mechanic: "falling",
      items,
      seed: 20261113,
      speed,
    }).state.targets.map((t) => t.text);
  assert.deepEqual(words(0.7), words(0.7));
  assert.deepEqual(words(0.7), words(1.5)); // the speed setting changes timing, not the words
});

test("the clock: time left, one warning at 30 seconds, one end at 2 minutes", () => {
  assert.equal(timeLeft({ activeMs: 0 }), DAILY_MS);
  assert.equal(timeLeft({ activeMs: DAILY_MS + 5 }), 0);
  const watch = createWatch();
  assert.deepEqual(watch({ activeMs: 60_000 }), { say: null, end: false });
  assert.deepEqual(watch({ activeMs: 90_000 }), { say: DAILY_SAY.warn, end: false });
  assert.deepEqual(watch({ activeMs: 95_000 }), { say: null, end: false });
  assert.deepEqual(watch({ activeMs: DAILY_MS }), { say: DAILY_SAY.end, end: true });
  assert.deepEqual(watch({ activeMs: DAILY_MS + 16 }), { say: null, end: false });
});

test("a round ended another way (pause, out of lives) is left alone", () => {
  assert.deepEqual(createWatch()({ activeMs: DAILY_MS, ended: true }), { say: null, end: false });
});

test("today's best counts only today's daily rounds", () => {
  const now = new Date(2026, 10, 13, 12);
  const at = (d, h) => new Date(2026, 10, d, h).getTime();
  const rounds = [
    { mode: "daily", date: at(13, 9), wpm: 31.4 },
    { mode: "daily", date: at(13, 10), wpm: 36.6 },
    { mode: "daily", date: at(12, 22), wpm: 50 },
    { mode: "falling", date: at(13, 11), wpm: 60 },
  ];
  assert.equal(todayBest(rounds, now), 37);
  assert.equal(todayBest([], now), null);
  assert.equal(todayBest(undefined, now), null);
});

test("clockFor: nothing for a round with no limit; the daily clock says and ends once", async () => {
  const { clockFor } = await import("./daily.js");
  const said = [];
  const ended = [];
  clockFor(
    {},
    (l) => said.push(l),
    (s) => ended.push(s),
  )({ activeMs: DAILY_MS });
  assert.deepEqual([said, ended], [[], []]);
  const clock = clockFor(
    { limitMs: DAILY_MS },
    (l) => said.push(l),
    (s) => ended.push(s),
  );
  for (const ms of [10_000, 91_000, 100_000, DAILY_MS, DAILY_MS + 16]) clock({ activeMs: ms });
  assert.deepEqual(said, [DAILY_SAY.warn, DAILY_SAY.end]);
  assert.equal(ended.length, 1);
});
