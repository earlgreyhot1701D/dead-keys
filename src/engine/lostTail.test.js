// When the word you were typing lands (Shara, Nov 12): its leftover letters are swallowed for a
// moment, so finishing it by habit never locks a different word or costs a miss.
import assert from "node:assert/strict";
import { test } from "node:test";
import { pause, resolveOutOfLives, tick } from "./lifecycle.js";
import { LOST_TAIL_MS } from "./lostTail.js";
import { createRound, key, pressEscape } from "./round.js";

const items = ["judge", "domestic", "egg"].map((text, i) => ({ id: `i${i}`, text }));
const word = (id, text, progress) => ({ id, itemId: `i${id}`, text, typed: 0, progress, slot: id });

/** "ju" typed into judge, which then lands. domestic and egg are still falling. */
function landed() {
  let s = createRound({ mode: "falling", mechanic: "falling", items, seed: 1, speed: 1 }).state;
  s = { ...s, warmup: 0, nextId: 3 };
  s = { ...s, targets: [word(0, "judge", 0.99), word(1, "domestic", 0.4), word(2, "egg", 0.1)] };
  for (const c of "ju") s = key(s, c).state;
  return tick(s, 200).state;
}

test("the leftover letters of the landed word are swallowed: no lock, no miss, no keystroke", () => {
  let s = landed();
  assert.equal(s.lives, 4);
  const before = s.keystrokes.length;
  for (const c of "dge") {
    const r = key(s, c);
    assert.deepEqual(r.events, [], c);
    s = r.state;
  }
  assert.equal(s.lockId, null);
  assert.equal(s.keystrokes.length, before);
  assert.equal(s.strayKeys, 0);
  assert.equal(s.lostTail, null);
  assert.equal(key(s, "d").state.lockId, 1, "after the tail, d locks domestic as usual");
});

test("a different key drops the tail at once and types normally", () => {
  const r = key(landed(), "e");
  assert.equal(r.state.lockId, 2); // egg
  assert.equal(r.state.lostTail, null);
});

test("the tail expires after LOST_TAIL_MS", () => {
  const s = landed();
  const late = { ...s, activeMs: s.activeMs + LOST_TAIL_MS + 1 };
  assert.equal(key(late, "d").state.lockId, 1);
});

test("Continue and pause both end the tail, so it never reaches a fresh screen", () => {
  const s = landed();
  assert.ok(s.lostTail);
  const held = { ...s, held: true };
  assert.equal(resolveOutOfLives(held, true).state.lostTail, null);
  assert.equal(pause(s).state.lostTail, null);
  assert.equal(pressEscape(s).state.lostTail, null); // nothing locked: Escape pauses
});

test("a tail partly swallowed, then a different key: that key types normally", () => {
  let s = key(landed(), "d").state; // swallowed
  s = key(s, "e").state; // not "g": drops the tail, locks egg
  assert.equal(s.lockId, 2);
  assert.equal(s.lostTail, null);
});

test("a warm-up word that lands leaves a tail too, and never costs a life", () => {
  let s = createRound({ mode: "falling", mechanic: "falling", items, seed: 1, speed: 1 }).state;
  s = { ...s, nextId: 3, targets: [word(0, "judge", 0.99)] };
  s = key(s, "j").state;
  const r = tick(s, 400);
  assert.equal(r.state.lives, s.lives);
  assert.ok(!r.events.some((e) => e.type === "lifeLost"));
  assert.equal(key(r.state, "u").state.lockId, null, "the u is swallowed");
});
