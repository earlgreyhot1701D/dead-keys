// A finished lesson (lessons Req 4.1 to 4.3): one RoundResult that passes the contract, the
// Check accuracy and the 95% rule, Lesson 0 passing on finishing, and the most-missed keys.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { generateLesson, generateTestOut } from "./generate.js";
import { playLesson } from "./playKit.js";
import {
  accuracyOf,
  keyDeltasOf,
  mostMissed,
  PASS_ACCURACY,
  passes,
  passFor,
  toLessonResult,
} from "./result.js";

const meta = (lessonId, kind = "lesson") => ({ id: "lesson-1", date: 1000, lessonId, kind });

test("a whole lesson is one RoundResult that passes the contract and covers every keystroke", () => {
  fc.assert(
    fc.property(
      fc.constantFrom("L01", "L02", "L03", "L04", "L05", "L06"),
      fc.integer({ min: 0, max: 2 ** 32 - 1 }),
      fc.boolean(),
      (id, seed, testOut) => {
        const lesson = testOut ? generateTestOut(id, seed) : generateLesson(id, seed);
        const played = playLesson(lesson, (n) => (n % 2 ? "q" : null));
        assert.equal(played.done, true);
        const r = toLessonResult({ ...meta(id, lesson.kind), ...played });
        assert.equal(validate("RoundResult", r).status, "valid");
        assert.equal(r.mode, testOut ? "testout" : "lesson");
        assert.equal(r.lessonId, id);
        assert.deepEqual([r.cleared, r.wave, r.drillSource, r.continued], [0, 0, null, false]);
        assert.equal(r.totalKeystrokes, played.keystrokes.length);
        const chars = lesson.parts.flatMap((p) => p.lines).join("").length;
        assert.equal(r.correctChars, chars, "every character typed right once");
        const deltas = Object.values(r.keyDeltas);
        assert.equal(
          deltas.reduce((n, d) => n + d.attempts, 0),
          r.totalKeystrokes,
        );
      },
    ),
  );
});

test("spaces count in the heat map: they are keystrokes with their own key delta", () => {
  const played = playLesson(generateLesson("L03", 5));
  const r = toLessonResult({ ...meta("L03"), ...played });
  assert.ok(r.keyDeltas[" "].attempts > 0);
});

test("the 95% rule on the Check only, at any speed", () => {
  const ok = (n) => ({ ok: true, expected: "a", typed: "a", t: n });
  const bad = { ok: false, expected: "a", typed: "s", t: 0 };
  const run = (good, wrong) => [...Array(good)].map((_, i) => ok(i)).concat(Array(wrong).fill(bad));
  assert.equal(PASS_ACCURACY, 0.95);
  assert.equal(passes("L01", run(95, 5)), true, "exactly 95% passes");
  assert.equal(passes("L01", run(94, 5)), false, "94.9% does not");
  assert.equal(passes("L04", run(50, 0)), true);
  assert.equal(passes("L04", []), false, "no Check typed: no pass");
  assert.equal(accuracyOf(run(19, 1)), 0.95);
  // A slow Check passes as well as a fast one: speed never enters into it.
  const slow = run(100, 0).map((k, i) => ({ ...k, t: i * 5000 }));
  assert.equal(passes("L02", slow), true);
});

test("a Check with misses fails while the parts before it were perfect", () => {
  const lesson = generateLesson("L02", 3);
  const checkStart = lesson.parts.slice(0, 3).flatMap((p) => p.lines).length;
  const played = playLesson(lesson, (n) => (n >= checkStart ? "q" : null));
  // Two wrong keys on about 56 Check characters is still 96%: miss more to fail.
  assert.equal(passes("L02", played.check), accuracyOf(played.check) >= 0.95);
  const many = playLesson(lesson, () => "q");
  assert.ok(accuracyOf(many.check) < 1);
});

test("Lesson 0 passes when it is finished", () => {
  const played = playLesson(generateLesson("L00", 1), () => "q");
  assert.equal(passes("L00", played.check), true);
  assert.equal(passes("L00", []), true);
});

test("the pass handed to record: how it was passed, or nothing", () => {
  assert.deepEqual(passFor("L03", "lesson", true), { lessonId: "L03", how: "lesson" });
  assert.deepEqual(passFor("L03", "testout", true), { lessonId: "L03", how: "testout" });
  assert.equal(passFor("L03", "lesson", false), null);
});

test("most-missed keys: up to two, most first, ties in key order; none when clean", () => {
  const k = (expected, ok) => ({ t: 0, expected, typed: ok ? expected : "x", ok });
  const ks = [k("h", false), k("h", false), k("g", false), k("a", false), k("a", true)];
  assert.deepEqual(mostMissed(ks), ["h", "a"]);
  assert.deepEqual(keyDeltasOf(ks).a, { attempts: 2, misses: 1 });
  assert.deepEqual(mostMissed([k("a", true)]), []);
  assert.deepEqual(mostMissed([k("s", false)]), ["s"]);
});
