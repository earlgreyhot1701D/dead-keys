// The recommended lesson (lessons Req 8.1, 8.2) and the copy table's Why lines.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { recommend, topWeakKeys, whyLine } from "./recommend.js";

const progress = (over = {}) => ({ rounds: [], keys: [], lessonsPassed: [], ...over });
const stat = (key, attempts, misses) => ({ key, attempts, misses, lastSeen: 0 });
const passed = (...ids) => ids.map((lessonId) => ({ lessonId, how: "lesson" }));
const aRound = [{ id: "r1", mode: "falling" }];

test("a brand-new player gets Lesson 0 and the first-visit line", () => {
  const r = recommend(progress());
  assert.deepEqual(r, { lessonId: "L00", why: { kind: "new" } });
  assert.equal(whyLine(r.why), "[WHY] New to typing? Start here.");
});

test("no weak keys: the earliest built lesson not passed, next in order", () => {
  assert.deepEqual(recommend(progress({ rounds: aRound })), {
    lessonId: "L00",
    why: { kind: "order" },
  });
  const p = progress({ rounds: aRound, lessonsPassed: passed("L00", "L01", "L03") });
  assert.equal(recommend(p).lessonId, "L02");
  assert.equal(whyLine(recommend(p).why), "[WHY] Next in order.");
});

test("tested out counts as passed", () => {
  const p = progress({
    rounds: aRound,
    lessonsPassed: [...passed("L00"), { lessonId: "L01", how: "testout" }],
  });
  assert.equal(recommend(p).lessonId, "L02");
});

test("the earliest lesson not passed that teaches one of the top 3 weak keys", () => {
  const keys = [stat("r", 40, 12), stat("t", 40, 8), stat("a", 40, 0), stat("p", 40, 2)];
  const p = progress({ rounds: aRound, keys, lessonsPassed: passed("L00", "L01", "L02", "L03") });
  assert.deepEqual(recommend(p), { lessonId: "L04", why: { kind: "weak", keys: ["r", "t"] } });
  assert.equal(whyLine(recommend(p).why), '[WHY] You miss "r" and "t" most.');
  // L04 passed: the next weak key's lesson. "p" (2 in 40, 5%) is weak enough ("uneven").
  const later = { ...p, lessonsPassed: passed("L00", "L01", "L02", "L03", "L04") };
  assert.deepEqual(recommend(later), { lessonId: "L05", why: { kind: "weak", keys: ["p"] } });
  assert.equal(whyLine(recommend(later).why), '[WHY] You miss "p" most.');
});

test("weak keys come from the heat map: enough data only, worst first, at most 3", () => {
  const keys = [
    stat("a", 9, 9), // not enough data: never a weak key
    stat("s", 20, 10),
    stat("d", 40, 20),
    stat("f", 30, 6),
    stat("g", 30, 3),
    stat("h", 100, 0), // steady
  ];
  assert.deepEqual(topWeakKeys(keys), ["d", "s", "f"]); // d and s tie at 50%: more attempts first
  const p = progress({ rounds: aRound, keys: [stat("a", 9, 9)] });
  assert.deepEqual(recommend(p).why, { kind: "order" });
});

test("every built lesson passed: none", () => {
  const all = passed(...Array.from({ length: 14 }, (_, i) => `L${String(i).padStart(2, "0")}`));
  assert.equal(recommend(progress({ rounds: aRound, lessonsPassed: all })), null);
});

test("the Why lines are the copy table's", () => {
  const design = readFileSync(
    new URL("../../.kiro/specs/lessons/design.md", import.meta.url),
    "utf8",
  );
  const row = design.split("\n").find((l) => l.startsWith("| Why lines |"));
  for (const why of [
    { kind: "weak", keys: ["{a}", "{b}"] },
    { kind: "weak", keys: ["{a}"] },
    { kind: "order" },
    { kind: "new" },
  ]) {
    assert.ok(row.includes(`\`${whyLine(why)}\``), whyLine(why));
  }
});

test("Lesson 0 is never picked for a weak F or J: the lesson that types them is", () => {
  const p = progress({ rounds: aRound, keys: [stat("f", 20, 15)] });
  assert.deepEqual(recommend(p), { lessonId: "L01", why: { kind: "weak", keys: ["f"] } });
});
