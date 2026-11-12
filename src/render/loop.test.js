// The game loop (Req 4), driven by a fake frame clock and fake window and document.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { clampDt, MAX_DT_MS, startLoop } from "./loop.js";

/** A fake browser: frames run only when the test says so, at the times it gives. */
function fake() {
  const frames = new Map();
  let nextId = 1;
  const listeners = { win: new Map(), doc: new Map() };
  const target = (name) => ({
    addEventListener: (t, fn) => listeners[name].set(t, fn),
    removeEventListener: (t, fn) => listeners[name].get(t) === fn && listeners[name].delete(t),
  });
  const win = {
    ...target("win"),
    requestAnimationFrame: (fn) => {
      frames.set(nextId, fn);
      return nextId++;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  };
  const doc = { ...target("doc"), visibilityState: "visible" };
  const runFrame = (ts) => {
    const [[id, fn]] = frames;
    frames.delete(id);
    fn(ts);
  };
  return { win, doc, frames, listeners, runFrame };
}

test("one onFrame per frame with the time since the last one; the first frame is 0", () => {
  const f = fake();
  const dts = [];
  startLoop({ onFrame: (dt) => dts.push(dt), onHide: () => {}, win: f.win, doc: f.doc });
  for (const ts of [1000, 1016, 1033, 1050]) f.runFrame(ts);
  assert.deepEqual(dts, [0, 16, 17, 17]);
});

test("a long stall is clamped to MAX_DT_MS; NaN and going backwards give 0", () => {
  assert.equal(MAX_DT_MS, 100);
  const f = fake();
  const dts = [];
  startLoop({ onFrame: (dt) => dts.push(dt), onHide: () => {}, win: f.win, doc: f.doc });
  for (const ts of [0, 5000, Number.NaN, 4000, 4050]) f.runFrame(ts);
  assert.deepEqual(dts, [0, 100, 0, 0, 50]);
  fc.assert(
    fc.property(fc.double(), (dt) => {
      const c = clampDt(dt);
      assert.ok(Number.isFinite(c) && c >= 0 && c <= MAX_DT_MS);
    }),
  );
});

test("hidden tab or lost focus: onHide, and the time away never counts", () => {
  const f = fake();
  const dts = [];
  let hides = 0;
  startLoop({ onFrame: (dt) => dts.push(dt), onHide: () => hides++, win: f.win, doc: f.doc });
  f.runFrame(0);
  f.runFrame(16);
  f.doc.visibilityState = "hidden";
  f.listeners.doc.get("visibilitychange")();
  assert.equal(hides, 1);
  f.doc.visibilityState = "visible";
  f.listeners.doc.get("visibilitychange")(); // coming back is not a hide
  assert.equal(hides, 1);
  f.runFrame(9000); // after the hide, time starts over
  f.listeners.win.get("blur")();
  assert.equal(hides, 2);
  f.runFrame(20000);
  assert.deepEqual(dts, [0, 16, 0, 0]);
});

test("stop leaves nothing behind: no frame request, no listener, no more calls", () => {
  const f = fake();
  let calls = 0;
  const loop = startLoop({ onFrame: () => calls++, onHide: () => calls++, win: f.win, doc: f.doc });
  f.runFrame(0);
  loop.stop();
  assert.equal(loop.running(), false);
  assert.equal(f.frames.size, 0);
  assert.equal(f.listeners.win.size, 0);
  assert.equal(f.listeners.doc.size, 0);
  loop.stop(); // twice is fine
  assert.equal(calls, 1);
});

test("stopping from inside onFrame asks for no next frame", () => {
  const f = fake();
  const loop = startLoop({ onFrame: () => loop.stop(), onHide: () => {}, win: f.win, doc: f.doc });
  f.runFrame(0);
  assert.equal(f.frames.size, 0);
});
