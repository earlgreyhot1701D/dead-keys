// The attract demo's typist (attract Req 2): it plays the real engine, never misses, clears
// words, alternates layouts, and hands over after its time.
import assert from "node:assert/strict";
import { test } from "node:test";
import pack from "../../packs/general.json" with { type: "json" };
import { BOT_KEY_MS, botKey, DEMO_ROUND_MS, demoRound, demoStep } from "./bot.js";

const run = (mechanic, ms) => {
  let s = demoRound(mechanic, pack.pools.words, 84);
  const clock = { wait: 0 };
  const events = [];
  let done = false;
  for (let t = 0; t < ms && !done; t += 16) {
    const r = demoStep(s, 16, clock);
    s = r.state;
    events.push(...r.events);
    done = r.done;
  }
  return { s, events, done };
};

test("botKey: the locked word's next letter, else the first letter of the word nearest danger", () => {
  const targets = [
    { id: 1, text: "cat", typed: 0, progress: 0.2 },
    { id: 2, text: "dog", typed: 0, progress: 0.6 },
  ];
  assert.equal(botKey({ targets, lockId: null }), "d");
  assert.equal(botKey({ targets: [{ ...targets[0], typed: 2 }], lockId: 1 }), "t");
  assert.equal(botKey({ targets: [], lockId: null }), null);
});

for (const mechanic of ["falling", "corners"]) {
  test(`${mechanic}: the bot clears words and never misses`, () => {
    const { s, events } = run(mechanic, 20_000);
    assert.ok(s.cleared >= 5, `cleared ${s.cleared}`);
    assert.equal(events.filter((e) => e.type === "miss").length, 0);
    assert.equal(s.mode, mechanic);
  });
}

test("the bot keeps its pace: one key every BOT_KEY_MS", () => {
  const { s } = run("falling", 10_000);
  const n = s.keystrokes.length;
  assert.ok(n <= 10_000 / BOT_KEY_MS + 1 && n >= 10_000 / BOT_KEY_MS - 6, `${n} keys`);
});

test("a demo round hands over after DEMO_ROUND_MS", () => {
  const { done, s } = run("falling", DEMO_ROUND_MS + 5_000);
  assert.ok(done);
  assert.ok(s.activeMs <= DEMO_ROUND_MS + 16 || s.held || s.ended);
});
