// Req 2.7 and Req 5: save, clear, readCorrupt, freshProgress (split from store.test.js at the line cap).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { migrate } from "./migrate.js";
import { CORRUPT_KEY, clear, freshProgress, KEY, load, readCorrupt, save } from "./store.js";
import { vet } from "./vet.js";

const NOW = 1_800_000_000_000;
const fixture = (path) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${path}`, import.meta.url), "utf8")).value;
const good = () => structuredClone(fixture("normal/progress.basic.json"));

/** A stand-in storage. `throwOn` lists methods that throw; `failSet` lists keys setItem refuses. */
function makeStorage(initial = {}, { throwOn = [], failSet = [] } = {}) {
  const data = new Map(Object.entries(initial));
  const calls = [];
  const wrap =
    (name, fn) =>
    (...args) => {
      calls.push([name, ...args]);
      if (throwOn.includes(name)) throw new Error(`${name} is blocked`);
      return fn(...args);
    };
  return {
    data,
    calls,
    getItem: wrap("getItem", (k) => (data.has(k) ? data.get(k) : null)),
    setItem: wrap("setItem", (k, v) => {
      if (failSet.includes(k)) throw new Error("quota exceeded");
      data.set(k, String(v));
    }),
    removeItem: wrap("removeItem", (k) => data.delete(k)),
  };
}

/** Freeze deep, so any mutation throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

// freshProgress
test("fresh progress is the design's empty save, valid and clean", () => {
  const p = freshProgress(NOW);
  assert.deepEqual(p, {
    schemaVersion: 1,
    createdAt: NOW,
    rounds: [],
    keys: [],
    bests: {},
    dayStreak: { lastDay: null, count: 0 },
    lessonsPassed: [],
    milestones: [],
    settings: {},
    ghosts: [],
  });
  assert.equal(validate("Progress", p).status, "valid");
  assert.deepEqual(vet(p), []);
});

test("fresh progress matches what an upgrade from version 0 starts from", () => {
  assert.deepEqual(freshProgress(NOW), migrate({ schemaVersion: 0 }, NOW).progress);
});

test("each fresh progress is its own object, so one cannot change another", () => {
  const a = freshProgress(NOW);
  const b = freshProgress(NOW);
  a.rounds.push(1);
  a.settings.x = 1;
  a.dayStreak.count = 9;
  assert.deepEqual(b, freshProgress(NOW));
});

test("a bad clock is a programmer error", () => {
  for (const now of [-1, 1.5, Number.NaN, "5", null, undefined]) {
    assert.throws(() => freshProgress(now), TypeError);
    assert.throws(() => clear(makeStorage(), now), TypeError);
  }
});

// save
test("save writes the whole progress to deadkeys:v1 and says nothing", () => {
  const s = makeStorage();
  assert.deepEqual(save(s, freeze(good())), { notice: null });
  assert.deepEqual(JSON.parse(s.data.get(KEY)), good());
  assert.deepEqual(
    s.calls.map(([n, k]) => [n, k]),
    [["setItem", KEY]],
  );
});

test("save then load gives back the same progress", () => {
  for (const p of [good(), fixture("ugly/progress.200-rounds-all-keys.json"), freshProgress(NOW)]) {
    const s = makeStorage();
    assert.deepEqual(save(s, p), { notice: null });
    assert.deepEqual(load(s, NOW).progress, p);
  }
});

test("a save that throws (full or blocked) gives the saveFailed notice and keeps the old save", () => {
  const old = JSON.stringify(good());
  for (const opts of [{ failSet: [KEY] }, { throwOn: ["setItem"] }]) {
    const s = makeStorage({ [KEY]: old }, opts);
    assert.deepEqual(save(s, { ...good(), createdAt: 5 }), { notice: "saveFailed" });
    assert.equal(s.data.get(KEY), old);
  }
});

test("progress that fails the contract or a vet check is never written", () => {
  const old = JSON.stringify(good());
  const noStreak = good();
  delete noStreak.dayStreak;
  const badDay = good();
  badDay.dayStreak = { lastDay: "2026-02-30", count: 1 };
  for (const bad of [noStreak, badDay, null, undefined, 5, "text", [], {}]) {
    const s = makeStorage({ [KEY]: old });
    assert.deepEqual(save(s, bad), { notice: "saveFailed" });
    assert.deepEqual(s.calls, []);
  }
});

test("save to missing storage fails cleanly", () => {
  for (const s of [null, undefined, {}, "x"])
    assert.deepEqual(save(s, good()), { notice: "saveFailed" });
});

// clear
test("clear removes both keys and returns fresh progress", () => {
  const s = makeStorage({ [KEY]: JSON.stringify(good()), [CORRUPT_KEY]: "old{" });
  const r = clear(s, NOW);
  assert.equal(s.data.has(KEY), false);
  assert.equal(s.data.has(CORRUPT_KEY), false);
  assert.deepEqual(r, { progress: freshProgress(NOW), notice: null, persist: true });
});

test("clear on empty storage is fine", () => {
  assert.deepEqual(clear(makeStorage(), NOW).notice, null);
});

test("if storage refuses to remove, clear says blocked and still tries both keys", () => {
  const s = makeStorage({ [KEY]: "a", [CORRUPT_KEY]: "b" }, { throwOn: ["removeItem"] });
  const r = clear(s, NOW);
  assert.equal(r.notice, "blocked");
  assert.equal(r.persist, false);
  assert.equal(s.calls.filter(([n]) => n === "removeItem").length, 2);
  assert.deepEqual(r.progress, freshProgress(NOW));
});

test("clear with missing storage is blocked", () => {
  for (const s of [null, undefined, {}]) {
    const r = clear(s, NOW);
    assert.equal(r.notice, "blocked");
    assert.equal(r.persist, false);
  }
});

// readCorrupt
test("readCorrupt returns the raw damaged text, or null", () => {
  assert.equal(readCorrupt(makeStorage({ [CORRUPT_KEY]: "damaged{" })), "damaged{");
  assert.equal(readCorrupt(makeStorage()), null);
  assert.equal(readCorrupt(makeStorage({ [CORRUPT_KEY]: "x" }, { throwOn: ["getItem"] })), null);
  for (const s of [null, undefined, {}]) assert.equal(readCorrupt(s), null);
  const odd = makeStorage();
  odd.getItem = () => 42;
  assert.equal(readCorrupt(odd), null);
});

test("a damaged save can be downloaded after load: readCorrupt returns the original text", () => {
  const raw = '{"schemaVersion":1,"rounds":"oops"';
  const s = makeStorage({ [KEY]: raw });
  assert.equal(load(s, NOW).notice, "corrupt");
  assert.equal(readCorrupt(s), raw);
});

test("clear after a corrupt load removes the copy too", () => {
  const s = makeStorage({ [KEY]: "junk{" });
  load(s, NOW);
  assert.equal(readCorrupt(s), "junk{");
  clear(s, NOW);
  assert.equal(readCorrupt(s), null);
});

// Property: save and load agree for any good progress, and a throwing storage never crashes save.
test("random mixes of throwing calls never crash save, clear or readCorrupt", () => {
  const methods = fc.subarray(["getItem", "setItem", "removeItem"]);
  const keys = fc.subarray([KEY, CORRUPT_KEY]);
  fc.assert(
    fc.property(methods, keys, (throwOn, failSet) => {
      const s = makeStorage({ [KEY]: "x", [CORRUPT_KEY]: "y" }, { throwOn, failSet });
      const a = save(s, good());
      assert.ok(a.notice === null || a.notice === "saveFailed");
      assert.ok(["blocked", null].includes(clear(s, NOW).notice));
      const c = readCorrupt(s);
      assert.ok(c === null || typeof c === "string");
    }),
  );
});
