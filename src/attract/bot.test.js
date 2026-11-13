// The attract demo's typist (attract Req 2): it plays the real engine, never misses, clears
// words, stays out from behind the title panel, and hands over after its time.
import assert from "node:assert/strict";
import { test } from "node:test";
import pack from "../../packs/general.json" with { type: "json" };
import {
  BOT_KEY_MS,
  botKey,
  DEMO_HIDDEN_SLOTS,
  DEMO_ROUND_MS,
  DEMO_SPEED,
  demoRound,
  demoStep,
  keepClear,
} from "./bot.js";

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

test("a demo round skips the warm-up and runs at DEMO_SPEED, so words fill the screen at once", () => {
  const s = demoRound("falling", pack.pools.words, 84);
  assert.equal(s.warmup, 0);
  assert.equal(s.speed, DEMO_SPEED);
  const { s: later } = run("falling", 3_000);
  assert.ok(later.targets.length + later.cleared >= 2, "two or more words in the first 3 s");
});

test("falling words never show behind the title panel; a word being typed never jumps", () => {
  for (let t = 0; t < 400; t += 1) {
    const { s } = run("falling", 50 + t * 37);
    for (const w of s.targets) {
      if (w.typed === 0 && w.id !== s.lockId)
        assert.ok(!DEMO_HIDDEN_SLOTS.includes(w.slot), w.slot);
    }
  }
  const typing = { mechanic: "falling", lockId: 7, targets: [{ id: 7, slot: 2, typed: 1 }] };
  assert.equal(keepClear(typing), typing);
  const full = {
    mechanic: "falling",
    lockId: null,
    targets: [0, 3, 5].map((slot, id) => ({ id, slot, typed: 0 })),
  };
  assert.deepEqual(
    keepClear(full).targets.map((w) => w.slot),
    [0, 5],
  );
  const corners = { mechanic: "corners", lockId: null, targets: [{ id: 1, slot: 2, typed: 0 }] };
  assert.equal(keepClear(corners), corners);
});

test("the demo plays Falling words only: Four corners would run every word behind the panel", async () => {
  const { DEMO_MECHANICS } = await import("./bot.js");
  assert.deepEqual([...DEMO_MECHANICS], ["falling"]);
});
