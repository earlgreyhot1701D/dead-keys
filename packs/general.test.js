// The general word pack (Block 7, Req 1.4): passes the contract, every word in the charset and
// 3 to 8 letters, nothing from the blocklist, no duplicates, and the file is what the build makes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validate } from "../contract/validate.js";
import {
  ATTRIBUTION,
  CHARSET,
  makePack,
  parseBlocklist,
  pickWords,
  WORD_COUNT,
} from "../scripts/build-pack.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const pack = JSON.parse(read("./general.json"));
const words = pack.pools.words.map((w) => w.text);
const blocked = parseBlocklist(read("./blocklist.txt"));

test("the pack passes the contract", () => {
  assert.equal(validate("Pack", pack).status, "valid");
});

test("id, charset and the PRD G6 attribution", () => {
  assert.equal(pack.id, "general");
  assert.equal(pack.charset, "abcdefghijklmnopqrstuvwxyz");
  assert.equal(pack.charset, CHARSET);
  assert.equal(pack.attribution, ATTRIBUTION);
  assert.match(pack.attribution, /top-english-wordlists.*CC BY 3\.0/);
});

test("1,500 words, each 3 to 8 lowercase letters a to z", () => {
  assert.equal(words.length, 1500);
  assert.equal(WORD_COUNT, 1500);
  for (const w of words) assert.match(w, /^[a-z]{3,8}$/, w);
});

test("no word is on the blocklist, and there are no duplicates", () => {
  for (const w of words) assert.ok(!blocked.has(w), w);
  assert.equal(new Set(words).size, words.length);
  assert.equal(new Set(pack.pools.words.map((w) => w.id)).size, words.length);
});

test("most frequent first: the file is exactly what the build makes from the source", () => {
  const source = read("./source/top_english_words_lower_10000.txt").split(/\r?\n/);
  assert.deepEqual(makePack(pickWords(source, blocked)), pack);
  assert.deepEqual(words.slice(0, 5), ["the", "and", "that", "for", "was"]);
});

test("the build drops short, long, non-letter, repeated and blocked words", () => {
  const got = pickWords(
    ["of", "the", "The", "café", "it's", "abcdefghi", "the", "london", "cat"],
    new Set(["london"]),
    2,
  );
  assert.deepEqual(got, ["the", "cat"]);
  assert.throws(() => pickWords(["the"], new Set(), 2), /only 1 words/);
});

test("the blocklist parser skips comments and blank lines", () => {
  assert.deepEqual([...parseBlocklist("# note\n\nfoo\n  bar \n#baz\n")], ["foo", "bar"]);
});
