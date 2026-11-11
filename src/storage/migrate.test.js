// Req 2.4 and design decision 3: upgrade old saves, and never let a bad one through.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { migrate, STEPS } from "./migrate.js";
import { vet } from "./vet.js";

const NOW = 1_800_000_000_000;
const fixture = (path) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${path}`, import.meta.url), "utf8")).value;
const current = () => structuredClone(fixture("normal/progress.basic.json"));
const goodRound = () => structuredClone(current().rounds[0]);
const v0 = (over = {}) => ({ schemaVersion: 0, ...over });

/** The result must be usable: valid under the contract and clean under vet. */
function assertUsable(progress) {
  assert.equal(
    validate("Progress", progress).status,
    "valid",
    JSON.stringify(validate("Progress", progress).errors),
  );
  assert.deepEqual(vet(progress), []);
}

/** Freeze deep, so any mutation throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

test("the old-schema fixture upgrades to a fresh, valid save", () => {
  const r = migrate(fixture("ugly/progress.old-schema.json"), NOW);
  assert.equal(r.ok, true);
  assertUsable(r.progress);
  assert.deepEqual(r.progress, {
    schemaVersion: 1,
    createdAt: NOW,
    rounds: [], // { wpm, accuracy } is not a RoundResult, so it is dropped
    keys: [],
    bests: {},
    dayStreak: { lastDay: null, count: 0 },
    lessonsPassed: [],
    milestones: [],
    settings: {},
    ghosts: [],
  });
});

test("rounds that pass the contract are kept; others, and every other field, are dropped", () => {
  const bad = goodRound();
  delete bad.wpm;
  const oddKey = goodRound();
  oddKey.keyDeltas = { ab: { attempts: 1, misses: 0 } }; // valid shape, fails vet
  const r = migrate(
    v0({
      rounds: [goodRound(), bad, oddKey, "junk", null, goodRound()],
      keys: [{ key: "a" }],
      bests: { fast: 1 },
      extra: "dropped",
      settings: { sound: "arcade" },
    }),
    NOW,
  );
  assert.equal(r.ok, true);
  assertUsable(r.progress);
  assert.equal(r.progress.rounds.length, 2);
  assert.deepEqual(r.progress.rounds[0], goodRound());
  assert.deepEqual(r.progress.keys, []);
  assert.deepEqual(r.progress.bests, {});
  assert.deepEqual(r.progress.settings, {});
  assert.equal("extra" in r.progress, false);
});

test("only the newest 200 rounds are kept", () => {
  const rounds = Array.from({ length: 250 }, (_, i) => ({ ...goodRound(), id: `r${i}` }));
  const r = migrate(v0({ rounds }), NOW);
  assert.equal(r.ok, true);
  assert.equal(r.progress.rounds.length, 200);
  assert.equal(r.progress.rounds[0].id, "r50");
  assert.equal(r.progress.rounds.at(-1).id, "r249");
});

test("kept rounds are copies, so the old save and the new one share nothing", () => {
  const old = v0({ rounds: [goodRound()] });
  const r = migrate(old, NOW);
  r.progress.rounds[0].keyDeltas.zzz = { attempts: 1, misses: 0 };
  assert.equal("zzz" in old.rounds[0].keyDeltas, false);
});

test("a save already at the current version is only checked, and returned as it is", () => {
  const p = current();
  const r = migrate(p, NOW);
  assert.equal(r.ok, true);
  assert.equal(r.progress, p);
});

test("a current-version save that fails the contract or the vet checks is refused", () => {
  const noStreak = current();
  delete noStreak.dayStreak;
  assert.equal(migrate(noStreak, NOW).ok, false);
  const badDay = current();
  badDay.dayStreak = { lastDay: "2026-02-30", count: 1 };
  const r = migrate(badDay, NOW);
  assert.equal(r.ok, false);
  assert.match(r.reason, /safety check/);
  const proto = current();
  Object.defineProperty(proto.settings, "__proto__", { value: 1, enumerable: true });
  assert.equal(migrate(proto, NOW).ok, false);
});

test("a newer version is refused, never rewritten", () => {
  const r = migrate({ ...current(), schemaVersion: 2 }, NOW);
  assert.deepEqual(r, { ok: false, reason: "saved by a newer version (2)" });
});

test("things that are not a save are refused without throwing", () => {
  for (const junk of [
    null,
    undefined,
    5,
    "text",
    true,
    [],
    {},
    { schemaVersion: -1 },
    { schemaVersion: 1.5 },
    { schemaVersion: "1" },
    { schemaVersion: null },
    { schemaVersion: Number.NaN },
  ]) {
    const r = migrate(junk, NOW);
    assert.equal(r.ok, false, JSON.stringify(junk));
    assert.equal(typeof r.reason, "string");
  }
});

test("a missing step, a step that throws, a bad step and a bad result all fail cleanly", () => {
  const run = (steps) => migrate(v0(), NOW, steps);
  assert.match(run([]).reason, /no upgrade path from version 0/);
  assert.match(
    run([
      {
        from: 0,
        to: 1,
        run: () => {
          throw new Error("boom");
        },
      },
    ]).reason,
    /upgrading from version 0 failed/,
  );
  assert.match(run([{ from: 0, to: 0, run: () => ({}) }]).reason, /bad upgrade step/);
  assert.match(run([{ from: 0, to: 1, run: () => ({ schemaVersion: 1 }) }]).reason, /save format/);
  assert.match(run([{ from: 0, to: 1, run: () => undefined }]).reason, /save format/);
  const dirty = (old, now) => {
    const p = STEPS[0].run(old, now);
    p.settings = JSON.parse('{"constructor": 1}');
    return p;
  };
  assert.match(run([{ from: 0, to: 1, run: dirty }]).reason, /safety check/);
});

test("the step table is v0 to v1 and nothing else", () => {
  assert.deepEqual(
    STEPS.map((s) => [s.from, s.to]),
    [[0, 1]],
  );
  assert.ok(Object.isFrozen(STEPS));
});

test("the input is never changed", () => {
  const old = freeze(v0({ rounds: [goodRound(), { wpm: 1 }] }));
  assert.equal(migrate(old, NOW).ok, true);
  assert.equal(migrate(freeze(current()), NOW).ok, true);
});

test("a bad clock is a programmer error", () => {
  for (const now of [-1, 1.5, Number.NaN, "5", null, undefined]) {
    assert.throws(() => migrate(v0(), now), TypeError);
  }
});

// Whatever a version-0 save holds, the result is a usable save.
const roundish = fc.oneof(
  fc.constant(null).map(goodRound),
  fc.integer({ min: 0, max: 200 }).map((wpm) => ({ ...goodRound(), wpm })),
  fc
    .constantFrom("a", "ab", "")
    .map((k) => ({ ...goodRound(), keyDeltas: { [k]: { attempts: 1, misses: 0 } } })),
  fc.anything(),
);

test("migrate output always passes the contract and vet", () => {
  fc.assert(
    fc.property(
      fc.array(roundish, { maxLength: 30 }),
      fc.anything(),
      fc.integer({ min: 0, max: 2 ** 40 }),
      (rounds, extra, now) => {
        const r = migrate(v0({ rounds, extra }), now);
        assert.equal(r.ok, true);
        assertUsable(r.progress);
        assert.equal(r.progress.createdAt, now);
        assert.ok(r.progress.rounds.length <= 200);
      },
    ),
  );
});

test("junk never throws", () => {
  fc.assert(
    fc.property(fc.anything(), (value) => {
      const r = migrate(value, NOW);
      assert.equal(typeof r.ok, "boolean");
      if (r.ok) assertUsable(r.progress);
      else assert.equal(typeof r.reason, "string");
    }),
  );
  fc.assert(
    fc.property(fc.jsonValue(), (value) => {
      assert.equal(typeof migrate(value, NOW).ok, "boolean");
    }),
  );
});
