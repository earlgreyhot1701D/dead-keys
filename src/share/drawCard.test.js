// The card drawing (share Req 1, the approved mock): with a fake 2D context that records calls,
// every number and line lands, the milestone box only when earned, and the canvas size is fixed.
import assert from "node:assert/strict";
import { test } from "node:test";
import { SITE, TAGLINE } from "./cardData.js";
import { drawCard, H, W } from "./drawCard.js";

function fakeCtx() {
  const calls = [];
  return {
    calls,
    letterSpacing: "0px",
    fillText: (s, x, y) => calls.push(["text", s, x, y]),
    fillRect: (...a) => calls.push(["rect", ...a]),
    strokeRect: (...a) => calls.push(["stroke", ...a]),
    measureText: (s) => ({ width: String(s).length * 100 }), // about a 200px digit
  };
}
const card = (over = {}) => ({
  wpm: 42,
  accuracy: 97,
  best: 47,
  rounds: 12,
  streak: 1,
  meta: "FALLING WORDS · WAVE 06 · 1:12 · NOV 13 2026",
  milestone: null,
  ...over,
});
const texts = (g) => g.calls.filter((c) => c[0] === "text").map((c) => c[1]);

test("the link-preview size", () => {
  assert.deepEqual([W, H], [1200, 630]);
});

test("every line of the mock is drawn, inside the card", () => {
  const g = fakeCtx();
  drawCard(g, card());
  const t = texts(g);
  for (const s of ["DEAD KEYS // TERMINAL 84", "ROUND REPORT", "42", "WPM", "97%", "ACCURACY"])
    assert.ok(t.includes(s), s);
  for (const s of ["BEST SPEED", "47 WPM", "ROUNDS", "12", "STREAK", "1 DAY", TAGLINE, SITE])
    assert.ok(t.includes(s), s);
  assert.ok(t.includes(card().meta));
  for (const [, , x, y] of g.calls.filter((c) => c[0] === "text")) {
    assert.ok(x >= 0 && x <= W && y > 0 && y < H);
  }
});

test("the milestone box shows only when earned; no best draws a dash; days are plural", () => {
  const none = fakeCtx();
  drawCard(none, card());
  assert.ok(!texts(none).some((s) => s.startsWith("MILESTONE")));
  const g = fakeCtx();
  drawCard(g, card({ milestone: "MILESTONE: 40 WORDS PER MINUTE", best: null, streak: 3 }));
  assert.ok(texts(g).includes("MILESTONE: 40 WORDS PER MINUTE"));
  assert.ok(texts(g).includes("—"));
  assert.ok(texts(g).includes("3 DAYS"));
});

test("a three-digit speed pushes accuracy right, so they never overlap", () => {
  const at = (wpm) => {
    const g = fakeCtx();
    drawCard(g, card({ wpm }));
    return g.calls.find((c) => c[0] === "text" && c[1] === "97%")[2];
  };
  assert.ok(at(142) > at(42));
});
