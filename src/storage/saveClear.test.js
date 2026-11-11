// Req 5: save and clear, with a stand-in storage that can throw on any call.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { freshProgress } from "./migrate.js";
import { clear, save } from "./saveClear.js";
import { CORRUPT_KEY, KEY, load, readCorrupt } from "./store.js";

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

test("a storage that refuses (full or blocked) gives saveFailed with reason storage, and keeps the old save", () => {
  const old = JSON.stringify(good());
  for (const opts of [{ failSet: [KEY] }, { throwOn: ["setItem"] }]) {
    const s = makeStorage({ [KEY]: old }, opts);
    assert.deepEqual(save(s, { ...good(), createdAt: 5 }), {
      notice: "saveFailed",
      reason: "storage",
    });
    assert.equal(s.data.get(KEY), old);
  }
});

test("missing storage is reason storage too", () => {
  for (const s of [null, undefined, {}, "x"]) {
    assert.deepEqual(save(s, good()), { notice: "saveFailed", reason: "storage" });
  }
});

test("progress that fails the contract or a vet check is never written, with reason invalid", () => {
  const old = JSON.stringify(good());
  const noStreak = good();
  delete noStreak.dayStreak;
  const badDay = good();
  badDay.dayStreak = { lastDay: "2026-02-30", count: 1 };
  for (const bad of [noStreak, badDay, null, undefined, 5, "text", [], {}]) {
    const s = makeStorage({ [KEY]: old });
    assert.deepEqual(save(s, bad), { notice: "saveFailed", reason: "invalid" });
    assert.deepEqual(s.calls, []); // storage was not even touched
  }
});

test("a bug cannot pass as a full disk: invalid progress to a full storage still says invalid", () => {
  const s = makeStorage({}, { failSet: [KEY] });
  assert.equal(save(s, {}).reason, "invalid");
  assert.equal(save(s, good()).reason, "storage");
});

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

test("clear after a corrupt load removes the copy too", () => {
  const s = makeStorage({ [KEY]: "junk{" });
  load(s, NOW);
  assert.equal(readCorrupt(s), "junk{");
  clear(s, NOW);
  assert.equal(readCorrupt(s), null);
  assert.equal(s.data.has(KEY), false);
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

test("a bad clock is a programmer error", () => {
  for (const now of [-1, 1.5, Number.NaN, "5", null, undefined]) {
    assert.throws(() => clear(makeStorage(), now), TypeError);
  }
});

test("random mixes of throwing calls never crash save or clear", () => {
  const methods = fc.subarray(["getItem", "setItem", "removeItem"]);
  const keys = fc.subarray([KEY, CORRUPT_KEY]);
  fc.assert(
    fc.property(methods, keys, (throwOn, failSet) => {
      const s = makeStorage({ [KEY]: "x", [CORRUPT_KEY]: "y" }, { throwOn, failSet });
      const a = save(s, good());
      assert.ok(a.notice === null || (a.notice === "saveFailed" && a.reason === "storage"));
      assert.ok(["blocked", null].includes(clear(s, NOW).notice));
    }),
  );
});
