// Req 2 and 3: createRound, key and Escape. Part 2 and 3 tests are added below as those land.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { LIVES_MAX, SLOTS, TARGETS_MAX, TARGETS_START } from "./config.js";
import { createRound, key, pressEscape } from "./round.js";

const items = [
  { id: "i1", text: "ab" },
  { id: "i2", text: "cd" },
  { id: "i3", text: "ef" },
  { id: "i4", text: "Ag" },
];
const opts = (over = {}) => ({
  mode: "falling",
  mechanic: "falling",
  items,
  seed: 99,
  speed: 1,
  ...over,
});

/** Freeze deep, so any mutation by the engine throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

/** A round with hand-placed targets, so tests know what is where. */
function withTargets(list, over = {}) {
  const { state } = createRound(opts(over));
  const targets = list.map(([id, text, progress], i) => ({
    id,
    itemId: `x${id}`,
    text,
    typed: 0,
    progress,
    slot: i,
  }));
  return freeze({ ...state, targets, nextId: 100 });
}

test("createRound fills the screen to the wave-1 limit, with no lock and no keystrokes", () => {
  const { state, events } = createRound(opts());
  assert.deepEqual(events, []);
  assert.equal(state.targets.length, TARGETS_START);
  assert.equal(state.lives, LIVES_MAX);
  assert.equal(state.lockId, null);
  assert.deepEqual(state.keystrokes, []);
  assert.equal(createRound(opts({ mechanic: "corners" })).state.targets.length, 3);
});

test("the same options give the same round", () => {
  fc.assert(
    fc.property(fc.integer(), (seed) => {
      assert.deepEqual(createRound(opts({ seed })), createRound(opts({ seed })));
    }),
  );
});

test("createRound throws on bad options", () => {
  const bad = [
    { mode: "arcade" },
    { mechanic: "sideways" },
    { mechanic: "constructor" },
    { items: [] },
    { items: [{ id: "a", text: "" }] },
    { items: [{ text: "a" }] },
    { speed: 0.1 },
    { speed: 3 },
    { seed: "7" },
  ];
  for (const b of bad) assert.throws(() => createRound(opts(b)), b.toString());
});

test("the first matching key locks the target nearest to danger", () => {
  const s = {
    ...withTargets([
      [0, "ab", 0.2],
      [1, "ax", 0.8],
    ]),
    activeMs: 100,
  };
  const r = key(s, "a");
  assert.equal(r.state.lockId, 1);
  assert.deepEqual(r.events, [{ type: "locked", targetId: 1 }]);
  assert.equal(r.state.targets.find((t) => t.id === 1).typed, 1);
  assert.deepEqual(r.state.keystrokes, [{ t: 100, expected: "a", typed: "a", ok: true }]);
  assert.deepEqual(r.state.keyDeltas, { a: { attempts: 1, misses: 0 } });
});

test("a wrong key on a locked target is a miss against the expected key and keeps the lock", () => {
  const s = key(withTargets([[0, "ab", 0.5]]), "a").state;
  const r = key(s, "z");
  assert.equal(r.state.lockId, 0);
  assert.deepEqual(r.events, [{ type: "miss", expected: "b", typed: "z" }]);
  assert.deepEqual(r.state.keyDeltas.b, { attempts: 1, misses: 1 });
  assert.equal(r.state.targets[0].typed, 1);
  assert.equal(r.state.keystrokes.at(-1).ok, false);
});

test("typing the last character clears the target, releases the lock and refills the screen", () => {
  let s = withTargets([[0, "ab", 0.5]]);
  s = key(s, "a").state;
  const r = key(s, "b");
  assert.deepEqual(r.events, [{ type: "cleared", targetId: 0 }]);
  assert.equal(r.state.lockId, null);
  assert.equal(r.state.cleared, 1);
  assert.equal(
    r.state.targets.some((t) => t.id === 0),
    false,
  );
  assert.equal(r.state.targets.length, TARGETS_START);
  assert.ok(r.state.targets.every((t) => t.id >= 100));
});

test("case counts: A does not lock or hit a", () => {
  const s = withTargets([[0, "ab", 0.5]]);
  assert.equal(key(s, "A").state.lockId, null);
  assert.equal(key(s, "a").state.lockId, 0);
});

test("a stray key (nothing expects it) counts as a keystroke but has no key delta", () => {
  const s = withTargets([[0, "ab", 0.5]]);
  const r = key(s, "z");
  assert.deepEqual(r.events, [{ type: "miss", expected: null, typed: "z" }]);
  assert.equal(r.state.strayKeys, 1);
  assert.deepEqual(r.state.keystrokes, []);
  assert.deepEqual(r.state.keyDeltas, {});
  assert.equal(r.state.lockId, null);
});

test("Backspace, Shift, empty and multi-character input are ignored: same state, no events", () => {
  const s = withTargets([[0, "ab", 0.5]]);
  for (const c of ["Backspace", "Shift", "", "ab", null, undefined, 5]) {
    const r = key(s, c);
    assert.equal(r.state, s);
    assert.deepEqual(r.events, []);
  }
});

test("a keystroke is logged at activeMs, rounded; two keys between ticks share a time", () => {
  let s = { ...withTargets([[0, "abc", 0.5]]), activeMs: 1234.6 };
  s = key(s, "a").state;
  s = key(s, "b").state;
  assert.deepEqual(
    s.keystrokes.map((k) => k.t),
    [1235, 1235],
  );
});

test("Escape is layered: drop the lock first, pause when nothing is locked", () => {
  let s = key(withTargets([[0, "abc", 0.5]]), "a").state;
  const dropped = pressEscape(s);
  assert.deepEqual(dropped.events, [{ type: "unlocked", targetId: 0 }]);
  assert.equal(dropped.state.lockId, null);
  assert.equal(dropped.state.paused, false);
  assert.equal(dropped.state.targets[0].typed, 0);
  s = dropped.state;
  const paused = pressEscape(s);
  assert.deepEqual(paused.events, [{ type: "paused" }]);
  assert.equal(paused.state.paused, true);
});

test("Escape while paused resumes, with the same state otherwise", () => {
  const s = withTargets([[0, "ab", 0.5]]);
  const paused = pressEscape(s).state;
  const r = pressEscape(paused);
  assert.deepEqual(r.events, [{ type: "resumed" }]);
  assert.deepEqual(r.state, s);
});

test("while paused, keys are ignored", () => {
  const paused = pressEscape(withTargets([[0, "ab", 0.5]])).state;
  const r = key(paused, "a");
  assert.equal(r.state, paused);
  assert.deepEqual(r.events, []);
});

test("held and ended rounds ignore keys and Escape", () => {
  const base = withTargets([[0, "ab", 0.5]]);
  for (const flag of [{ held: true }, { ended: true }]) {
    const s = freeze({ ...base, ...flag });
    assert.equal(key(s, "a").state, s);
    assert.equal(pressEscape(s).state, s);
  }
});

// Random play: any mix of keys and Escape keeps the state valid and never changes an input state.
const step = fc.oneof(
  fc.constantFrom(..."abcdefgAB;z"),
  fc.constantFrom("Backspace", "Shift", "ESC", "ESC"),
);

test("random keys and Escape never break the state or mutate an earlier one", () => {
  fc.assert(
    fc.property(fc.integer(), fc.array(step, { maxLength: 60 }), (seed, steps) => {
      let s = freeze(createRound(opts({ seed })).state);
      for (const c of steps) {
        const r = c === "ESC" ? pressEscape(s) : key(s, c);
        s = freeze(r.state);
        const cap = Math.min(TARGETS_START + s.wave - 1, TARGETS_MAX, SLOTS.falling);
        assert.ok(s.lives >= 0 && s.lives <= LIVES_MAX);
        assert.ok(s.targets.length <= cap);
        assert.ok(s.lockId === null || s.targets.some((t) => t.id === s.lockId));
        assert.equal(new Set(s.targets.map((t) => t.id)).size, s.targets.length);
        const attempts = Object.values(s.keyDeltas).reduce((n, d) => n + d.attempts, 0);
        assert.equal(attempts, s.keystrokes.length);
        for (const d of Object.values(s.keyDeltas)) assert.ok(d.misses <= d.attempts);
        for (const t of s.targets) assert.ok(t.typed < [...t.text].length);
      }
    }),
  );
});

test("the same inputs give the same state", () => {
  fc.assert(
    fc.property(fc.integer(), fc.array(step, { maxLength: 40 }), (seed, steps) => {
      const run = () =>
        steps.reduce(
          (s, c) => (c === "ESC" ? pressEscape(s) : key(s, c)).state,
          createRound(opts({ seed })).state,
        );
      assert.deepEqual(run(), run());
    }),
  );
});
