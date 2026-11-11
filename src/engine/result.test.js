// Req 5.10, 5.11 and Req 7: every finished round is a valid RoundResult, and results repeat.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { endRound, resolveOutOfLives, resume, tick } from "./lifecycle.js";
import { toResult } from "./result.js";
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
  seed: 7,
  speed: 1,
  ...over,
});
const meta = (over = {}) => ({
  id: "round-001",
  date: 1793000000000,
  packId: "mini",
  lessonId: null,
  drillSource: null,
  ...over,
});

/** A round with hand-placed targets and state overrides. */
function round(list, over = {}, o = {}) {
  const { state } = createRound(opts(o));
  const targets = list.map(([id, text, progress], i) => ({
    id,
    itemId: `x${id}`,
    text,
    typed: 0,
    progress,
    slot: i,
  }));
  return { ...state, targets, nextId: 100, ...over };
}

const op = fc.oneof(
  { weight: 6, arbitrary: fc.constantFrom(..."abcdefgA;z").map((c) => ["key", c]) },
  { weight: 2, arbitrary: fc.constant(["esc"]) },
  { weight: 1, arbitrary: fc.constant(["resume"]) },
  { weight: 5, arbitrary: fc.double({ min: 0, max: 9000, noNaN: true }).map((n) => ["tick", n]) },
  { weight: 1, arbitrary: fc.boolean().map((b) => ["cont", b]) },
);

function apply(s, [name, arg]) {
  if (name === "key") return key(s, arg).state;
  if (name === "esc") return pressEscape(s).state;
  if (name === "resume") return resume(s).state;
  if (name === "tick") return tick(s, arg).state;
  return resolveOutOfLives(s, arg).state;
}

const mode = fc.constantFrom("falling", "corners", "practice", "lesson", "testout", "daily");
const drill = fc.constantFrom("built-in", "ai", null);

/** Play random ops, then end the round if the play didn't. */
const play = (seed, m, ops) => {
  const s = ops.reduce(apply, createRound(opts({ seed, mode: m })).state);
  return endRound(s).state;
};

test("every finished round passes the RoundResult contract", () => {
  fc.assert(
    fc.property(fc.integer(), mode, fc.array(op, { maxLength: 80 }), drill, (seed, m, ops, d) => {
      const r = toResult(play(seed, m, ops), meta({ drillSource: d }));
      const v = validate("RoundResult", r);
      assert.equal(v.status, "valid", JSON.stringify(v.errors));
      assert.ok(r.accuracy >= 0 && r.accuracy <= 1 && r.wpm >= 0 && Number.isFinite(r.wpm));
    }),
  );
});

test("same inputs and same keystrokes at the same times give the same result", () => {
  fc.assert(
    fc.property(fc.integer(), mode, fc.array(op, { maxLength: 60 }), (seed, m, ops) => {
      assert.deepEqual(toResult(play(seed, m, ops), meta()), toResult(play(seed, m, ops), meta()));
    }),
  );
});

test("the result shares nothing with the round: editing it leaves the round alone", () => {
  const s = endRound(key(round([[0, "ab", 0.5]]), "a").state).state;
  const before = JSON.stringify(s);
  const r = toResult(s, meta());
  r.keyDeltas.a.attempts = 99;
  r.keyDeltas.zzz = { attempts: 1, misses: 0 };
  assert.equal(JSON.stringify(s), before);
});

test("counts: correct chars, stray keys in the total, accuracy and wpm from them", () => {
  let s = round([[0, "abcde", 0.5]], { activeMs: 60000 });
  for (const c of "ab") s = key(s, c).state; // 2 correct
  s = key(s, "z").state; // 1 miss on c
  s = key(endRound(s).state, "q").state; // ignored: ended
  s = { ...s, strayKeys: 2 }; // 2 stray keys with nothing locked
  const r = toResult(s, meta());
  assert.equal(r.correctChars, 2);
  assert.equal(r.totalKeystrokes, 5);
  assert.equal(r.accuracy, 2 / 5);
  assert.equal(r.wpm, 2 / 5);
  assert.equal(r.durationMs, 60000);
  assert.deepEqual(r.keyDeltas, {
    a: { attempts: 1, misses: 0 },
    b: { attempts: 1, misses: 0 },
    c: { attempts: 1, misses: 1 },
  });
});

test("an untouched round has zero accuracy and zero wpm, not NaN", () => {
  const r = toResult(endRound(round([[0, "ab", 0.5]])).state, meta());
  assert.equal(r.accuracy, 0);
  assert.equal(r.wpm, 0);
  assert.equal(r.totalKeystrokes, 0);
  assert.equal(validate("RoundResult", r).status, "valid");
});

test("practice reports wave 0 and counts what was cleared", () => {
  let s = round([[0, "a", 0.5]], { wave: 1 }, { mode: "practice" });
  s = key(s, "a").state;
  const r = toResult(endRound(s).state, meta());
  assert.equal(r.mode, "practice");
  assert.equal(r.wave, 0);
  assert.equal(r.cleared, 1);
});

test("other modes report the wave reached", () => {
  const r = toResult(endRound(round([[0, "ab", 0.5]], { wave: 4 })).state, meta());
  assert.equal(r.wave, 4);
});

test("continued is true only when the free continue was used", () => {
  const ended = endRound(round([[0, "ab", 0.5]])).state;
  assert.equal(toResult(ended, meta()).continued, false);
  assert.equal(toResult({ ...ended, continueUsed: true }, meta()).continued, true);
});

test("meta passes through: id, date, pack, lesson, drill source", () => {
  const ended = endRound(round([[0, "ab", 0.5]], {}, { mode: "lesson" })).state;
  const r = toResult(
    ended,
    meta({ id: "x1", date: 5, packId: "p", lessonId: "3", drillSource: "ai" }),
  );
  assert.deepEqual([r.id, r.date, r.packId, r.lessonId, r.drillSource], ["x1", 5, "p", "3", "ai"]);
});

test("a round that has not ended is a programmer error", () => {
  assert.throws(() => toResult(round([[0, "ab", 0.5]]), meta()), Error);
});

test("bad meta is a programmer error", () => {
  const ended = endRound(round([[0, "ab", 0.5]])).state;
  const bad = [
    undefined,
    {},
    meta({ id: "" }),
    meta({ packId: 5 }),
    meta({ date: -1 }),
    meta({ date: 1.5 }),
    meta({ lessonId: "" }),
    meta({ lessonId: undefined }),
    meta({ drillSource: "gpt" }),
    meta({ drillSource: undefined }),
  ];
  for (const m of bad) assert.throws(() => toResult(ended, m), TypeError);
});
