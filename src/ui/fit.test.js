// The fit factor: whole screens fit a 1366x768 laptop, and small or zoomed windows reflow instead.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DESIGN, FIT_MIN, fitFactor } from "./fit.js";

test("at or above the design size nothing is zoomed", () => {
  assert.equal(fitFactor(1440, 900), 1);
  assert.equal(fitFactor(1920, 1080), 1);
});

test("Shara's 1366x768 Chromebook fits by height", () => {
  const k = fitFactor(1366, 768);
  assert.equal(k, 768 / DESIGN.height);
  assert.ok(DESIGN.width * k <= 1366 && DESIGN.height * k <= 768);
});

test("a wide but short window fits by height, a narrow one by width", () => {
  assert.equal(fitFactor(1400, 700), 700 / 900);
  assert.equal(fitFactor(1200, 1000), 1200 / 1440);
});

test("below the fit range the page reflows instead (browser zoom keeps working)", () => {
  assert.equal(fitFactor(FIT_MIN.width - 1, 800), 1);
  assert.equal(fitFactor(1300, FIT_MIN.height - 1), 1);
  assert.equal(fitFactor(720, 450), 1); // a 1440x900 screen at 200% browser zoom
});

test("bad input never zooms", () => {
  for (const [w, h] of [
    [Number.NaN, 800],
    [1200, undefined],
    [-5, -5],
  ]) {
    assert.equal(fitFactor(w, h), 1);
  }
});
