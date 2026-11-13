// Keyboard layout and summary: every cap has a band, glyph and label; the summary covers every cap.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BANDS } from "../../engine/progressConfig.js";
import { createEl } from "../dom.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { renderKeyboard } from "./keyboard.js";
import { keyboardModel, onTheirWay, ROWS, summarizeKeyboard } from "./keyboardLayout.js";

const stat = (key, attempts, misses) => ({ key, attempts, misses, lastSeen: 0 });
const count = (model) => model.flat().length;

test("no stats: every cap is 'no data' with a glyph and a label", () => {
  const model = keyboardModel([]);
  assert.equal(count(model), ROWS.flat().length);
  for (const c of model.flat()) {
    assert.equal(c.band, "noData");
    assert.ok(c.glyph && c.label);
  }
});

test("each cap takes its band from the stats; keys off the layout are ignored", () => {
  const model = keyboardModel([stat("f", 20, 10), stat("j", 20, 0), stat("ñ", 50, 50)]);
  const by = Object.fromEntries(model.flat().map((c) => [c.key, c.band]));
  assert.equal(by.f, "missed");
  assert.equal(by.j, "steady");
  assert.equal(by.ñ, undefined);
  assert.equal(count(model), ROWS.flat().length);
});

test("the summary places every cap in exactly one line, worst band first", () => {
  const lines = summarizeKeyboard(keyboardModel([stat("f", 20, 10), stat("j", 20, 0)]));
  assert.deepEqual(lines, [
    "Focus here: f.",
    "Steady: j.",
    `Not enough yet: ${ROWS.flat().length - 2} keys.`,
  ]);
});

test("the summary names the space bar in words", () => {
  const lines = summarizeKeyboard(keyboardModel([stat(" ", 20, 0)]));
  assert.ok(lines.includes("Steady: space."));
});

test("the drawn keyboard has a glyph on every cap and a legend for every band", () => {
  withFakeDocument((doc) => {
    const root = renderKeyboard(createEl(doc), [stat("f", 20, 10)]);
    const caps = findAll(root, (n) => /\bkb-key\b/.test(n.attrs?.class ?? ""));
    const glyphs = findAll(root, (n) => n.attrs?.class === "kb-glyph");
    assert.equal(glyphs.length, ROWS.flat().length);
    assert.ok(caps.length >= ROWS.flat().length + BANDS.length);
    const text = textOf(root);
    for (const b of BANDS) assert.ok(text.includes(b.label), b.label);
    const grid = findAll(root, (n) => n.attrs?.class === "kb-grid")[0];
    assert.equal(grid.attrs["aria-hidden"], "true");
  });
});

test("on their way: keys with some tries but under 10, counted in one line", () => {
  assert.deepEqual(onTheirWay([]), []);
  assert.deepEqual(onTheirWay([stat("e", 4, 2)]), [
    "Keys get a color after 10 tries. 1 key is on its way.",
  ]);
  const three = onTheirWay([stat("e", 4, 2), stat("a", 9, 0), stat("s", 3, 0), stat("f", 20, 1)]);
  assert.deepEqual(three, ["Keys get a color after 10 tries. 3 keys are on their way."]);
});
