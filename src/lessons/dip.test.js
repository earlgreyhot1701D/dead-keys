// The dip notice (lessons Req 9.1): only on the second or third lesson round ever, only when it
// is more than 15% slower than the first.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DIP_SHARE, showDip } from "./dip.js";

const lesson = (id, wpm, mode = "lesson") => ({ id, mode, wpm });

test("the second lesson round, more than 15% slower than the first: show it", () => {
  assert.equal(DIP_SHARE, 0.15);
  assert.equal(showDip([lesson("a", 20)], lesson("b", 16.9)), true);
  assert.equal(showDip([lesson("a", 20)], lesson("b", 17)), false, "exactly 15% is not more");
  assert.equal(showDip([lesson("a", 20)], lesson("b", 25)), false, "faster: no");
});

test("the third lesson round compares with the first, not the second", () => {
  const before = [lesson("a", 20), lesson("b", 10)];
  assert.equal(showDip(before, lesson("c", 16)), true);
  assert.equal(showDip(before, lesson("c", 18)), false);
});

test("the first, fourth and later lesson rounds never show it", () => {
  assert.equal(showDip([], lesson("a", 1)), false);
  const three = [lesson("a", 20), lesson("b", 20), lesson("c", 20)];
  assert.equal(showDip(three, lesson("d", 1)), false);
});

test("play rounds and test outs do not count; a test out never shows it", () => {
  const before = [lesson("p", 60, "falling"), lesson("a", 20), lesson("t", 40, "testout")];
  assert.equal(showDip(before, lesson("b", 10)), true, "this is the second lesson round");
  assert.equal(showDip([lesson("a", 20)], lesson("t", 5, "testout")), false);
  assert.equal(showDip([lesson("a", 0)], lesson("b", 0)), false, "a first round of 0 WPM: no");
});

test("the round itself, if it is already saved, is not counted twice", () => {
  const b = lesson("b", 10);
  assert.equal(showDip([lesson("a", 20), b], b), true);
});
