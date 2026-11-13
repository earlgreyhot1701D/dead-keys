// The menu's one-step rounds (play Req 2.2, daily Req 1): Daily drill opens today's seeded round
// with the start line, a TIME LEFT clock from 2:00, and the same words for the same day.
import assert from "node:assert/strict";
import { test } from "node:test";
import { DAILY_SAY } from "../../drills/daily.js";
import { findAll, makeFakeDoc, textOf } from "../fakeDom.js";
import { dailyScreen, practiceScreen } from "./menuRounds.js";
import { nextRound } from "./play.js";

function open(screen) {
  const frames = [];
  globalThis.window = {
    requestAnimationFrame: (f) => frames.push(f),
    cancelAnimationFrame: () => frames.splice(0),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const doc = makeFakeDoc();
  doc.addEventListener = () => {};
  doc.removeEventListener = () => {};
  globalThis.document = doc;
  const said = [];
  const node = screen.render({
    state: { settings: { speed: 1 }, persist: true },
    go: () => {},
    replace: () => {},
    announce: (t) => said.push(t),
    app: { finishRound: () => ({ milestones: [] }) },
  });
  let now = 0;
  const frame = (dt) => {
    now += dt;
    frames.shift()?.(now);
  };
  return { node, said, frame };
}
const close = () => {
  delete globalThis.window;
  delete globalThis.document;
};
const time = (node) => findAll(node, (n) => n.attrs?.class === "hud-strong").at(-1).textContent;
const words = (node) => findAll(node, (n) => n.attrs?.class === "fw-word").map(textOf);

test("Daily drill: its own screen, today's round, the start line, TIME LEFT from 2:00", () => {
  const r = open(dailyScreen);
  try {
    assert.equal(dailyScreen.id, "daily");
    assert.equal(nextRound().mode, "daily");
    assert.equal(textOf(findAll(r.node, (n) => n.tag === "h1")[0]), "Daily drill");
    assert.ok(r.said.includes(DAILY_SAY.start));
    const t = textOf(r.node);
    assert.ok(t.includes("TIME LEFT:") && t.includes("LIVES:"));
    assert.equal(time(r.node), "2:00");
    for (let i = 0; i < 20; i++) r.frame(100);
    assert.equal(time(r.node), "1:58");
  } finally {
    close();
  }
});

test("two daily rounds on the same day start with the same words", () => {
  const a = open(dailyScreen);
  const first = words(a.node);
  close();
  const b = open(dailyScreen);
  try {
    assert.ok(first.length > 0);
    assert.deepEqual(words(b.node), first);
  } finally {
    close();
  }
});

test("Practice still opens practice, with no clock", () => {
  const r = open(practiceScreen);
  try {
    assert.equal(nextRound().mode, "practice");
    assert.ok(textOf(r.node).includes("TIME:") && !textOf(r.node).includes("TIME LEFT:"));
  } finally {
    close();
  }
});

test("Play again after a daily round starts today's daily round again (Req 1.5)", async () => {
  const { againKind } = await import("./resultsDrill.js");
  const { chooseRound } = await import("./play.js");
  assert.equal(againKind({ mode: "daily", drillSource: null }), "daily");
  chooseRound(againKind({ mode: "daily" }));
  assert.equal(nextRound().limitMs, 120_000);
});
