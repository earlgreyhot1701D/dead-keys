// Req 2: load, with a stand-in storage that can throw on any call.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { CORRUPT_KEY, KEY, load } from "./store.js";
import { vet } from "./vet.js";

const NOW = 1_800_000_000_000;
const fixture = (path) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${path}`, import.meta.url), "utf8")).value;
const good = () => structuredClone(fixture("normal/progress.basic.json"));
const NOTICES = [null, "blocked", "corrupt", "newer", "saveFailed"];

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

const writes = (s) => s.calls.filter(([n]) => n === "setItem" || n === "removeItem");

/** Whatever load returns, the progress must be usable and the notice one of the known ids. */
function assertSound(r) {
  assert.equal(validate("Progress", r.progress).status, "valid");
  assert.deepEqual(vet(r.progress), []);
  assert.ok(NOTICES.includes(r.notice), String(r.notice));
  assert.equal(typeof r.persist, "boolean");
}

test("nothing saved: fresh progress, no notice, nothing written, only the one key read", () => {
  const s = makeStorage();
  const r = load(s, NOW);
  assertSound(r);
  assert.equal(r.progress.createdAt, NOW);
  assert.equal(r.notice, null);
  assert.equal(r.persist, true);
  assert.deepEqual(s.calls, [["getItem", KEY]]);
});

test("a good save loads as it is, with no notice and no writes", () => {
  const s = makeStorage({ [KEY]: JSON.stringify(good()) });
  const r = load(s, NOW);
  assert.deepEqual(r.progress, good());
  assert.equal(r.notice, null);
  assert.equal(r.persist, true);
  assert.deepEqual(writes(s), []);
});

test("not JSON: the raw text is copied, fresh progress replaces it, the corrupt notice is shown", () => {
  const raw = "this is {not json";
  const s = makeStorage({ [KEY]: raw });
  const r = load(s, NOW);
  assertSound(r);
  assert.equal(r.notice, "corrupt");
  assert.equal(r.persist, true);
  assert.equal(s.data.get(CORRUPT_KEY), raw);
  assert.deepEqual(JSON.parse(s.data.get(KEY)), r.progress); // the damaged save is replaced
  assert.equal(r.progress.createdAt, NOW);
});

test("valid JSON that fails the contract is treated as corrupt", () => {
  const p = good();
  delete p.dayStreak;
  const raw = JSON.stringify(p);
  const s = makeStorage({ [KEY]: raw });
  const r = load(s, NOW);
  assert.equal(r.notice, "corrupt");
  assert.equal(s.data.get(CORRUPT_KEY), raw);
});

test("valid JSON that fails a vet check is treated as corrupt", () => {
  const p = good();
  p.dayStreak = { lastDay: "2026-02-30", count: 1 };
  const s = makeStorage({ [KEY]: JSON.stringify(p) });
  assert.equal(load(s, NOW).notice, "corrupt");
  const proto = '{"schemaVersion":1,"settings":{"__proto__":{"x":1}}}';
  assert.equal(load(makeStorage({ [KEY]: proto }), NOW).notice, "corrupt");
});

test("JSON that is not a save at all (a number, null, a list) is corrupt, and the text is kept", () => {
  for (const raw of ["42", "null", "[]", "true", '"text"', "{}"]) {
    const s = makeStorage({ [KEY]: raw });
    const r = load(s, NOW);
    assert.equal(r.notice, "corrupt", raw);
    assert.equal(s.data.get(CORRUPT_KEY), raw);
  }
});

test("an older version is upgraded, checked, saved, and shown without a notice", () => {
  const old = JSON.stringify(fixture("ugly/progress.old-schema.json"));
  const s = makeStorage({ [KEY]: old });
  const r = load(s, NOW);
  assertSound(r);
  assert.equal(r.notice, null);
  assert.equal(r.persist, true);
  assert.equal(r.progress.schemaVersion, 1);
  assert.deepEqual(JSON.parse(s.data.get(KEY)), r.progress);
  assert.equal(s.data.has(CORRUPT_KEY), false);
});

test("an upgraded save that cannot be written still loads, with the saveFailed notice", () => {
  const old = JSON.stringify(fixture("ugly/progress.old-schema.json"));
  const s = makeStorage({ [KEY]: old }, { failSet: [KEY] });
  const r = load(s, NOW);
  assertSound(r);
  assert.equal(r.notice, "saveFailed");
  assert.equal(r.persist, true);
  assert.equal(s.data.get(KEY), old); // the old text is untouched
});

test("a save the upgrade cannot read is treated as corrupt", () => {
  for (const raw of ['{"schemaVersion":-1}', '{"schemaVersion":"1"}', '{"schemaVersion":1.5}']) {
    const s = makeStorage({ [KEY]: raw });
    assert.equal(load(s, NOW).notice, "corrupt", raw);
    assert.equal(s.data.get(CORRUPT_KEY), raw);
  }
});

test("a newer version is never overwritten: fresh in memory, the newer notice, persist false", () => {
  const raw = JSON.stringify({ ...good(), schemaVersion: 2, somethingNew: true });
  const s = makeStorage({ [KEY]: raw });
  const r = load(s, NOW);
  assertSound(r);
  assert.equal(r.notice, "newer");
  assert.equal(r.persist, false);
  assert.deepEqual(writes(s), []);
  assert.equal(s.data.get(KEY), raw);
});

test("storage that throws on read: fresh in memory, the blocked notice, persist false, no writes", () => {
  const s = makeStorage({ [KEY]: JSON.stringify(good()) }, { throwOn: ["getItem"] });
  const r = load(s, NOW);
  assertSound(r);
  assert.equal(r.notice, "blocked");
  assert.equal(r.persist, false);
  assert.deepEqual(writes(s), []);
});

test("missing or half-built storage is the same as blocked", () => {
  for (const s of [
    null,
    undefined,
    {},
    { getItem() {} },
    { getItem() {}, setItem() {} },
    "storage",
    5,
  ]) {
    const r = load(s, NOW);
    assertSound(r);
    assert.equal(r.notice, "blocked");
    assert.equal(r.persist, false);
  }
});

test("if the corrupt copy cannot be written, nothing is touched and the original survives", () => {
  const raw = "damaged{";
  const s = makeStorage({ [KEY]: raw }, { failSet: [CORRUPT_KEY] });
  const r = load(s, NOW);
  assertSound(r);
  assert.equal(r.notice, "blocked");
  assert.equal(r.persist, false);
  assert.equal(s.data.get(KEY), raw);
  assert.equal(s.data.has(CORRUPT_KEY), false);
});

test("if only the replacement write fails, the copy is kept and the notice is still corrupt", () => {
  const raw = "damaged{";
  const s = makeStorage({ [KEY]: raw }, { failSet: [KEY] });
  const r = load(s, NOW);
  assert.equal(r.notice, "corrupt");
  assert.equal(r.persist, true);
  assert.equal(s.data.get(CORRUPT_KEY), raw);
});

test("a newer corruption overwrites the older copy (one slot, design decision 4)", () => {
  const s = makeStorage({ [KEY]: "second{", [CORRUPT_KEY]: "first{" });
  load(s, NOW);
  assert.equal(s.data.get(CORRUPT_KEY), "second{");
});

test("a storage that returns something other than text is handled as damaged data", () => {
  const s = makeStorage();
  s.getItem = () => 42;
  const r = load(s, NOW);
  assertSound(r);
  assert.equal(r.notice, "corrupt");
  assert.equal(s.data.get(CORRUPT_KEY), "42");
});

test("a bad clock is a programmer error", () => {
  for (const now of [-1, 1.5, Number.NaN, "5", null, undefined]) {
    assert.throws(() => load(makeStorage(), now), TypeError);
  }
});

test("random text in storage never crashes load and always gives usable progress", () => {
  const texts = fc.oneof(
    fc.string(),
    fc.jsonValue().map((v) => JSON.stringify(v)),
    fc.string({ maxLength: 40 }).map((t) => `{"schemaVersion":1,${t}`),
    fc.constantFrom(JSON.stringify(good())).chain(
      (t) => fc.integer({ min: 0, max: t.length }).map((n) => t.slice(0, n)), // cut off at any point
    ),
  );
  fc.assert(
    fc.property(texts, (raw) => {
      const r = load(makeStorage({ [KEY]: raw }), NOW);
      assertSound(r);
    }),
  );
});

test("storage that throws on any mix of calls never crashes load", () => {
  const methods = fc.subarray(["getItem", "setItem", "removeItem"]);
  const keys = fc.subarray([KEY, CORRUPT_KEY]);
  const texts = fc.constantFrom(
    undefined,
    "junk{",
    JSON.stringify(good()),
    JSON.stringify(fixture("ugly/progress.old-schema.json")),
    JSON.stringify({ ...good(), schemaVersion: 9 }),
  );
  fc.assert(
    fc.property(methods, keys, texts, (throwOn, failSet, raw) => {
      const initial = raw === undefined ? {} : { [KEY]: raw };
      assertSound(load(makeStorage(initial, { throwOn, failSet }), NOW));
    }),
  );
});
