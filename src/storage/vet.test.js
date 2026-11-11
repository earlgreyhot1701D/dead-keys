// Req 3: the four vet checks (Deferred-to-Block-4 rows from Blocks 2 and 3).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { vet } from "./vet.js";

const fixture = (path) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${path}`, import.meta.url), "utf8")).value;
const base = () => structuredClone(fixture("normal/progress.basic.json"));
const messages = (p) => vet(p).map((e) => `${e.path}: ${e.message}`);

/** Add an own property even for "__proto__" (assignment would set the prototype instead). */
const own = (obj, key, value) =>
  Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });

/** Freeze deep, so any mutation throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

test("good saves pass: the normal fixture, a full 200-round save, an empty one", () => {
  assert.deepEqual(vet(base()), []);
  assert.deepEqual(vet(fixture("ugly/progress.200-rounds-all-keys.json")), []);
  assert.deepEqual(vet(fixture("ugly/progress.zero-rounds.json")), []);
});

// Rule 1
test("rule 1: every keyDeltas key must be exactly one character", () => {
  for (const bad of ["ab", "", "Shift", "\u0061\u0301".repeat(2)]) {
    const p = base();
    p.rounds[0].keyDeltas = { [bad]: { attempts: 1, misses: 0 } };
    const got = vet(p);
    assert.equal(got.length, 1, JSON.stringify(bad));
    assert.equal(got[0].path, "rounds[0].keyDeltas");
    assert.match(got[0].message, /not one character/);
  }
});

test("rule 1: a single character passes, including ñ, ¿ and an emoji (one code point)", () => {
  for (const ok of ["a", "A", ";", "ñ", "¿", "😀"]) {
    const p = base();
    p.rounds[0].keyDeltas = { [ok]: { attempts: 1, misses: 0 } };
    assert.deepEqual(vet(p), [], ok);
  }
});

test("rule 1: every keys[].key must be exactly one character", () => {
  const p = base();
  p.keys.push({ key: "ab", attempts: 1, misses: 0, lastSeen: 1 });
  const got = messages(p);
  assert.equal(got.length, 1);
  assert.match(got[0], /^keys\[2\]\.key: .*not one character/);
});

// Rule 2
test("rule 2: bests keys must be real modes, and never practice", () => {
  const entry = { wpm: 30, date: 1 };
  for (const bad of ["practice", "karate", "", "Corners", "constructor"]) {
    const p = base();
    p.bests = { [bad]: entry };
    assert.ok(vet(p).length >= 1, JSON.stringify(bad));
  }
  const good = base();
  good.bests = Object.fromEntries(
    ["corners", "falling", "lesson", "testout", "daily", "specwave"].map((m) => [m, entry]),
  );
  assert.deepEqual(vet(good), []);
});

test("rule 2: the practice message says why", () => {
  const p = base();
  p.bests = { practice: { wpm: 30, date: 1 } };
  assert.match(messages(p)[0], /^bests: "practice" is not a mode that can have a best$/);
});

// Rule 3
test("rule 3: lastDay must be null or a real calendar date", () => {
  for (const bad of [
    "2026-02-30",
    "2027-02-29",
    "2026-13-01",
    "2026-00-10",
    "2026-1-1",
    "tomorrow",
    "",
  ]) {
    const p = base();
    p.dayStreak = { lastDay: bad, count: 1 };
    const got = vet(p);
    assert.equal(got.length, 1, JSON.stringify(bad));
    assert.equal(got[0].path, "dayStreak.lastDay");
  }
  for (const ok of [null, "2026-10-26", "2028-02-29", "2026-12-31"]) {
    const p = base();
    p.dayStreak = { lastDay: ok, count: ok === null ? 0 : 1 };
    assert.deepEqual(vet(p), [], String(ok));
  }
});

// Rule 4
test("rule 4: __proto__, constructor and prototype are refused anywhere in the tree", () => {
  for (const banned of ["__proto__", "constructor", "prototype"]) {
    const spots = [
      (p, v) => own(p, banned, JSON.parse(v)),
      (p, v) => own(p.settings, banned, JSON.parse(v)),
      (p, v) => own(p.rounds[0].keyDeltas, banned, JSON.parse(v)),
      (p, v) => own(p.bests, banned, JSON.parse(v)),
      (p, v) => p.ghosts.push(own({}, banned, JSON.parse(v))),
    ];
    for (const put of spots) {
      const p = base();
      put(p, '{"x": 1}');
      const got = messages(p).filter((m) => m.includes(`"${banned}" is not allowed`));
      assert.equal(got.length >= 1, true, `${banned}: ${JSON.stringify(messages(p))}`);
    }
  }
});

test("rule 4: it also catches a banned key whose value is a plain number or null", () => {
  for (const value of ["1", "null", '"x"', "[]"]) {
    const p = base();
    p.settings = JSON.parse(`{"__proto__": ${value}}`);
    assert.ok(
      messages(p).some((m) => m.includes("__proto__")),
      value,
    );
  }
});

test("rule 4: the path names where the key was found", () => {
  const p = base();
  p.settings = JSON.parse('{"deep": [{"constructor": 1}]}');
  assert.deepEqual(messages(p), ['settings.deep[0]: key "constructor" is not allowed']);
});

test("rule 4: a very deep tree does not overflow the stack", () => {
  const p = base();
  let node = {};
  p.settings = node;
  for (let i = 0; i < 100_000; i++) {
    node.n = {};
    node = node.n;
  }
  node.constructor = 1;
  const got = vet(p);
  assert.ok(got.some((e) => e.message.includes("constructor")));
});

// Safety
test("it never throws and always returns well-formed problems, whatever it is given", () => {
  fc.assert(
    fc.property(fc.anything(), (value) => {
      const got = vet(value);
      assert.ok(Array.isArray(got));
      for (const e of got) assert.ok(typeof e.path === "string" && typeof e.message === "string");
    }),
  );
  fc.assert(
    fc.property(fc.jsonValue(), (value) => {
      assert.ok(Array.isArray(vet(value)));
    }),
  );
});

test("junk shapes in the fields it reads do not throw", () => {
  const junk = [null, 5, "x", [], {}, [null], [[]], [{ keyDeltas: 5 }], [{ keyDeltas: null }]];
  for (const j of junk) {
    for (const field of ["rounds", "keys", "bests", "dayStreak"]) {
      assert.ok(Array.isArray(vet({ [field]: j })), field);
    }
  }
  assert.deepEqual(vet(null), [{ path: "", message: "progress is not an object" }]);
  assert.equal(vet([]).length, 1);
  assert.equal(vet("text").length, 1);
});

test("the input is never changed, good or bad", () => {
  assert.deepEqual(vet(freeze(base())), []);
  const bad = base();
  bad.rounds[0].keyDeltas = { ab: { attempts: 1, misses: 0 } };
  bad.bests = { practice: { wpm: 1, date: 1 } };
  bad.dayStreak = { lastDay: "nope", count: 1 };
  own(bad.settings, "__proto__", { x: 1 });
  const before = JSON.stringify(bad);
  assert.ok(vet(freeze(bad)).length >= 4);
  assert.equal(JSON.stringify(bad), before);
});

test("hostile input cannot build a huge list: at most 50 problems", () => {
  const p = base();
  p.rounds[0].keyDeltas = Object.fromEntries(
    Array.from({ length: 5000 }, (_, i) => [`k${i}`, { attempts: 1, misses: 0 }]),
  );
  assert.equal(vet(p).length, 50);
});
