// The share card's words and numbers (share Req 1): rounded figures, the mode line, the best,
// rounds and streak from saved progress, the top milestone only, and nothing personal.
import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { cardAlt, cardData, clock, dayLine, SITE, sharePieces, shareText } from "./cardData.js";

const NOV13 = new Date(2026, 10, 13, 15).getTime();
const result = (over = {}) => ({
  mode: "falling",
  wave: 6,
  durationMs: 72_000,
  wpm: 41.6,
  accuracy: 0.972,
  date: NOV13,
  drillSource: null,
  keyDeltas: { q: { attempts: 3, misses: 2 } },
  ...over,
});
const progress = {
  bests: { falling: { wpm: 47.2, date: 1 }, corners: { wpm: 39, date: 2 } },
  rounds: [{}, {}, {}],
  dayStreak: { lastDay: "2026-11-13", count: 4 },
};
const band = (wpm) => ({
  id: `wpm-${wpm}`,
  kind: "wpm-band",
  threshold: wpm,
  label: `${wpm} words per minute`,
});

test("the card rounds its numbers and names the mode, wave, time and day", () => {
  const d = cardData({
    result: result(),
    outcome: { milestones: [] },
    progress,
    now: new Date(NOV13),
  });
  assert.equal(d.wpm, 42);
  assert.equal(d.accuracy, 97);
  assert.equal(d.best, 47);
  assert.equal(d.rounds, 3);
  assert.equal(d.meta, "FALLING WORDS · WAVE 06 · 1:12 · NOV 13 2026");
  assert.equal(d.milestone, null);
});

test("practice has no wave; a drill says DRILL", () => {
  const p = cardData({ result: result({ mode: "practice" }), outcome: {}, progress: {} });
  assert.equal(p.meta.split(" · ")[0], "PRACTICE");
  assert.ok(!p.meta.includes("WAVE"));
  const drill = cardData({
    result: result({ mode: "practice", drillSource: "ai" }),
    outcome: {},
    progress: {},
  });
  assert.ok(drill.meta.startsWith("DRILL · "));
});

test("no saved progress: no best, 0 rounds, 0-day streak", () => {
  const d = cardData({ result: result(), outcome: {}, progress: undefined });
  assert.deepEqual([d.best, d.rounds, d.streak], [null, 0, 0]);
});

test("only the top speed milestone shows, uppercase", () => {
  const d = cardData({ result: result(), outcome: { milestones: [band(30), band(40)] }, progress });
  assert.equal(d.milestone, "MILESTONE: 40 WORDS PER MINUTE");
});

test("clock and dayLine", () => {
  assert.equal(clock(72_000), "1:12");
  assert.equal(clock(5_400), "0:05");
  assert.equal(clock(-1), "0:00");
  assert.equal(dayLine(new Date(2026, 0, 2).getTime()), "JAN 2 2026");
});

test("the share line and the alt text carry only the round's numbers and the site", () => {
  const d = cardData({ result: result(), outcome: { milestones: [band(40)] }, progress });
  assert.equal(
    shareText(d),
    `I typed 42 WPM at 97% accuracy in Dead Keys, a typing game, back from the dead. ${SITE}`,
  );
  assert.equal(
    cardAlt(d),
    "Dead Keys round card: 42 WPM, 97% accuracy, falling words · wave 06 · 1:12 · nov 13 2026. milestone: 40 words per minute.",
  );
  assert.deepEqual(Object.keys(sharePieces({ result: result(), outcome: {}, progress })), [
    "data",
    "text",
    "alt",
  ]);
});

test("property: whatever the round, the card stays in range and never shows the keys", () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0, max: 300, noNaN: true }),
      fc.double({ min: 0, max: 1, noNaN: true }),
      fc.nat(3_600_000),
      (wpm, accuracy, durationMs) => {
        const d = cardData({
          result: result({ wpm, accuracy, durationMs }),
          outcome: {},
          progress,
        });
        assert.ok(Number.isInteger(d.wpm) && d.wpm >= 0);
        assert.ok(d.accuracy >= 0 && d.accuracy <= 100);
        assert.ok(!JSON.stringify(d).includes("keyDeltas"));
      },
    ),
  );
});
