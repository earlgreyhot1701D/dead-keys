// Lessons 7 to 13 (lessons-8b Reqs 1 to 5): every character a learned key, every line 1 to 28
// characters with single spaces, the four parts, a Check of at least 50, and each lesson's keys
// where they belong.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { PAIRS } from "./beyond.js";
import { CHECK_MIN, generateLesson, generateTestOut, MAX_LINE } from "./generate.js";
import { learnedKeys } from "./ladder.js";

const BEYOND = ["L07", "L08", "L09", "L10", "L11", "L12", "L13"];
const seedArb = fc.integer({ min: 0, max: 2 ** 32 - 1 });
const lines = (l) => l.parts.flatMap((p) => p.lines);

test("every line uses only learned keys, fits 28, single spaces (property, all of 7 to 13)", () => {
  fc.assert(
    fc.property(fc.constantFrom(...BEYOND), seedArb, (id, seed) => {
      const keys = new Set(learnedKeys(id));
      for (const l of [generateLesson(id, seed), generateTestOut(id, seed)]) {
        for (const line of lines(l)) {
          assert.ok(line.length > 0 && line.length <= MAX_LINE, `${id} "${line}"`);
          assert.equal(line, line.trim());
          assert.ok(!line.includes("  "), line);
          for (const ch of line) assert.ok(keys.has(ch), `${id}: "${ch}" in "${line}"`);
        }
      }
    }),
  );
});

test("the four parts, and a Check (or test out) of at least 50 characters", () => {
  fc.assert(
    fc.property(fc.constantFrom(...BEYOND), seedArb, (id, seed) => {
      const { parts } = generateLesson(id, seed);
      assert.deepEqual(
        parts.map((p) => [p.name, p.lines.length]),
        [
          ["warmup", 1],
          ["new", 2],
          ["mix", 2],
          ["check", 2],
        ],
      );
      assert.ok(parts[3].lines.join("").length >= CHECK_MIN);
      assert.ok(generateTestOut(id, seed).parts[0].lines.join("").length >= CHECK_MIN);
    }),
  );
});

test("each lesson's keys show up where they belong", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const all = (id) => lines(generateLesson(id, seed)).join(" ");
    assert.match(all("L07"), /[A-Z]/, "capitals");
    assert.match(all("L08"), /['?!:"-]/, "punctuation");
    assert.match(all("L09"), /[1-5]/, "numbers 1 to 5");
    assert.doesNotMatch(all("L09"), /[6-90]/, "no digit Lesson 9 hasn't taught");
    assert.match(all("L10"), /[6-90]/, "numbers 6 to 0");
    assert.match(all("L11"), /[$%&()/@#]/, "symbols");
    assert.match(all("L12"), /\d{1,2}\/\d{1,2}\/\d{4}|\$\d+\.\d\d|[A-Z]{2}-\d{4}/, "real-world");
    assert.ok(
      PAIRS.some((p) => all("L13").includes(p)),
      "pairs",
    );
  }
});

test("numbers never start with 0 unless they are one digit (Lessons 9 to 12)", () => {
  for (let seed = 1; seed <= 50; seed++) {
    for (const id of ["L09", "L10", "L11", "L12"]) {
      for (const t of lines(generateLesson(id, seed))
        .join(" ")
        .match(/(?<![.\d])\d+/g) ?? []) {
        assert.ok(t.length === 1 || t[0] !== "0", `${id} ${t}`); // cents after a dot are fine
      }
    }
  }
});

test("the same seed gives the same lesson; another seed, another", () => {
  for (const id of BEYOND) {
    assert.deepEqual(generateLesson(id, 9), generateLesson(id, 9));
    assert.notDeepEqual(generateLesson(id, 9), generateLesson(id, 10));
  }
});
