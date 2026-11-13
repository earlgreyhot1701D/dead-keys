// The lesson generator (lessons Req 2, Req 4.2, Req 6.2): every character a learned key, lines
// at most 28 characters ending on a group, the four parts' shapes, a Check of at least 50
// characters, same seed same lesson, Lesson 0's fixed lines, and test out as the Check only.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { anchorOf } from "./fingers.js";
import {
  CHECK_MIN,
  generateLesson,
  generateTestOut,
  LESSON0_LINES,
  MAX_LINE,
  wordsFor,
} from "./generate.js";
import { keysBefore, learnedKeys, lessonById } from "./ladder.js";

const LETTER_LESSONS = ["L01", "L02", "L03", "L04", "L05", "L06"];
const lessonArb = fc.constantFrom(...LETTER_LESSONS);
const seedArb = fc.integer({ min: 0, max: 2 ** 32 - 1 });
const groups = (line) => line.split(" ");

test("every character is a learned key; lines are 28 or less, lower case, end on a group", () => {
  fc.assert(
    fc.property(lessonArb, seedArb, (id, seed) => {
      const keys = new Set(learnedKeys(id));
      for (const part of generateLesson(id, seed).parts) {
        for (const line of part.lines) {
          assert.ok(line.length > 0 && line.length <= MAX_LINE, `${id} "${line}"`);
          for (const ch of line) assert.ok(keys.has(ch), `${id}: "${ch}" in "${line}"`);
          assert.equal(line, line.toLowerCase());
          assert.equal(line, line.trim(), "never starts or ends with a space");
          assert.ok(!line.includes("  "), "groups are one space apart");
        }
      }
    }),
  );
});

test("the four parts and their shapes (Req 2.4)", () => {
  fc.assert(
    fc.property(lessonArb, seedArb, (id, seed) => {
      const { parts, kind } = generateLesson(id, seed);
      assert.equal(kind, "lesson");
      assert.deepEqual(
        parts.map((p) => [p.name, p.lines.length]),
        [
          ["warmup", 1],
          ["new", 2],
          ["mix", 2],
          ["check", 2],
        ],
      );
      const before = new Set(keysBefore(id));
      for (const g of groups(parts[0].lines[0])) {
        for (const ch of g) assert.ok(before.has(ch), `${id} warm-up uses only old keys: ${g}`);
        assert.ok(g.length >= 2 && g.length <= 4, g);
      }
      const fresh = lessonById(id).keys.filter((k) => k !== " ");
      for (const line of parts[1].lines) {
        for (const g of groups(line)) {
          // Exactly a new key and its home key ("fgf"), alternating.
          const pair = new Set(g);
          const ok = fresh.some((k) => pair.size === 2 && pair.has(k) && pair.has(anchorOf(k)));
          assert.ok(ok, `${id} new-keys group is a new key and its home key: ${g}`);
          for (const [i, ch] of [...g].entries()) {
            assert.equal(ch, i % 2 === 0 ? g[0] : g[1], `${g} alternates`);
          }
        }
      }
      const words = new Set(wordsFor(id));
      for (const w of groups(parts[2].lines[1])) assert.ok(words.has(w), `${id} mix word: ${w}`);
      const check = parts[3].lines.join("");
      assert.ok(check.length >= CHECK_MIN, `${id} check is ${check.length}`);
      assert.ok(
        groups(parts[3].lines.join(" ")).some((g) => words.has(g)),
        "the check has words",
      );
    }),
  );
});

test("Lesson 1 warms up on F and J", () => {
  for (const seed of [1, 2, 3, 99]) {
    const warm = generateLesson("L01", seed).parts[0].lines[0];
    assert.match(warm, /^[fj ]+$/);
  }
});

test("the same seed gives the same lesson; another seed, another lesson", () => {
  fc.assert(
    fc.property(lessonArb, seedArb, (id, seed) => {
      assert.deepEqual(generateLesson(id, seed), generateLesson(id, seed));
      assert.deepEqual(generateTestOut(id, seed), generateTestOut(id, seed));
    }),
  );
  assert.notDeepEqual(generateLesson("L04", 1), generateLesson("L04", 2));
});

test("Lesson 0: its four parts and the copy table's three lines", () => {
  const design = readFileSync(
    new URL("../../.kiro/specs/lessons/design.md", import.meta.url),
    "utf8",
  );
  for (const line of LESSON0_LINES) assert.ok(design.includes(`/ \`${line}\` |`), line);
  const { parts } = generateLesson("L00", 7);
  assert.deepEqual(
    parts.map((p) => p.name),
    ["keyboard", "home", "fingers", "eyes"],
  );
  assert.deepEqual(parts[0].lines, []);
  assert.deepEqual(
    parts.slice(1).map((p) => p.lines),
    LESSON0_LINES.map((l) => [l]),
  );
  assert.deepEqual(generateLesson("L00", 1), generateLesson("L00", 2)); // fixed, no seed
});

test("test out is the Check only, two lines, at least 50 characters", () => {
  fc.assert(
    fc.property(lessonArb, seedArb, (id, seed) => {
      const t = generateTestOut(id, seed);
      assert.equal(t.kind, "testout");
      assert.deepEqual(
        t.parts.map((p) => [p.name, p.lines.length]),
        [["check", 2]],
      );
      assert.ok(t.parts[0].lines.join("").length >= CHECK_MIN);
    }),
  );
  assert.throws(() => generateTestOut("L00", 1), RangeError); // Lesson 0 has no test out
  assert.throws(() => generateLesson("L14", 1), RangeError);
});

test("words: lesson words for 1 to 3, the general pack's for 4 to 6, only learned keys", () => {
  assert.ok(wordsFor("L01").includes("sad") && !wordsFor("L01").includes("all"));
  assert.ok(wordsFor("L02").includes("all") && wordsFor("L02").includes("sad"));
  assert.ok(wordsFor("L03").includes("glass"));
  assert.ok(wordsFor("L04").includes("that"));
  for (const id of LETTER_LESSONS) {
    const keys = new Set(learnedKeys(id));
    assert.ok(wordsFor(id).length >= 10, id);
    for (const w of wordsFor(id)) for (const ch of w) assert.ok(keys.has(ch), `${id} ${w}`);
  }
});
