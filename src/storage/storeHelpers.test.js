// Design decision 5 and Req 2.7: freshProgress (now in migrate.js, re-exported by store.js) and
// readCorrupt. Split from store.test.js at the line cap.
import assert from "node:assert/strict";
import { test } from "node:test";
import { validate } from "../../contract/validate.js";
import { freshProgress as fromMigrate, migrate } from "./migrate.js";
import { CORRUPT_KEY, freshProgress, KEY, load, readCorrupt } from "./store.js";
import { vet } from "./vet.js";

const NOW = 1_800_000_000_000;

/** A stand-in storage. `throwOn` lists methods that throw. */
function makeStorage(initial = {}, { throwOn = [] } = {}) {
  const data = new Map(Object.entries(initial));
  const wrap =
    (name, fn) =>
    (...args) => {
      if (throwOn.includes(name)) throw new Error(`${name} is blocked`);
      return fn(...args);
    };
  return {
    data,
    getItem: wrap("getItem", (k) => (data.has(k) ? data.get(k) : null)),
    setItem: wrap("setItem", (k, v) => data.set(k, String(v))),
    removeItem: wrap("removeItem", (k) => data.delete(k)),
  };
}

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

test("store.js re-exports the one freshProgress, which lives in migrate.js", () => {
  assert.equal(freshProgress, fromMigrate);
});

test("an upgrade from version 0 starts from freshProgress", () => {
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
  }
});

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
