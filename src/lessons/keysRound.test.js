import assert from "node:assert/strict";
import test from "node:test";
import { createRound } from "../engine/round.js";
import { KEYS_MIN, keysItems } from "./keysRound.js";
import { learnedKeys } from "./ladder.js";

test("Lesson 0 has too few words, so no keys round", () => {
  assert.equal(keysItems("L00"), null);
});

test("every word uses only the learned keys, for Lessons 1 to 6", () => {
  for (const id of ["L01", "L02", "L03", "L04", "L05", "L06"]) {
    const items = keysItems(id);
    assert.ok(items && items.length >= KEYS_MIN, id);
    const keys = new Set(learnedKeys(id));
    for (const it of items)
      assert.ok(
        [...it.text].every((c) => keys.has(c)),
        `${id} ${it.text}`,
      );
  }
});

test("Lesson 1 words are home-row left hand words", () => {
  const texts = keysItems("L01").map((i) => i.text);
  assert.ok(texts.includes("sad") && texts.includes("add"));
  assert.ok(texts.every((t) => /^[asdfj]+$/.test(t)));
});

test("the items start a practice round", () => {
  const items = keysItems("L01");
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
  const r = createRound({ mode: "practice", mechanic: "falling", items, seed: 1, speed: 0.7 });
  assert.equal(r.state.mode, "practice");
});
