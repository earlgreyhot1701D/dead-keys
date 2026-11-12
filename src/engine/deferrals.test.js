// Block 7 deferrals (play Req 8): the wave speed cap, the ignored stray space, pause without
// dropping the lock, and the config constants the diagnosis and the contract share.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BASE_TRAVEL_MS, CHARS_PER_WORD, WAVE_SPEEDUP, WAVE_SPEEDUP_MAX_WAVE } from "./config.js";
import { diagnose } from "./diagnose.js";
import { pause, resume } from "./lifecycle.js";
import { MAX_SENTENCES, MAX_WEAK_KEYS } from "./progressConfig.js";
import { createRound, key, pressEscape } from "./round.js";
import { wpm } from "./score.js";
import { advance } from "./targets.js";

const items = [{ id: "w1", text: "cat" }];
// Past the warm-up, so the travel and lock rules are the wave's own.
const round = () => ({
  ...createRound({ mode: "falling", mechanic: "falling", items, seed: 1, speed: 1 }).state,
  warmup: 0,
});

test("waves stop speeding up after wave 10", () => {
  assert.equal(WAVE_SPEEDUP_MAX_WAVE, 10);
  const t = { id: 0, itemId: "w1", text: "cat", typed: 0, progress: 0, slot: 0 };
  const moved = (wave) =>
    advance({ ...round(), wave, targets: [t] }, 100).state.targets[0].progress;
  const at10 = moved(10);
  assert.ok(moved(9) < at10, "still speeding up before the cap");
  assert.equal(moved(11), at10);
  assert.equal(moved(40), at10);
  assert.ok(Math.abs(at10 - (100 * WAVE_SPEEDUP ** 9) / BASE_TRAVEL_MS) < 1e-12);
});

test("a space with no word locked is ignored, not counted", () => {
  const s = round();
  const r = key(s, " ");
  assert.equal(r.state, s); // the very same state
  assert.deepEqual(r.events, []);
  assert.equal(r.state.strayKeys, 0);
  assert.equal(r.state.keystrokes.length, 0);
  // any other stray key is still a counted miss
  const z = key(s, "z");
  assert.equal(z.state.strayKeys, 1);
});

test("a space while a word is locked is ignored too: no miss, no keystroke (Shara, Nov 12)", () => {
  const locked = key(round(), "c").state;
  const r = key(locked, " ");
  assert.equal(r.state, locked);
  assert.deepEqual(r.events, []);
});

test("pause keeps the lock (auto-pause); Escape pauses only with nothing locked", () => {
  const locked = key(round(), "c").state;
  const p = pause(locked);
  assert.equal(p.state.paused, true);
  assert.equal(p.state.lockId, locked.lockId);
  assert.deepEqual(p.events, [{ type: "paused" }]);
  assert.equal(pause(p.state).state, p.state); // already paused: ignored
  assert.equal(resume(p.state).state.lockId, locked.lockId);
  assert.deepEqual(pressEscape(locked).events, [{ type: "unlocked", targetId: locked.lockId }]);
  for (const flag of ["held", "ended"]) {
    const s = { ...locked, [flag]: true };
    assert.equal(pause(s).state, s, flag);
  }
});

test("WPM uses CHARS_PER_WORD from config", () => {
  assert.equal(CHARS_PER_WORD, 5);
  assert.equal(wpm(CHARS_PER_WORD * 30, 60000), 30);
});

test("the most sentences and weak keys come from config, and match the contract's maxItems", () => {
  const schema = JSON.parse(
    readFileSync(new URL("../../contract/schemas/diagnosis.json", import.meta.url), "utf8"),
  );
  assert.equal(MAX_SENTENCES, schema.properties.sentences.maxItems);
  assert.equal(MAX_WEAK_KEYS, schema.properties.weakKeys.maxItems);
  // twenty keys all missing often: weak keys stop at MAX_WEAK_KEYS
  const keys = [..."abcdefghijklmnopqrst"].map((k) => ({ key: k, attempts: 40, misses: 20 }));
  assert.equal(diagnose(keys).weakKeys.length, MAX_WEAK_KEYS);
});
