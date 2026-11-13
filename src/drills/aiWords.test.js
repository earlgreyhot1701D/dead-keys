// AI drill words (ai-drills Req 3.2): split on spaces, lowercase, deduplicated, charset letters only.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { aiItems, aiWords } from "./aiWords.js";

const AZ = "abcdefghijklmnopqrstuvwxyz";

test("words from every line, in order, each once", () => {
  assert.deepEqual(aiWords(["quiet queen quote", "equal quiet  square"], AZ), [
    "quiet",
    "queen",
    "quote",
    "equal",
    "square",
  ]);
});

test("lowercased, and any word with a character outside the charset is dropped", () => {
  assert.deepEqual(aiWords(["Quiet QUEEN", "ñame quote; jazz2 equal"], AZ), [
    "quiet",
    "queen",
    "equal",
  ]);
  assert.deepEqual(aiWords(["fad sad flax"], "asdfjkl;"), ["fad", "sad"]);
  assert.deepEqual(aiWords([], AZ), []);
  assert.deepEqual(aiWords(undefined, AZ), []);
});

test("items: one per word, in the round's item shape", () => {
  assert.deepEqual(aiItems(["quiet", "queen"]), [
    { id: "ai-1", text: "quiet", kind: "word", source: "ai" },
    { id: "ai-2", text: "queen", kind: "word", source: "ai" },
  ]);
});

test("property: every word is non-empty, unique, lowercase charset letters, and from the lines", () => {
  const line = fc.string({ unit: fc.constantFrom(..."abcQZ ñ1x"), maxLength: 40 });
  fc.assert(
    fc.property(fc.array(line, { maxLength: 8 }), (lines) => {
      const words = aiWords(lines, AZ);
      const all = lines.join(" ").toLowerCase().split(" ");
      return (
        new Set(words).size === words.length &&
        words.every((w) => /^[a-z]+$/.test(w) && all.includes(w))
      );
    }),
  );
});
