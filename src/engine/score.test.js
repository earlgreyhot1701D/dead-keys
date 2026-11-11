// Req 4: WPM and accuracy never go negative, out of range, NaN or Infinity.
// Bad input throws (design decision 6), so the range properties run on valid input only.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { accuracy, wpm } from "./score.js";

// Valid input: finite, at least 0. Includes the tiny and zero edges.
const valid = fc.oneof(
  fc.double({ min: 0, max: 1e9, noNaN: true }),
  fc.integer({ min: 0, max: 1_000_000 }),
  fc.constantFrom(0, Number.MIN_VALUE),
);
// Anything a caller must not pass.
const invalid = fc.constantFrom(
  -1,
  -0.5,
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  "5",
  null,
  undefined,
);

test("wpm is never negative, NaN or Infinity", () => {
  fc.assert(
    fc.property(valid, valid, (chars, ms) => {
      const w = wpm(chars, ms);
      assert.ok(Number.isFinite(w) && w >= 0, `wpm(${chars}, ${ms}) = ${w}`);
    }),
  );
});

test("accuracy is always from 0 to 1, never NaN", () => {
  fc.assert(
    fc.property(valid, valid, (a, b) => {
      const [correct, total] = a <= b ? [a, b] : [b, a];
      const r = accuracy(correct, total);
      assert.ok(Number.isFinite(r) && r >= 0 && r <= 1, `accuracy(${correct}, ${total}) = ${r}`);
    }),
  );
});

test("accuracy matches the plain ratio", () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 5000 }), fc.nat(5000), (total, c) => {
      const correct = Math.min(c, total);
      assert.equal(accuracy(correct, total), correct / total);
    }),
  );
});

test("the formula: (chars / 5) / minutes", () => {
  assert.equal(wpm(50, 60000), 10);
  assert.equal(wpm(300, 60000), 60);
  assert.equal(wpm(25, 30000), 10);
});

test("a tiny duration does not give NaN (underflow found by the property test)", () => {
  assert.equal(wpm(0, Number.MIN_VALUE), 0);
});

test("zero cases: no time is 0 wpm, no keystrokes is 0 accuracy", () => {
  assert.equal(wpm(100, 0), 0);
  assert.equal(accuracy(0, 0), 0);
});

test("perfect and zero accuracy", () => {
  assert.equal(accuracy(100, 100), 1);
  assert.equal(accuracy(0, 100), 0);
  assert.equal(accuracy(95, 100), 0.95);
});

test("negative, non-finite or non-number input throws", () => {
  fc.assert(
    fc.property(invalid, valid, (bad, ok) => {
      assert.throws(() => wpm(bad, ok), RangeError);
      assert.throws(() => wpm(ok, bad), RangeError);
      assert.throws(() => accuracy(bad, ok), RangeError);
      assert.throws(() => accuracy(ok, bad), RangeError);
    }),
  );
});

test("accuracy throws when correct is more than total", () => {
  assert.throws(() => accuracy(5, 0), RangeError);
  assert.throws(() => accuracy(11, 10), RangeError);
});

test("same inputs, same outputs", () => {
  fc.assert(
    fc.property(valid, valid, (a, b) => {
      assert.equal(wpm(a, b), wpm(a, b));
    }),
  );
});
