// Req 5.8, 5.9 and design decisions 1 and 2: spawning limits, travel time, practice stands still.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import {
  BASE_TRAVEL_MS,
  SLOTS,
  SPEED_MAX,
  SPEED_MIN,
  TARGETS_MAX,
  TARGETS_START,
  WAVE_SPEEDUP,
} from "./config.js";
import { advance, spawn } from "./targets.js";

const items = [
  { id: "w1", text: "fad" },
  { id: "w2", text: "sad" },
  { id: "w3", text: "flask" },
];

/** Freeze deep, so any mutation by the engine throws. */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

const state = (over = {}) =>
  freeze({
    mechanic: "falling",
    mode: "falling",
    items,
    rng: 12345,
    speed: 1,
    wave: 1,
    targets: [],
    nextId: 0,
    ...over,
  });

const mechanic = fc.constantFrom("corners", "falling");
const wave = fc.integer({ min: 1, max: 30 });
const speed = fc.double({ min: SPEED_MIN, max: SPEED_MAX, noNaN: true });

/** Spawn until nothing more arrives. */
function fill(s) {
  for (let i = 0; i < 40; i++) {
    const r = spawn(s);
    if (r.state === s) return s;
    s = freeze({ ...r.state });
  }
  throw new Error("spawn never stopped");
}

const wantCap = (m, w) => Math.min(Math.min(TARGETS_START + w - 1, TARGETS_MAX), SLOTS[m]);

test("spawns fill up to min(wave limit, slots) and never past it", () => {
  fc.assert(
    fc.property(mechanic, wave, fc.integer(), (m, w, seed) => {
      const s = fill(state({ mechanic: m, mode: m, wave: w, rng: seed >>> 0 }));
      assert.equal(s.targets.length, wantCap(m, w));
    }),
  );
});

test("corners never holds more than 4 targets, even in a late wave", () => {
  const s = fill(state({ mechanic: "corners", mode: "corners", wave: 20 }));
  assert.equal(s.targets.length, 4);
});

test("falling starts at 3 and grows by one a wave up to 8", () => {
  assert.equal(fill(state({ wave: 1 })).targets.length, 3);
  assert.equal(fill(state({ wave: 2 })).targets.length, 4);
  assert.equal(fill(state({ wave: 20 })).targets.length, 8);
});

test("ids count up from the state, slots are in range and never shared", () => {
  fc.assert(
    fc.property(mechanic, wave, fc.integer(), (m, w, seed) => {
      const s = fill(state({ mechanic: m, mode: m, wave: w, rng: seed >>> 0, nextId: 7 }));
      assert.deepEqual(
        s.targets.map((t) => t.id),
        s.targets.map((_, i) => 7 + i),
      );
      assert.equal(s.nextId, 7 + s.targets.length);
      const slots = s.targets.map((t) => t.slot);
      assert.equal(new Set(slots).size, slots.length);
      for (const x of slots) assert.ok(Number.isInteger(x) && x >= 0 && x < SLOTS[m]);
    }),
  );
});

test("spawned targets come from the pack's items, untyped, at progress 0", () => {
  const s = fill(state({ wave: 20 }));
  for (const t of s.targets) {
    const item = items.find((i) => i.id === t.itemId);
    assert.ok(item);
    assert.equal(t.text, item.text);
    assert.equal(t.typed, 0);
    assert.equal(t.progress, 0);
  }
});

test("the same state spawns the same target (seeded, no hidden randomness)", () => {
  fc.assert(
    fc.property(fc.integer(), (seed) => {
      const a = spawn(state({ rng: seed >>> 0 }));
      const b = spawn(state({ rng: seed >>> 0 }));
      assert.deepEqual(a, b);
      assert.notEqual(a.state.rng, seed >>> 0);
    }),
  );
});

test("a full screen spawns nothing and hands back the same state", () => {
  const full = fill(state());
  assert.equal(spawn(full).state, full);
});

test("travel time follows BASE_TRAVEL_MS / (speed x WAVE_SPEEDUP^(wave-1))", () => {
  fc.assert(
    fc.property(wave, speed, fc.integer({ min: 0, max: 20000 }), (w, sp, dt) => {
      const t = { id: 0, itemId: "w1", text: "fad", typed: 0, progress: 0, slot: 0 };
      const s = state({ wave: w, speed: sp, targets: [t] });
      const travel = BASE_TRAVEL_MS / (sp * WAVE_SPEEDUP ** (w - 1));
      const got = advance(s, dt).state.targets[0].progress;
      assert.ok(Math.abs(got - Math.min(1, dt / travel)) < 1e-9, `${got} vs ${dt / travel}`);
    }),
  );
});

test("exactly one travel time takes a target to danger; later waves and faster speed are quicker", () => {
  const t = { id: 0, itemId: "w1", text: "fad", typed: 0, progress: 0, slot: 0 };
  const at = (w, sp, dt) => advance(state({ wave: w, speed: sp, targets: [t] }), dt);
  assert.deepEqual(at(1, 1, BASE_TRAVEL_MS).arrived, [0]);
  assert.deepEqual(at(1, 1, BASE_TRAVEL_MS - 1).arrived, []);
  assert.deepEqual(at(1, 2, BASE_TRAVEL_MS / 2).arrived, [0]);
  assert.deepEqual(at(1, 0.5, BASE_TRAVEL_MS).arrived, []);
  assert.ok(at(2, 1, 4000).state.targets[0].progress > at(1, 1, 4000).state.targets[0].progress);
});

test("progress stops at 1 and never goes backwards", () => {
  fc.assert(
    fc.property(wave, speed, fc.double({ min: 0, max: 1e7, noNaN: true }), (w, sp, dt) => {
      const t = { id: 0, itemId: "w1", text: "fad", typed: 0, progress: 0.4, slot: 0 };
      const p = advance(state({ wave: w, speed: sp, targets: [t] }), dt).state.targets[0].progress;
      assert.ok(p >= 0.4 && p <= 1);
    }),
  );
});

test("practice never moves, whatever the time", () => {
  fc.assert(
    fc.property(wave, speed, fc.double({ min: 0, max: 1e9, noNaN: true }), (w, sp, dt) => {
      const t = { id: 0, itemId: "w1", text: "fad", typed: 0, progress: 0.3, slot: 0 };
      const s = state({ mode: "practice", wave: w, speed: sp, targets: [t] });
      const r = advance(s, dt);
      assert.equal(r.state.targets[0].progress, 0.3);
      assert.deepEqual(r.arrived, []);
    }),
  );
});

test("practice still spawns up to the limit", () => {
  assert.equal(fill(state({ mode: "practice" })).targets.length, 3);
});

test("advance leaves typed progress and the lock-relevant fields alone", () => {
  const t = { id: 4, itemId: "w2", text: "sad", typed: 2, progress: 0.1, slot: 5 };
  const r = advance(state({ targets: [t] }), 100).state.targets[0];
  assert.deepEqual({ ...r, progress: 0 }, { ...t, progress: 0 });
});

test("bad input is a programmer error", () => {
  for (const dt of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => advance(state(), dt), RangeError);
  }
  assert.throws(() => spawn(state({ items: [] })), Error);
  assert.throws(() => spawn(state({ wave: 0 })), RangeError);
  assert.throws(() => spawn(state({ speed: 0 })), RangeError);
  assert.throws(() => advance(state({ speed: 3 }), 10), RangeError);
  for (const m of ["sideways", "constructor", "toString"]) {
    assert.throws(() => spawn(state({ mechanic: m })), RangeError);
  }
});
