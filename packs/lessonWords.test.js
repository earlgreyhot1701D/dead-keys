// The early lessons' words (lessons Req 2.5): exactly design.md's list, each in SCOWL en_US,
// none on the blocklist, and each made only of its lesson's learned keys.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseBlocklist, readUsWords } from "../scripts/build-pack.js";
import { learnedKeys } from "../src/lessons/ladder.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const words = JSON.parse(read("./lessonWords.json"));
const design = read("../.kiro/specs/lessons/design.md");

test("the words are design.md's table, word for word and in order", () => {
  assert.deepEqual(Object.keys(words), ["L01", "L02", "L03"]);
  for (const id of Object.keys(words)) {
    const row = design.split("\n").find((l) => l.startsWith(`| ${id} (`));
    assert.ok(row, id);
    assert.equal(row.split("|")[2].trim(), words[id].join(", "), id);
  }
});

test("every word is in the US spelling list and not on the blocklist", () => {
  const us = readUsWords(new URL("./source/scowl_en_US.txt", import.meta.url));
  const blocked = parseBlocklist(read("./blocklist.txt"));
  for (const w of Object.values(words).flat()) {
    assert.ok(us.has(w), `${w} is not in SCOWL en_US`);
    assert.ok(!blocked.has(w), `${w} is on the blocklist`);
  }
});

test("each lesson's words use only its learned keys, lower case, no repeats", () => {
  for (const [id, list] of Object.entries(words)) {
    const keys = new Set(learnedKeys(id));
    for (const w of list) {
      assert.match(w, /^[a-z;]+$/, w);
      for (const ch of w) assert.ok(keys.has(ch), `${w} in ${id}: "${ch}" is not learned yet`);
    }
    assert.equal(new Set(list).size, list.length, id);
  }
});
