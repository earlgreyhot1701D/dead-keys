// The three moments (Req 6): each lasts its time and then clears; a cleared card stays on the
// page until its moment ends; stop leaves no timer; reduced motion drops only the movement.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createMoments, MOMENT_MS, playMoments } from "./moments.js";

/** A fake clock: `run(ms)` fires every timer due by then. */
function fakeTimers() {
  let now = 0;
  let next = 1;
  const due = new Map();
  return {
    setTimeout: (fn, ms) => {
      due.set(next, { at: now + ms, fn });
      return next++;
    },
    clearTimeout: (id) => due.delete(id),
    run(ms) {
      now += ms;
      for (const [id, t] of [...due]) {
        if (t.at <= now) {
          due.delete(id);
          t.fn();
        }
      }
    },
    count: () => due.size,
  };
}
const node = () => ({
  attrs: {},
  removed: false,
  setAttribute(k, v) {
    this.attrs[k] = v;
  },
  remove() {
    this.removed = true;
  },
});

test("the times are Req 6.1's", () => {
  assert.deepEqual({ ...MOMENT_MS }, { miss: 200, clear: 250, wave: 1000 });
});

test("a miss marks the locked card for 200 ms; a second miss restarts its time", () => {
  const t = fakeTimers();
  const m = createMoments(t);
  const card = node();
  m.miss(card);
  assert.equal(card.attrs["data-moment"], "miss");
  t.run(150);
  m.miss(card);
  t.run(150);
  assert.equal(card.attrs["data-moment"], "miss");
  t.run(50);
  assert.equal(card.attrs["data-moment"], "");
  assert.equal(t.count(), 0);
});

test("the wave banner says WAVE nn for one second", () => {
  const t = fakeTimers();
  const m = createMoments(t);
  const banner = node();
  m.wave(banner, 4);
  assert.equal(banner.textContent, "WAVE 04");
  assert.equal(banner.attrs["data-moment"], "wave");
  t.run(999);
  assert.equal(banner.attrs["data-moment"], "wave");
  t.run(1);
  assert.equal(banner.attrs["data-moment"], "");
});

test("a cleared card stays until its moment ends, then leaves the page and the map", () => {
  const t = fakeTimers();
  const m = createMoments(t);
  const card = { node: node() };
  const locked = { node: node() };
  const field = {
    cards: new Map([
      [3, card],
      [5, locked],
    ]),
    banner: node(),
  };
  const events = [
    { type: "miss", expected: "b", typed: "z" },
    { type: "miss", expected: null, typed: "q" }, // a stray key: no locked word to flash
    { type: "cleared", targetId: 3 },
    { type: "waveUp", wave: 2 },
  ];
  playMoments(m, field, events, { lockId: 5 });
  assert.equal(locked.node.attrs["data-moment"], "miss");
  assert.equal(card.leaving, true);
  assert.equal(card.node.attrs["data-moment"], "clear");
  assert.equal(field.banner.textContent, "WAVE 02");
  t.run(MOMENT_MS.clear - 1);
  assert.equal(card.node.removed, false);
  t.run(1);
  assert.equal(card.node.removed, true);
  assert.equal(field.cards.has(3), false);
});

test("stop clears every timer, so no moment outlives its screen", () => {
  const t = fakeTimers();
  const m = createMoments(t);
  m.miss(node());
  m.wave(node(), 3);
  m.clear(node(), () => assert.fail("must not run after stop"));
  m.stop();
  assert.equal(t.count(), 0);
  t.run(5000);
});

test("reduced motion drops each moment's movement and keeps its colors and words", () => {
  const css = readFileSync(new URL("../styles/playMoments.css", import.meta.url), "utf8");
  const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
  assert.ok(reduced.length > 40, "there is a reduced-motion block");
  assert.match(reduced, /animation: none/);
  assert.doesNotMatch(reduced, /display: none|color:|border-color/); // words and colors stay
  for (const m of ["miss", "clear", "wave"]) assert.ok(css.includes(`data-moment="${m}"`), m);
});
