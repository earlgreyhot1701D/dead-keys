// Saving and racing a ghost through the app (ghost Reqs 1 and 3): a new best in a ghost mode
// saves its keystrokes as that mode's ghost, in storage too; a round that is not a best keeps the
// old ghost; Play these keys and drills save none; finishRound says which ghost was raced.
import assert from "node:assert/strict";
import { test } from "node:test";
import { endRound } from "../engine/lifecycle.js";
import { toResult } from "../engine/result.js";
import { createRound, key } from "../engine/round.js";
import { findGhost } from "../ghost/ghost.js";
import { KEY } from "../storage/store.js";
import { createApp } from "./app.js";
import { makeEnv, NOW } from "./appTestKit.js";
import { localDay } from "./roundRecord.js";

/** A finished round where every word is "cat"; `slow` stretches the time, so the speed drops. */
function played(mode, id, slow = 1) {
  let s = createRound({
    mode,
    mechanic: "falling",
    items: [{ id: "w1", text: "cat" }],
    seed: 1,
    speed: 1,
  }).state;
  s = { ...s, activeMs: 6000 * slow, spawnWaitMs: 0 };
  for (let i = 0; i < 3; i++) {
    for (const c of "cat") s = key(s, c).state;
    s = { ...s, spawnWaitMs: 0 };
  }
  const ended = endRound(s).state;
  const meta = { id, date: NOW, packId: "general", lessonId: null, drillSource: null };
  return { result: toResult(ended, meta), keys: ended.keystrokes };
}
function boot() {
  const h = makeEnv();
  const app = createApp(h.env);
  app.start();
  return { app, ...h };
}

test("a first best in Falling words becomes its ghost, saved in storage", () => {
  const h = boot();
  const { result, keys } = played("falling", "r1");
  const r = h.app.finishRound(result, localDay(NOW), null, keys);
  assert.deepEqual(r.ghost, { raced: null, saved: true });
  const g = findGhost(h.app.state.progress, "falling", "general");
  assert.equal(g.wpm, result.wpm);
  assert.equal(g.keystrokes.length, keys.length);
  assert.equal(JSON.parse(h.data.get(KEY)).ghosts.length, 1);
});

test("a slower round races the ghost and keeps it; a faster one replaces it", () => {
  const h = boot();
  const first = played("daily", "r1");
  h.app.finishRound(first.result, localDay(NOW), null, first.keys);
  const slower = played("daily", "r2", 2);
  const r = h.app.finishRound(slower.result, localDay(NOW), null, slower.keys);
  assert.deepEqual(r.ghost, { raced: first.result.wpm, saved: false });
  assert.equal(findGhost(h.app.state.progress, "daily", "general").wpm, first.result.wpm);
});

test("no keystrokes (Play these keys, lessons) or a mode with no ghost: nothing saved", () => {
  const h = boot();
  const a = played("falling", "r1");
  assert.equal(h.app.finishRound(a.result, localDay(NOW)).ghost.saved, false);
  const b = played("practice", "r2");
  assert.equal(h.app.finishRound(b.result, localDay(NOW), null, b.keys).ghost.saved, false);
  assert.deepEqual(h.app.state.progress.ghosts, []);
});
