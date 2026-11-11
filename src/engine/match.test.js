// Req 2: lock choice and keystroke matching.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { applyKey, pickLock } from "./match.js";

// Small alphabet with both cases, so collisions and case checks happen often.
const letter = fc.constantFrom(..."abAB;ñ");
const text = fc.array(letter, { minLength: 1, maxLength: 6 }).map((a) => a.join(""));

/** Targets with unique ids, a progress each, and some already part-typed. */
const targets = fc
  .array(
    fc.record({
      text,
      progress: fc.constantFrom(0, 0.25, 0.5, 0.5, 0.75, 1),
      skip: fc.nat(5),
    }),
    { maxLength: 8 },
  )
  .map((list) =>
    list.map((t, i) => ({
      id: i,
      itemId: `i${i}`,
      text: t.text,
      typed: Math.min(t.skip, [...t.text].length - 1),
      progress: t.progress,
      slot: i,
    })),
  )
  // Shuffle-proof: the answer must not depend on array order.
  .chain((list) => fc.shuffledSubarray(list, { minLength: list.length }));

const next = (t) => [...t.text][t.typed];

test("lock goes to the nearest-to-danger target that expects the character; ties to the lower id", () => {
  fc.assert(
    fc.property(targets, letter, (list, c) => {
      const got = pickLock(list, c);
      const cands = list.filter((t) => next(t) === c);
      if (cands.length === 0) return assert.equal(got, null);
      const top = Math.max(...cands.map((t) => t.progress));
      const want = Math.min(...cands.filter((t) => t.progress === top).map((t) => t.id));
      assert.equal(got.id, want);
    }),
  );
});

test("a lock never lands on a target whose next character differs", () => {
  fc.assert(
    fc.property(targets, letter, (list, c) => {
      const got = pickLock(list, c);
      if (got) assert.equal(next(got), c);
    }),
  );
});

test("case counts: A does not lock a", () => {
  const list = [{ id: 0, itemId: "x", text: "apple", typed: 0, progress: 0.9, slot: 0 }];
  assert.equal(pickLock(list, "A"), null);
  assert.equal(pickLock(list, "a").id, 0);
});

test("nearest to danger wins over spawn order; a tie goes to the first spawned", () => {
  const t = (id, progress) => ({ id, itemId: `i${id}`, text: "go", typed: 0, progress, slot: id });
  assert.equal(pickLock([t(0, 0.2), t(1, 0.8)], "g").id, 1);
  assert.equal(pickLock([t(1, 0.5), t(0, 0.5)], "g").id, 0);
});

test("pickLock does not change the targets", () => {
  fc.assert(
    fc.property(targets, letter, (list, c) => {
      const before = JSON.stringify(list);
      pickLock(list, c);
      assert.equal(JSON.stringify(list), before);
    }),
  );
});

test("a matching key advances the target by exactly one and never mutates it", () => {
  fc.assert(
    fc.property(text, (word) => {
      const t = Object.freeze({ id: 0, itemId: "x", text: word, typed: 0, progress: 0.5, slot: 0 });
      const r = applyKey(t, [...word][0]);
      assert.equal(r.ok, true);
      assert.equal(r.target.typed, 1);
      assert.equal(r.expected, [...word][0]);
      assert.equal(r.cleared, [...word].length === 1);
      assert.equal(t.typed, 0);
    }),
  );
});

test("a wrong key is a miss against the expected character and keeps the target as it was", () => {
  fc.assert(
    fc.property(text, letter, (word, c) => {
      fc.pre(c !== [...word][0]);
      const t = { id: 0, itemId: "x", text: word, typed: 0, progress: 0.5, slot: 0 };
      const r = applyKey(t, c);
      assert.equal(r.ok, false);
      assert.equal(r.expected, [...word][0]);
      assert.equal(r.cleared, false);
      assert.deepEqual(r.target, t);
    }),
  );
});

test("typing a whole word clears it on the last character and not before", () => {
  fc.assert(
    fc.property(text, (word) => {
      let t = { id: 0, itemId: "x", text: word, typed: 0, progress: 0.5, slot: 0 };
      const chars = [...word];
      chars.forEach((c, i) => {
        const r = applyKey(t, c);
        assert.equal(r.cleared, i === chars.length - 1);
        t = r.target;
      });
      assert.equal(t.typed, chars.length);
    }),
  );
});

test("case counts when typing: a capital must be typed as a capital", () => {
  const t = { id: 0, itemId: "x", text: "Ab", typed: 0, progress: 0, slot: 0 };
  assert.equal(applyKey(t, "a").ok, false);
  assert.equal(applyKey(t, "A").ok, true);
});

test("a character outside the basic range (ñ) counts as one", () => {
  const t = { id: 0, itemId: "x", text: "ñu", typed: 0, progress: 0, slot: 0 };
  assert.equal(applyKey(t, "ñ").target.typed, 1);
});

test("bad input is a programmer error", () => {
  const t = { id: 0, itemId: "x", text: "a", typed: 0, progress: 0, slot: 0 };
  for (const bad of ["", "ab", "Backspace", null, undefined, 5]) {
    assert.throws(() => pickLock([t], bad), TypeError);
    assert.throws(() => applyKey(t, bad), TypeError);
  }
  assert.throws(() => applyKey({ ...t, typed: 1 }, "a"), RangeError);
});
