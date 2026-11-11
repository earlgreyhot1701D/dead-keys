// Req 3: the diagnosis.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { diagnose } from "./diagnose.js";
import {
  ENOUGH_DATA,
  GROUP_RATIO,
  GROUPS,
  HIGH_RATIO,
  MIN_KEY_ATTEMPTS,
} from "./progressConfig.js";

const st = (key, attempts, misses) => ({ key, attempts, misses, lastSeen: 1 });
const alphabet = [..."qwertasdfjkl;zxcvnm,./1234567890AB!?'"];

/** Saved stats: unique keys, valid counts, a spread of sizes. */
const stats = fc
  .uniqueArray(fc.constantFrom(...alphabet), { maxLength: 14 })
  .chain((ks) =>
    fc.tuple(
      ...ks.map((key) =>
        fc
          .integer({ min: 0, max: 200 })
          .chain((a) => fc.integer({ min: 0, max: a }).map((m) => st(key, a, m))),
      ),
    ),
  );

const rate = (x) => x.misses / x.attempts;
const groupOf = (text) => GROUPS.find((g) => text.startsWith(`Your ${g.phrase} `));

/** Freeze deep, so any mutation throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

test("the output always passes the Diagnosis contract", () => {
  fc.assert(
    fc.property(stats, (keys) => {
      const d = diagnose(keys);
      assert.equal(validate("Diagnosis", d).status, "valid", JSON.stringify(d));
    }),
  );
});

test("at most 3 sentences, worst first, severity matches the ratio", () => {
  fc.assert(
    fc.property(stats, (keys) => {
      const d = diagnose(keys);
      const all = { attempts: 0, misses: 0 };
      for (const k of keys) {
        all.attempts += k.attempts;
        all.misses += k.misses;
      }
      assert.ok(d.sentences.length <= 3);
      let last = Number.POSITIVE_INFINITY;
      for (const s of d.sentences) {
        const g = groupOf(s.text);
        assert.ok(g, s.text);
        const members = keys.filter((k) => g.has(k.key));
        const x = {
          attempts: members.reduce((n, k) => n + k.attempts, 0),
          misses: members.reduce((n, k) => n + k.misses, 0),
        };
        assert.ok(rate(x) <= last, "sentences are not worst first");
        last = rate(x);
        const ratio = rate(x) / (all.misses / all.attempts);
        assert.ok(ratio >= GROUP_RATIO - 1e-9);
        assert.equal(s.severity, ratio >= HIGH_RATIO - 1e-9 ? "high" : "medium");
      }
    }),
  );
});

test("sufficientData is true only at ENOUGH_DATA total attempts, and sentences are empty before", () => {
  fc.assert(
    fc.property(stats, (keys) => {
      const total = keys.reduce((n, k) => n + k.attempts, 0);
      const d = diagnose(keys);
      assert.equal(d.sufficientData, total >= ENOUGH_DATA);
      if (!d.sufficientData) assert.deepEqual(d.sentences, []);
    }),
  );
});

test("zero overall misses flags nothing and names no weak keys", () => {
  fc.assert(
    fc.property(stats, (keys) => {
      const d = diagnose(keys.map((k) => ({ ...k, misses: 0 })));
      assert.deepEqual(d.sentences, []);
      assert.deepEqual(d.weakKeys, []);
    }),
  );
});

test("sentences never say bad, slow or worse", () => {
  fc.assert(
    fc.property(stats, (keys) => {
      for (const s of diagnose(keys).sentences) assert.doesNotMatch(s.text, /bad|slow|worse/i);
    }),
  );
});

test("weak keys: up to 6, 10+ attempts, at least one miss, worst first, ties by attempts then key", () => {
  fc.assert(
    fc.property(stats, (keys) => {
      const weak = diagnose(keys).weakKeys;
      const pool = keys.filter((k) => k.attempts >= MIN_KEY_ATTEMPTS && k.misses > 0);
      assert.equal(weak.length, Math.min(6, pool.length));
      const order = (a, b) =>
        rate(b) - rate(a) || b.attempts - a.attempts || (a.key < b.key ? -1 : 1);
      const want = [...pool].sort(order).map((k) => k.key);
      assert.deepEqual(weak, want.slice(0, 6));
    }),
  );
});

test("the inputs are never changed, and the same input gives the same output", () => {
  fc.assert(
    fc.property(stats, (keys) => {
      assert.deepEqual(diagnose(freeze(keys)), diagnose(keys));
    }),
  );
});

test("example: the top row, at 1 in 6 and well over 3x the usual rate", () => {
  const d = diagnose([
    st("q", 30, 5),
    st("a", 100, 0),
    st("s", 100, 0),
    st("d", 100, 0),
    st("f", 100, 0),
  ]);
  assert.deepEqual(d, {
    sentences: [
      {
        text: "Your top row misses about 1 in 6 keys, at least three times your usual rate.",
        severity: "high",
        keys: ["q"],
      },
    ],
    weakKeys: ["q"],
    sufficientData: true,
  });
});

test("example: exactly 2x is medium, exactly 3x is high (no float rounding)", () => {
  const medium = diagnose([st("z", 100, 10), st("a", 100, 0)]);
  assert.deepEqual(
    medium.sentences.map((s) => [s.severity, s.text]),
    [["medium", "Your bottom row misses about 1 in 10 keys, at least twice your usual rate."]],
  );
  // overall 10 / 300; the home row sits at exactly 3x: 10 / 100
  const high = diagnose([st("a", 100, 10), st("q", 100, 0), st("z", 100, 0)]);
  assert.equal(high.sentences[0].severity, "high");
});

test("example: shift keys read as a plural", () => {
  const d = diagnose([st("A", 100, 20), st("a", 100, 0)]);
  assert.equal(
    d.sentences[0].text,
    "Your shift keys miss about 1 in 5 keys, at least twice your usual rate.",
  );
});

test("example: a group that misses nearly every key", () => {
  const d = diagnose([st("q", 20, 20), st("a", 100, 0)]);
  assert.equal(
    d.sentences[0].text,
    "Your top row misses most keys, at least three times your usual rate.",
  );
});

test("example: under 20 attempts a group is not flagged, at 20 it is", () => {
  assert.deepEqual(diagnose([st("q", 19, 19), st("a", 200, 0)]).sentences, []);
  assert.equal(diagnose([st("q", 20, 19), st("a", 200, 0)]).sentences.length, 1);
});

test("example: the 5% floor is inclusive, and just under it is not flagged", () => {
  assert.equal(diagnose([st("q", 40, 2), st("a", 400, 0)]).sentences.length, 1);
  assert.deepEqual(diagnose([st("q", 40, 1), st("a", 400, 0)]).sentences, []);
});

test("example: a group at the overall rate is not flagged, but its keys are still weak keys", () => {
  const d = diagnose([st("a", 100, 10), st("s", 100, 10)]);
  assert.deepEqual(d.sentences, []);
  assert.deepEqual(d.weakKeys, ["a", "s"]);
});

test("example: weak keys are named even before there is enough data", () => {
  const d = diagnose([st("a", 20, 5)]);
  assert.equal(d.sufficientData, false);
  assert.deepEqual(d.sentences, []);
  assert.deepEqual(d.weakKeys, ["a"]);
});

test("a sentence lists only its group's shaky or missed keys, worst first", () => {
  const d = diagnose([
    st("q", 100, 20), // missed, 20%
    st("w", 100, 10), // shaky, 10%
    st("e", 100, 4), // uneven, left out
    st("p", 100, 0),
    st("a", 1000, 0),
  ]);
  assert.deepEqual(d.sentences[0].keys, ["q", "w"]);
});

test("the sentence wording assumes the ratios 2 and 3", () => {
  assert.equal(GROUP_RATIO, 2);
  assert.equal(HIGH_RATIO, 3);
});

test("empty history: no data, no sentences, no weak keys", () => {
  assert.deepEqual(diagnose([]), { sentences: [], weakKeys: [], sufficientData: false });
});

test("malformed stats are a programmer error", () => {
  assert.throws(() => diagnose(null), TypeError);
  for (const bad of [
    st("a", 5, 6),
    st("a", -1, 0),
    st("a", 1.5, 0),
    st("ab", 5, 0),
    st("", 5, 0),
    null,
  ]) {
    assert.throws(() => diagnose([bad]), RangeError);
  }
  assert.throws(() => diagnose([st("a", 5, 0), st("a", 5, 0)]), RangeError);
});
