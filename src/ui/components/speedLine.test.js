// The speed line's numbers: from saved rounds only, inside the chart box, five nice gridlines.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { BOX, SPEED_ROUNDS, speedLine, speedWords, ticks } from "./speedLine.js";

const rounds = (wpms) => wpms.map((wpm) => ({ wpm }));

test("no rounds, no line", () => {
  assert.equal(speedLine([]), null);
  assert.equal(speedLine(undefined), null);
  assert.equal(speedLine(rounds([Number.NaN, -1])), null);
});

test("the mock's line: 22 up to 38 over 14 rounds, gridlines 20 to 40", () => {
  const w = [22, 24, 23, 21, 25, 27, 26, 29, 30, 31, 30, 33, 35, 38];
  const s = speedLine(rounds(w));
  assert.deepEqual(s.ticks, [20, 25, 30, 35, 40]);
  assert.equal(s.points.length, 14);
  assert.deepEqual(s.points[0], { x: 44, y: 199 }); // the mock's first point
  assert.deepEqual(s.points.at(-1), { x: 408, y: 55 }); // and its last
  assert.equal(s.gain, 16);
  assert.match(s.line, /^M44 199 L/);
  assert.match(s.area, / Z$/);
});

test("only the last 14 rounds are shown", () => {
  const w = Array.from({ length: 30 }, (_, i) => i + 10);
  const s = speedLine(rounds(w));
  assert.equal(s.wpms.length, SPEED_ROUNDS);
  assert.deepEqual(s.wpms, w.slice(-14));
});

test("one round sits in the middle", () => {
  const s = speedLine(rounds([30]));
  assert.equal(s.points[0].x, (BOX.x0 + BOX.x1) / 2);
  assert.equal(s.gain, 0);
});

test("any speeds: every point is inside the box and the gridlines cover them", () => {
  fc.assert(
    fc.property(
      fc.array(fc.integer({ min: 0, max: 250 }), { minLength: 1, maxLength: 40 }),
      (w) => {
        const s = speedLine(rounds(w));
        assert.equal(s.ticks.length, 5);
        assert.ok(s.ticks[0] <= Math.min(...s.wpms) && s.ticks[4] >= Math.max(...s.wpms));
        for (const p of s.points) {
          assert.ok(p.x >= BOX.x0 && p.x <= BOX.x1, `x ${p.x}`);
          assert.ok(p.y >= BOX.yHigh - 0.1 && p.y <= BOX.yLow + 0.1, `y ${p.y}`);
        }
      },
    ),
  );
});

test("ticks never go below zero", () => {
  assert.deepEqual(ticks([0, 3]), [0, 5, 10, 15, 20]);
});

test("the words say every number", () => {
  assert.equal(
    speedWords([22, 30, 38]),
    "Speed over your last 3 rounds, oldest first: 22, 30, 38 words per minute.",
  );
  assert.equal(
    speedWords([30]),
    "Speed over your last 1 round, oldest first: 30 words per minute.",
  );
});

test("speeds are whole numbers, so the gain reads +3 WPM, never +2.5999", () => {
  const s = speedLine(rounds([28.4, 30.1, 31.4]));
  assert.deepEqual(s.wpms, [28, 30, 31]);
  assert.equal(s.gain, 3);
});
