// The pace estimate (picker speed line): grows with speed and with each wave, and matches the
// table Shara approved on Nov 12 (1× is about 30 WPM at wave 1).
import assert from "node:assert/strict";
import { test } from "node:test";
import { averageLength, paceWpm } from "./pace.js";

test("average length counts characters, and an empty list is 0", () => {
  assert.equal(averageLength([{ text: "ab" }, { text: "abcd" }]), 3);
  assert.equal(averageLength([]), 0);
});

test("wave 1 at 1× with the general pack's word length asks about 30 WPM (Shara, Nov 12)", () => {
  assert.equal(paceWpm({ speed: 1, avgLength: 5.66 }), 30);
});

test("doubling the speed doubles the pace", () => {
  assert.equal(paceWpm({ speed: 2, avgLength: 5.66 }), 60);
});

test("the Nov 12 curve: about 30, 31, 46, 67 and 93 WPM at waves 1, 2, 4, 7 and 10", () => {
  const at = (wave) => paceWpm({ speed: 1, wave, avgLength: 5.66 });
  assert.deepEqual([1, 2, 4, 7, 10].map(at), [30, 31, 46, 67, 93]);
});

test("each wave asks for more, and corners caps words at 4", () => {
  const w = [1, 2, 3, 4].map((wave) => paceWpm({ speed: 1, wave, avgLength: 5 }));
  for (let i = 1; i < w.length; i++) assert.ok(w[i] > w[i - 1], String(w));
  assert.ok(
    paceWpm({ speed: 1, wave: 10, avgLength: 5, mechanic: "corners" }) <
      paceWpm({ speed: 1, wave: 10, avgLength: 5 }),
  );
});
