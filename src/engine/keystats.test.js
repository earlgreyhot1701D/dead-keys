// Req 1: merging a round into per-key stats.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { mergeRound } from "./keystats.js";

const alphabet = [..."asdfjkl;AB"];
const hits = fc
  .nat(40)
  .chain((attempts) => fc.record({ attempts: fc.constant(attempts), misses: fc.nat(attempts) }));

/** Saved stats: unique keys, valid counts. */
const savedKeys = fc
  .uniqueArray(fc.constantFrom(...alphabet), { maxLength: 6 })
  .chain((ks) =>
    fc.tuple(
      ...ks.map((key) =>
        fc
          .tuple(hits, fc.integer({ min: 0, max: 5_000_000 }))
          .map(([h, lastSeen]) => ({ key, ...h, lastSeen })),
      ),
    ),
  );

/** A round: just the parts the merge reads. */
const round = fc.record({
  date: fc.integer({ min: 0, max: 5_000_000 }),
  keyDeltas: fc
    .uniqueArray(fc.constantFrom(...alphabet), { maxLength: 6 })
    .chain((ks) => fc.tuple(...ks.map((k) => hits.map((h) => [k, h]))))
    .map(Object.fromEntries),
});

/** Freeze deep, so any mutation throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

const totals = (keys) =>
  Object.fromEntries(keys.map((k) => [k.key, [k.attempts, k.misses, k.lastSeen]]));

// One round has one date, so lastSeen is only compared across orderings, not across groupings.
const counts = (keys) => Object.fromEntries(keys.map((k) => [k.key, [k.attempts, k.misses]]));

test("order does not change the totals or lastSeen", () => {
  fc.assert(
    fc.property(savedKeys, round, round, (keys, a, b) => {
      assert.deepEqual(
        totals(mergeRound(mergeRound(keys, a), b)),
        totals(mergeRound(mergeRound(keys, b), a)),
      );
    }),
  );
});

test("merging one at a time or all at once gives the same totals", () => {
  fc.assert(
    fc.property(savedKeys, round, round, (keys, a, b) => {
      const sum = { ...a.keyDeltas };
      for (const [k, d] of Object.entries(b.keyDeltas)) {
        const o = sum[k] ?? { attempts: 0, misses: 0 };
        sum[k] = { attempts: o.attempts + d.attempts, misses: o.misses + d.misses };
      }
      assert.deepEqual(
        counts(mergeRound(mergeRound(keys, a), b)),
        counts(mergeRound(keys, { date: Math.max(a.date, b.date), keyDeltas: sum })),
      );
    }),
  );
});

test("the inputs are never changed", () => {
  fc.assert(
    fc.property(savedKeys, round, (keys, r) => {
      mergeRound(freeze(keys), freeze(r));
    }),
  );
});

test("keys not in the round are unchanged; keys in it get the round's date", () => {
  fc.assert(
    fc.property(savedKeys, round, (keys, r) => {
      const out = mergeRound(keys, r);
      for (const k of keys) {
        const got = out.find((o) => o.key === k.key);
        if (!(k.key in r.keyDeltas)) assert.deepEqual(got, k);
      }
      for (const key of Object.keys(r.keyDeltas)) {
        const got = out.find((o) => o.key === key);
        const old = keys.find((k) => k.key === key);
        const d = r.keyDeltas[key];
        assert.equal(got.lastSeen, Math.max(old?.lastSeen ?? 0, r.date));
        assert.equal(got.attempts, (old?.attempts ?? 0) + d.attempts);
        assert.equal(got.misses, (old?.misses ?? 0) + d.misses);
      }
    }),
  );
});

test("the output has one entry per key, and every entry passes the KeyStat contract", () => {
  fc.assert(
    fc.property(savedKeys, round, (keys, r) => {
      const out = mergeRound(keys, r);
      assert.equal(new Set(out.map((k) => k.key)).size, out.length);
      assert.equal(
        out.length,
        new Set([...keys.map((k) => k.key), ...Object.keys(r.keyDeltas)]).size,
      );
      for (const k of out) assert.equal(validate("KeyStat", k).status, "valid");
    }),
  );
});

test("the same input gives the same output, with new keys in key order after the old ones", () => {
  const keys = [{ key: "s", attempts: 1, misses: 0, lastSeen: 5 }];
  const r = {
    date: 9,
    keyDeltas: { z: { attempts: 1, misses: 0 }, a: { attempts: 2, misses: 1 } },
  };
  const out = mergeRound(keys, r);
  assert.deepEqual(
    out.map((k) => k.key),
    ["s", "a", "z"],
  );
  assert.deepEqual(out, mergeRound(keys, r));
});

test("an older round never moves lastSeen back", () => {
  const keys = [{ key: "a", attempts: 3, misses: 1, lastSeen: 500 }];
  const old = { date: 100, keyDeltas: { a: { attempts: 1, misses: 0 } } };
  assert.equal(mergeRound(keys, old)[0].lastSeen, 500);
  assert.equal(mergeRound(keys, { ...old, date: 900 })[0].lastSeen, 900);
});

test("an empty round changes nothing; an empty history starts fresh", () => {
  const keys = [{ key: "s", attempts: 3, misses: 1, lastSeen: 5 }];
  assert.deepEqual(mergeRound(keys, { date: 9, keyDeltas: {} }), keys);
  assert.deepEqual(mergeRound([], { date: 9, keyDeltas: { a: { attempts: 2, misses: 1 } } }), [
    { key: "a", attempts: 2, misses: 1, lastSeen: 9 },
  ]);
});

test("malformed input is a programmer error", () => {
  const ok = { date: 9, keyDeltas: { a: { attempts: 2, misses: 1 } } };
  assert.throws(() => mergeRound(null, ok), TypeError);
  assert.throws(() => mergeRound([], null), TypeError);
  assert.throws(() => mergeRound([], { date: 9 }), TypeError);
  assert.throws(() => mergeRound([], { date: 9, keyDeltas: [] }), TypeError);
  assert.throws(() => mergeRound([], { ...ok, date: -1 }), RangeError);
  assert.throws(() => mergeRound([], { ...ok, date: 1.5 }), RangeError);
  for (const bad of [
    { attempts: 1, misses: 2 },
    { attempts: -1, misses: 0 },
    { attempts: 1.5, misses: 0 },
    { attempts: 1 },
    null,
  ]) {
    assert.throws(() => mergeRound([], { date: 9, keyDeltas: { a: bad } }), RangeError);
  }
  const dup = [
    { key: "a", attempts: 1, misses: 0, lastSeen: 1 },
    { key: "a", attempts: 1, misses: 0, lastSeen: 1 },
  ];
  assert.throws(() => mergeRound(dup, ok), RangeError);
});
