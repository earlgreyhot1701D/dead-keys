// Recording a lesson's pass (lessons Req 4.4, Full rigor): `record(progress, result, day, pass)`
// adds the pass once per lesson, before milestones, so the lesson-passed milestone appears; a
// second pass or a test out after a pass adds nothing; `finishRound` hands the pass through and
// still never writes while persist is false. (record.test.js is at its 250-line cap.)
import assert from "node:assert/strict";
import { test } from "node:test";
import { validate } from "../../contract/validate.js";
import { record } from "../engine/record.js";
import { KEY } from "../storage/store.js";
import { vet } from "../storage/vet.js";
import { createApp } from "../ui/app.js";
import { makeEnv, NOW } from "../ui/appTestKit.js";
import { localDay } from "../ui/roundRecord.js";
import { generateLesson } from "./generate.js";
import { playLesson } from "./playKit.js";
import { passFor, toLessonResult } from "./result.js";

const fresh = () => ({
  schemaVersion: 1,
  createdAt: 0,
  rounds: [],
  keys: [],
  bests: {},
  dayStreak: { lastDay: null, count: 0 },
  lessonsPassed: [],
  milestones: [],
  settings: {},
  ghosts: [],
});
const DAY = "2026-11-12";
const lessonRound = (id, n, kind = "lesson") =>
  toLessonResult({
    id: `lesson-${n}`,
    date: NOW + n,
    lessonId: id,
    kind,
    ...playLesson(generateLesson(id, n)),
  });

test("a pass joins lessonsPassed, and its milestone comes from the milestone code", () => {
  const after = record(fresh(), lessonRound("L01", 1), DAY, passFor("L01", "lesson", true));
  assert.deepEqual(after.lessonsPassed, [{ lessonId: "L01", how: "lesson" }]);
  assert.ok(after.milestones.some((m) => m.kind === "lesson-passed" && m.id === "lesson-L01"));
  assert.equal(validate("Progress", after).status, "valid");
  assert.deepEqual(vet(after), []);
});

test("once per lesson: a second pass, or a test out after a pass, adds nothing", () => {
  let p = record(fresh(), lessonRound("L02", 1), DAY, passFor("L02", "lesson", true));
  p = record(p, lessonRound("L02", 2), DAY, passFor("L02", "lesson", true));
  p = record(p, lessonRound("L02", 3, "testout"), DAY, passFor("L02", "testout", true));
  assert.deepEqual(p.lessonsPassed, [{ lessonId: "L02", how: "lesson" }]);
  assert.equal(p.rounds.length, 3, "each round is still recorded");
  assert.equal(p.milestones.filter((m) => m.kind === "lesson-passed").length, 1);
  const t = record(fresh(), lessonRound("L03", 4, "testout"), DAY, passFor("L03", "testout", true));
  assert.deepEqual(t.lessonsPassed, [{ lessonId: "L03", how: "testout" }]);
});

test("no pass: lessonsPassed is the same list; a bad pass is a programmer error", () => {
  const p = fresh();
  const after = record(p, lessonRound("L01", 1), DAY);
  assert.equal(after.lessonsPassed, p.lessonsPassed);
  assert.equal(record(p, lessonRound("L01", 2), DAY, null).lessonsPassed, p.lessonsPassed);
  for (const bad of [
    {},
    { lessonId: "L01" },
    { lessonId: "", how: "lesson" },
    { lessonId: "L01", how: "won" },
  ]) {
    assert.throws(() => record(p, lessonRound("L01", 3), DAY, bad), TypeError);
  }
});

test("finishRound hands the pass through and saves it; with persist false nothing is written", () => {
  const h = makeEnv();
  const app = createApp(h.env);
  app.start();
  const r = app.finishRound(lessonRound("L01", 1), localDay(NOW), passFor("L01", "lesson", true));
  assert.equal(r.recorded, true);
  assert.equal(r.saved, true);
  assert.ok(r.milestones.some((m) => m.id === "lesson-L01"));
  assert.deepEqual(JSON.parse(h.data.get(KEY)).lessonsPassed, [{ lessonId: "L01", how: "lesson" }]);
  const off = makeEnv({ noStorage: true });
  const app2 = createApp(off.env);
  app2.start();
  const r2 = app2.finishRound(lessonRound("L01", 2), localDay(NOW), passFor("L01", "lesson", true));
  assert.equal(r2.saved, false);
  assert.equal(off.writes(), 0);
  assert.deepEqual(app2.state.progress.lessonsPassed, [{ lessonId: "L01", how: "lesson" }]);
  const bad = app2.finishRound(lessonRound("L01", 3), localDay(NOW), { lessonId: "L01" });
  assert.equal(bad.recorded, false, "a bad pass is caught: nothing recorded, a notice shows");
  assert.equal(app2.state.notice, "saveFailed");
});
