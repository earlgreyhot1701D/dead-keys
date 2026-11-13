// The title's attract mode (attract Reqs 1 and 3): the still frame first, the live demo after the
// idle wait, a Pause demo button that works and says so, any input back to the still frame, and
// never under reduced motion. Hidden from a screen reader, silent.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createEl } from "../ui/dom.js";
import { findAll, makeFakeDoc, textOf } from "../ui/fakeDom.js";
import { IDLE_MS } from "./bot.js";
import { createDemo, DEMO_COPY } from "./demo.js";

function fakeWin({ reduced = false } = {}) {
  const w = {
    timers: [],
    frames: [],
    setTimeout: (f, ms) => w.timers.push({ f, ms }) - 1,
    clearTimeout: (i) => {
      if (w.timers[i]) w.timers[i].f = null;
    },
    requestAnimationFrame: (f) => w.frames.push(f),
    cancelAnimationFrame: () => w.frames.splice(0),
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: reduced }),
  };
  w.fire = () => w.timers.at(-1)?.f?.();
  let now = 0;
  w.frame = (dt) => {
    now += dt;
    w.frames.shift()?.(now);
  };
  return w;
}
const setup = (opts) => {
  const doc = makeFakeDoc();
  doc.addEventListener = () => {};
  doc.removeEventListener = () => {};
  globalThis.document = doc; // titleScene and the fields draw with the page's document
  const win = fakeWin(opts);
  const demo = createDemo(createEl(doc), { win, doc });
  return { demo, win };
};
// The demo changes its words by textContent (the fake keeps that as a plain property).
const statusText = (demo) => cls(demo.controls, "demo-status")[0].textContent;
const labelText = (btn) => btn.children[0].textContent;
afterEach(() => {
  delete globalThis.document;
});
const cls = (node, c) => findAll(node, (n) => n.attrs?.class?.split(" ").includes(c));

test("the still frame first, the controls hidden; the idle wait is 3 seconds", () => {
  const { demo, win } = setup();
  assert.equal(demo.scene.attrs["aria-hidden"], "true");
  assert.equal(cls(demo.scene, "title-scene").length, 1);
  assert.equal(demo.controls.attrs.hidden, "");
  assert.equal(win.timers.at(-1).ms, IDLE_MS);
  assert.equal(IDLE_MS, 3_000); // Shara, Nov 13 (the PRD said about 15 s)
  assert.equal(demo.running(), false);
});

test("after the wait the real game plays itself, words fall, and the controls show", () => {
  const { demo, win } = setup();
  win.fire();
  assert.ok(demo.running());
  assert.equal(cls(demo.scene, "attract-falling").length, 1);
  assert.equal(demo.controls.attrs.hidden, undefined);
  assert.equal(statusText(demo), `[${DEMO_COPY.playing}]`);
  for (let i = 0; i < 300; i++) win.frame(16);
  assert.ok(cls(demo.scene, "fw").length > 0, "words on the field");
  assert.ok(textOf(demo.scene).includes(DEMO_COPY.tag));
});

test("Pause demo stops it and says so; Resume demo starts it again", () => {
  const { demo, win } = setup();
  win.fire();
  const btn = findAll(demo.controls, (n) => n.tag === "button")[0];
  btn.click();
  assert.equal(demo.running(), false);
  assert.equal(btn.attrs["aria-pressed"], "true");
  assert.equal(labelText(btn), DEMO_COPY.resume);
  assert.equal(statusText(demo), `[${DEMO_COPY.paused}]`);
  btn.click();
  assert.ok(demo.running());
  assert.equal(labelText(btn), DEMO_COPY.pause);
});

test("any input puts the still frame back and starts the wait again; the button is not input", () => {
  const { demo, win } = setup();
  win.fire();
  const btn = findAll(demo.controls, (n) => n.tag === "button")[0];
  demo.controls.contains = (t) => t === btn;
  demo.input({ target: btn });
  assert.ok(demo.running());
  const waits = win.timers.length;
  demo.input({ target: {} });
  assert.equal(demo.running(), false);
  assert.equal(cls(demo.scene, "title-scene").length, 1);
  assert.equal(demo.controls.attrs.hidden, "");
  assert.equal(win.timers.length, waits + 1);
});

test("reduced motion: never starts, the still frame stays", () => {
  const { demo, win } = setup({ reduced: true });
  assert.equal(win.timers.length, 0);
  demo.input();
  assert.equal(win.timers.length, 0);
  assert.equal(demo.running(), false);
});
