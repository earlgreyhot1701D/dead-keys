// createRound keeps its own copy of the items (split from round.test.js at the line cap).
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRound, key } from "./round.js";

const words = () => [
  { id: "a", text: "a" },
  { id: "b", text: "b" },
  { id: "c", text: "c" },
];
const opts = (items) => ({ mode: "falling", mechanic: "falling", items, seed: 5, speed: 1 });

test("the caller cannot change a running round by editing the items it passed in", () => {
  const mine = words();
  let live = createRound(opts(mine)).state;
  let calm = createRound(opts(words())).state;
  // Edit the caller's array and every item in it, mid-round.
  for (const i of mine) i.text = "zzz";
  mine.push({ id: "d", text: "d" });
  mine.length = 1;
  for (let n = 0; n < 12; n++) {
    for (const c of "abc") {
      live = key(live, c).state;
      calm = key(calm, c).state;
    }
  }
  assert.deepEqual(live, calm);
  assert.ok(live.cleared > 3, "the keys should have cleared several targets, spawning more");
});
