// Strict but clear (Shara, Nov 12): a wrong key never moves a word on, and marks it as waiting
// on that letter so the screen can show it. The right key or Escape clears the mark.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRound, key, pressEscape } from "./round.js";

const items = [{ id: "w1", text: "cat" }];
const round = () => ({
  ...createRound({ mode: "falling", mechanic: "falling", items, seed: 1, speed: 1 }).state,
  warmup: 0,
});

test("a wrong key marks the locked word as waiting; the right key or Escape clears the mark", () => {
  const s0 = round();
  const locked = key(s0, "c").state;
  const missed = key(locked, "x").state;
  assert.equal(missed.targets[0].wrong, true);
  assert.equal(missed.targets[0].typed, 1, "a miss never moves the word on");
  assert.equal(key(missed, "a").state.targets[0].wrong, false);
  assert.equal(pressEscape(missed).state.targets[0].wrong, false);
});
