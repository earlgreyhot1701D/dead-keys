// Item weights (drills Req 1): miss rate plus DRILL_BASE per character, keys under the heat map's
// enough-data bar count as 0, keys matched exactly, every weight finite and above 0.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { MIN_KEY_ATTEMPTS } from "../engine/progressConfig.js";
import { DRILL_BASE, itemWeights, missRates } from "./weights.js";

const stat = (key, attempts, misses) => ({ key, attempts, misses, lastSeen: 0 });
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const word = fc.string({
  unit: fc.constantFrom(..."asdfqwerty ;,.ÑñA"),
  minLength: 1,
  maxLength: 20,
});
const stats = fc.array(
  fc
    .tuple(fc.constantFrom(..."asdfqwertyÑñA"), fc.nat(60), fc.nat(60))
    .map(([k, a, m]) => stat(k, Math.max(a, m), Math.min(a, m))),
  { maxLength: 15 },
);

test("DRILL_BASE is PRD G5's 0.05", () => assert.equal(DRILL_BASE, 0.05));

test("a word's weight is the sum of (miss rate + DRILL_BASE) over its characters", () => {
  const [w] = itemWeights([{ text: "qaq" }], [stat("q", 20, 10), stat("a", 10, 1)]);
  close(w, 0.5 + 0.05 + (0.1 + 0.05) + 0.5 + 0.05);
});

test("keys under the enough-data bar, or with no stats, count as a 0 miss rate", () => {
  const few = stat("q", MIN_KEY_ATTEMPTS - 1, MIN_KEY_ATTEMPTS - 1);
  close(itemWeights([{ text: "qq" }], [few])[0], 2 * DRILL_BASE);
  close(itemWeights([{ text: "qq" }], [stat("q", MIN_KEY_ATTEMPTS, 5)])[0], 2 * (0.5 + DRILL_BASE));
  assert.equal(missRates([few]).size, 0);
});

test("keys match exactly, as the heat map does: case counts", () => {
  const [lower, upper] = itemWeights([{ text: "a" }, { text: "A" }], [stat("a", 10, 10)]);
  close(lower, 1 + DRILL_BASE);
  close(upper, DRILL_BASE);
});

test("malformed stats are skipped, never turned into NaN; an item with no text throws", () => {
  const bad = [stat("q", 10, 11), stat("q", -1, 0), { key: "q" }, null];
  close(itemWeights([{ text: "q" }], bad)[0], DRILL_BASE);
  assert.throws(() => itemWeights([{ text: "" }], []), TypeError);
});

test("property: every weight is finite and above 0", () => {
  fc.assert(
    fc.property(fc.array(word, { minLength: 1, maxLength: 10 }), stats, (texts, ks) => {
      const ws = itemWeights(
        texts.map((text) => ({ text })),
        ks,
      );
      return ws.length === texts.length && ws.every((w) => Number.isFinite(w) && w > 0);
    }),
  );
});

test("property: with no stats every weight is DRILL_BASE times the length", () => {
  fc.assert(
    fc.property(word, (text) => {
      const [w] = itemWeights([{ text }], []);
      return Math.abs(w - DRILL_BASE * [...text].length) < 1e-9;
    }),
  );
});

test("property: a word of a fully missed key outweighs a same-length word of unseen keys", () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 10, max: 500 }), (n, a) => {
      const [missed, unseen] = itemWeights(
        [{ text: "q".repeat(n) }, { text: "z".repeat(n) }],
        [stat("q", a, a)],
      );
      return missed > unseen;
    }),
  );
});
