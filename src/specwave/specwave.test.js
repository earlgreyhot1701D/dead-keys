// The Spec Wave easter egg (specwave Reqs 1 and 2): the title's key watcher, the words, and the
// one-wave limit, which ends a real round right after its first wave.
import assert from "node:assert/strict";
import { test } from "node:test";
import { clockFor } from "../drills/limits.js";
import { tick } from "../engine/lifecycle.js";
import { createRound, key } from "../engine/round.js";
import { createEggWatch, createWaveWatch, EGG, SPEC_SAY, SPEC_WORDS } from "./specwave.js";

test("the egg watcher: k, i, r, o wait, wait, wait, then the egg; anything else starts", () => {
  const w = createEggWatch();
  assert.deepEqual(
    [..."kir"].map((k) => w.feed(k)),
    ["wait", "wait", "wait"],
  );
  assert.equal(w.feed("o"), "egg");
  assert.equal(w.feed("a"), "start");
  assert.equal(w.feed("K"), "wait"); // Caps Lock still counts
  assert.equal(w.feed("x"), "start"); // a wrong key mid-word starts the game, and resets
  assert.deepEqual([..."kiro"].map((k) => w.feed(k)).at(-1), "egg");
  assert.equal(EGG, "kiro");
});

test("the words: lowercase letters only, no repeats, enough for a wave, and no brand name", () => {
  const texts = SPEC_WORDS.map((w) => w.text);
  assert.ok(texts.every((t) => /^[a-z]{2,12}$/.test(t)));
  assert.equal(new Set(texts).size, texts.length);
  assert.ok(texts.length >= 10);
  assert.ok(!texts.includes("kiro"));
  for (const w of ["spec", "steering", "hook", "requirements", "design", "tasks", "agent"])
    assert.ok(texts.includes(w), w);
});

test("the wave watch ends once, after the last wave", () => {
  const w = createWaveWatch(1);
  assert.deepEqual(w({ wave: 1 }), { say: null, end: false });
  assert.deepEqual(w({ wave: 2 }), { say: SPEC_SAY.end, end: true });
  assert.deepEqual(w({ wave: 2 }), { say: null, end: false });
});

test("a real Spec Wave round ends right after wave 1", () => {
  let s = createRound({
    mode: "specwave",
    mechanic: "falling",
    items: SPEC_WORDS,
    seed: 1,
    speed: 1,
  }).state;
  const said = [];
  let ended = null;
  const clock = clockFor(
    { waves: 1 },
    (l) => said.push(l),
    (st) => (ended = st),
  );
  for (let i = 0; i < 4000 && !ended; i++) {
    s = tick(s, 16).state;
    const t = s.targets.find((x) => x.id === s.lockId) ?? s.targets[0];
    if (t && !s.held) s = key(s, [...t.text][t.typed]).state;
    clock(s);
  }
  assert.ok(ended, "ended");
  assert.equal(ended.wave, 2);
  assert.deepEqual(said, [SPEC_SAY.end]);
});
