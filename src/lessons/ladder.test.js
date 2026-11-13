// The ladder (lessons Req 1): Lessons 0 to 13 as PRD G7 lists them, the groups, built 0 to 6,
// and learned keys growing lesson by lesson with space from Lesson 1 on.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { BUILT, keysBefore, LADDER, learnedKeys, lessonById } from "./ladder.js";

const prd = readFileSync(new URL("../../docs/prd.md", import.meta.url), "utf8");
const g7 = prd.slice(prd.indexOf("## G7"), prd.indexOf("## G8"));

test("fourteen lessons, ids L00 to L13, names and new keys as PRD G7 lists them", () => {
  assert.equal(LADDER.length, 14);
  for (const l of LADDER) {
    assert.equal(l.id, `L${String(l.n).padStart(2, "0")}`);
    const row = g7.split("\n").find((r) => r.startsWith(`| ${l.n} |`));
    assert.ok(row, `PRD row for ${l.n}`);
    const [, , name, keys] = row.split("|").map((c) => c.trim());
    assert.equal(l.name, name, l.id);
    // Each new key appears in the PRD's "New keys" cell ("space" and "Shift" as words).
    for (const k of l.keys) {
      const word = k === " " ? "space" : k;
      assert.ok(keys.toLowerCase().includes(word.toLowerCase()), `${l.id}: "${word}" in "${keys}"`);
    }
    if (l.note) assert.ok(keys.includes(l.note), `${l.id}: note`);
  }
  assert.deepEqual(lessonById("L06").keys, [..."zxcvbnm,."]);
});

test("groups: home 0 to 3, top 4 and 5, bottom 6, beyond 7 to 13; built is 0 to 6", () => {
  const ids = (g) => LADDER.filter((l) => l.group === g).map((l) => l.n);
  assert.deepEqual(ids("home"), [0, 1, 2, 3]);
  assert.deepEqual(ids("top"), [4, 5]);
  assert.deepEqual(ids("bottom"), [6]);
  assert.deepEqual(ids("beyond"), [7, 8, 9, 10, 11, 12, 13]);
  assert.deepEqual(
    BUILT.map((l) => l.n),
    [0, 1, 2, 3, 4, 5, 6],
  );
  for (const l of LADDER) assert.equal(l.built, l.n <= 6, l.id);
});

test("learned keys: this lesson's and every earlier one's; space from Lesson 1 on", () => {
  assert.deepEqual(learnedKeys("L00"), ["f", "j"]);
  assert.deepEqual(learnedKeys("L01"), [" ", "a", "d", "f", "j", "s"]);
  assert.deepEqual(learnedKeys("L02"), [" ", ";", "a", "d", "f", "j", "k", "l", "s"]);
  assert.deepEqual(learnedKeys("L03").join(""), " ;adfghjkls");
  assert.equal(learnedKeys("L06").length, 30); // 26 letters, ; , . and space
  for (let n = 1; n <= 6; n++) {
    const now = new Set(learnedKeys(LADDER[n].id));
    for (const k of learnedKeys(LADDER[n - 1].id)) assert.ok(now.has(k), `L0${n} keeps "${k}"`);
    for (const k of LADDER[n].keys) assert.ok(now.has(k), `L0${n} learns "${k}"`);
  }
  assert.deepEqual(keysBefore("L01"), ["f", "j"]); // Lesson 1 warms up on F and J (Req 2.4)
  assert.deepEqual(keysBefore("L00"), []);
});

test("an id that is not on the ladder is a programmer error", () => {
  for (const bad of ["L14", "l01", "", "1", undefined]) {
    assert.throws(() => lessonById(bad), RangeError);
  }
});
