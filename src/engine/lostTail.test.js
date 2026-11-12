// When the word you were typing lands (Shara, Nov 12): its leftover letters are swallowed for a
// moment, so finishing it by habit never locks a different word or costs a miss.
import assert from "node:assert/strict";
import { test } from "node:test";
import { tick } from "./lifecycle.js";
import { LOST_TAIL_MS } from "./lostTail.js";
import { createRound, key } from "./round.js";

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
