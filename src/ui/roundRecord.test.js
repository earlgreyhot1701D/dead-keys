// Recording a round (Req 7.1, Full rigor): a real round is folded in and saved; nothing is ever
// written while persist is false; a bad round never reaches progress or storage; the same round
// twice counts once; new best, new milestones and the last round in the mode come back.
import assert from "node:assert/strict";
import { test } from "node:test";
import { endRound } from "../engine/lifecycle.js";
import { toResult } from "../engine/result.js";
import { createRound, key } from "../engine/round.js";
import { KEY } from "../storage/store.js";
import { createApp } from "./app.js";
import { makeEnv, NOW } from "./appTestKit.js";
import { localDay } from "./roundRecord.js";

/** A finished round of `mode` where every word typed is "cat" and all keys are right. */
function played(mode = "falling", id = "round-1", date = NOW, words = 3) {
  let s = createRound({
    mode,
    mechanic: mode === "corners" ? "corners" : "falling",
    items: [{ id: "w1", text: "cat" }],
    seed: 1,
    speed: 1,
  }).state;
  s = { ...s, activeMs: 6000, spawnWaitMs: 0 };
  for (let i = 0; i < words; i++) {
    for (const c of "cat") s = key(s, c).state;
    s = { ...s, spawnWaitMs: 0 };
  }
  const ended = endRound(s).state;
  return toResult(ended, { id, date, packId: "general", lessonId: null, drillSource: null });
}
function boot(opts) {
  const h = makeEnv(opts);
  const app = createApp(h.env);
  app.start();
  return { app, ...h };
}
const saved = (h) => JSON.parse(h.data.get(KEY));

test("a finished round is recorded and saved, and its first best comes back", () => {
  const h = boot();
  const r = h.app.finishRound(played(), localDay(NOW));
  assert.equal(r.recorded, true);
  assert.equal(r.saved, true);
  assert.deepEqual(r.newBest, { wpm: played().wpm, old: null });
  assert.equal(r.previous, null);
  assert.ok(r.milestones.length > 0, "a first best earns its milestones");
  assert.equal(h.app.state.progress.rounds.length, 1);
  assert.equal(saved(h).rounds[0].id, "round-1");
  assert.equal(h.app.state.notice, null);
});

test("the same round twice counts once and writes nothing more", () => {
  const h = boot();
  h.app.finishRound(played(), localDay(NOW));
  const writes = h.writes();
  const again = h.app.finishRound(played(), localDay(NOW));
  assert.equal(again.recorded, false);
  assert.equal(h.writes(), writes);
  assert.equal(h.app.state.progress.rounds.length, 1);
});

test("a slower second round: no new best, and the last round in that mode comes back", () => {
  const h = boot();
  h.app.finishRound(played("falling", "a", NOW, 4), localDay(NOW));
  const r = h.app.finishRound(played("falling", "b", NOW + 1, 2), localDay(NOW));
  assert.equal(r.newBest, null);
  assert.equal(r.previous.id, "a");
  const c = h.app.finishRound(played("corners", "c", NOW + 2), localDay(NOW));
  assert.equal(c.previous, null, "another mode's round is not 'your last corners round'");
});

test("nothing is ever written while persist is false; the round still counts in memory", () => {
  for (const opts of [{ noStorage: true }, { initial: { [KEY]: '{"schemaVersion":99}' } }]) {
    const h = boot(opts);
    assert.equal(h.app.state.persist, false);
    const before = h.writes();
    const r = h.app.finishRound(played(), localDay(NOW));
    assert.equal(r.recorded, true);
    assert.equal(r.saved, false);
    assert.equal(h.writes(), before);
    assert.equal(h.app.state.progress.rounds.length, 1);
  }
});

test("a full disk: the round counts, the saveFailed notice shows, the game goes on", () => {
  const h = boot({ failSet: [KEY] });
  const r = h.app.finishRound(played(), localDay(NOW));
  assert.equal(r.recorded, true);
  assert.equal(r.saved, false);
  assert.equal(h.app.state.notice, "saveFailed");
});

test("a round that fails the contract never reaches progress or storage", () => {
  for (const bad of [{ ...played(), accuracy: 2 }, { ...played(), mode: "arcade" }, null]) {
    const h = boot();
    const r = h.app.finishRound(bad, localDay(NOW));
    assert.equal(r.recorded, false);
    assert.equal(r.saved, false);
    assert.equal(h.writes(), 0);
    assert.equal(h.app.state.progress.rounds.length, 0);
    assert.equal(h.app.state.notice, "saveFailed");
  }
});

test("the local day is the player's own calendar day, YYYY-MM-DD", () => {
  const d = new Date(2026, 10, 12, 23, 59);
  assert.equal(localDay(d.getTime()), "2026-11-12");
  assert.equal(localDay(new Date(2027, 0, 1, 0, 0).getTime()), "2027-01-01");
});
