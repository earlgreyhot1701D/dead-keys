// Design decision 5 and Req 2.7: freshProgress (now in migrate.js, re-exported by store.js) and
// readCorrupt. Split from store.test.js at the line cap.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validate } from "../../contract/validate.js";
import { freshProgress as fromMigrate, migrate } from "./migrate.js";
import { CORRUPT_KEY, freshProgress, KEY, load, readCorrupt } from "./store.js";
import { vet } from "./vet.js";

const NOW = 1_800_000_000_000;

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

const OLD = JSON.stringify(
  JSON.parse(
    readFileSync(new URL("../../fixtures/ugly/progress.old-schema.json", import.meta.url), "utf8"),
  ).value,
);
const GOOD = JSON.stringify(
  JSON.parse(
    readFileSync(new URL("../../fixtures/normal/progress.basic.json", import.meta.url), "utf8"),
  ).value,
);

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

test('a text version such as "9" is a damaged save, not a newer one', () => {
  // "9" > 1 is true in JavaScript, so a missing integer check would call this save "newer".
  for (const raw of ['{"schemaVersion":"9"}', '{"schemaVersion":"2"}', '{"schemaVersion":[9]}']) {
    const s = makeStorage({ [KEY]: raw });
    const r = load(s, NOW);
    assert.equal(r.notice, "corrupt", raw);
    assert.equal(r.persist, true, raw);
  }
});

test("a damaged save can be downloaded after load: readCorrupt returns the original text", () => {
  const raw = '{"schemaVersion":1,"rounds":"oops"';
  const s = makeStorage({ [KEY]: raw });
  assert.equal(load(s, NOW).notice, "corrupt");
  assert.equal(readCorrupt(s), raw);
});

// An upgrade can drop data, so the original text is kept first (Req 2.4).
test("upgrading an older save copies the original text to the corrupt slot before writing", () => {
  const s = makeStorage({ [KEY]: OLD });
  const r = load(s, NOW);
  assert.equal(r.notice, null); // no player-facing notice for a good upgrade
  assert.equal(r.persist, true);
  assert.equal(r.progress.schemaVersion, 1);
  assert.equal(readCorrupt(s), OLD);
  assert.deepEqual(JSON.parse(s.data.get(KEY)), r.progress);
  const sets = s.calls.filter(([n]) => n === "setItem").map(([, k]) => k);
  assert.deepEqual(sets, [CORRUPT_KEY, KEY]); // the copy comes first
});

test("if the original cannot be copied, nothing is touched: the upgraded progress stays in memory", () => {
  const s = makeStorage({ [KEY]: OLD }, { failSet: [CORRUPT_KEY] });
  const r = load(s, NOW);
  assert.equal(r.notice, "blocked");
  assert.equal(r.persist, false);
  assert.equal(r.progress.schemaVersion, 1);
  assert.equal(validate("Progress", r.progress).status, "valid");
  assert.equal(s.data.get(KEY), OLD); // the original survives
  assert.equal(s.data.has(CORRUPT_KEY), false);
  assert.equal(
    s.calls.some(([n, k]) => n === "setItem" && k === KEY),
    false,
  );
});

test("a save already at the current version is not copied", () => {
  const s = makeStorage({ [KEY]: GOOD });
  load(s, NOW);
  assert.deepEqual(
    s.calls.filter(([n]) => n === "setItem"),
    [],
  );
});

test("an upgrade that throws is treated as a damaged save, never a crash", () => {
  const boom = () => {
    throw new Error("boom");
  };
  for (const raw of [GOOD, OLD]) {
    const s = makeStorage({ [KEY]: raw });
    const r = load(s, NOW, boom);
    assert.equal(r.notice, "corrupt");
    assert.equal(r.persist, true);
    assert.equal(validate("Progress", r.progress).status, "valid");
    assert.equal(readCorrupt(s), raw); // the original text is kept
    assert.deepEqual(JSON.parse(s.data.get(KEY)), r.progress); // replaced by fresh progress
  }
});
