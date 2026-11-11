// Design decisions 1 and 2: which key sits in which group. The table is written by hand from the
// design text, not worked out by the code, so it can disagree with GROUPS (and should fail if so).
import assert from "node:assert/strict";
import { test } from "node:test";
import { GROUPS } from "./progressConfig.js";

const idsOf = (key) =>
  GROUPS.filter((g) => g.has(key))
    .map((g) => g.id)
    .sort();

// key -> the group ids it belongs to
const TABLE = [
  // home row, by hand
  ["a", ["homeRow", "leftHand"]],
  ["g", ["homeRow", "leftHand"]],
  ["h", ["homeRow", "rightHand"]],
  ["l", ["homeRow", "rightHand"]],
  [";", ["homeRow", "rightHand", "symbols"]],
  // top row, by hand
  ["q", ["topRow", "leftHand"]],
  ["t", ["topRow", "leftHand"]],
  ["y", ["topRow", "rightHand"]],
  ["p", ["topRow", "rightHand"]],
  // bottom row, by hand
  ["z", ["bottomRow", "leftHand"]],
  ["b", ["bottomRow", "leftHand"]],
  ["n", ["bottomRow", "rightHand"]],
  [",", ["bottomRow", "rightHand", "symbols"]],
  [".", ["bottomRow", "rightHand", "symbols"]],
  ["/", ["bottomRow", "rightHand", "symbols"]],
  // digits: a hand each, never a row
  ["1", ["digits", "leftHand"]],
  ["5", ["digits", "leftHand"]],
  ["6", ["digits", "rightHand"]],
  ["0", ["digits", "rightHand"]],
  // a capital counts for shift and for its base letter's row and hand
  ["A", ["homeRow", "leftHand", "shift"]],
  ["Q", ["leftHand", "shift", "topRow"]],
  ["T", ["leftHand", "shift", "topRow"]],
  ["P", ["rightHand", "shift", "topRow"]],
  // a shifted symbol counts for shift, symbols and its base key's hand and row
  ["!", ["leftHand", "shift", "symbols"]],
  ["@", ["leftHand", "shift", "symbols"]],
  ["$", ["leftHand", "shift", "symbols"]],
  ["^", ["rightHand", "shift", "symbols"]],
  [")", ["rightHand", "shift", "symbols"]],
  [":", ["homeRow", "rightHand", "shift", "symbols"]],
  ["<", ["bottomRow", "rightHand", "shift", "symbols"]],
  ["?", ["bottomRow", "rightHand", "shift", "symbols"]],
  // shifted symbols whose base key is on no row or hand in the design
  ["_", ["shift", "symbols"]],
  ['"', ["shift", "symbols"]],
  ["~", ["shift", "symbols"]],
  // unshifted symbols with no row or hand in the design
  ["'", ["symbols"]],
  ["-", ["symbols"]],
  ["[", ["symbols"]],
  ["¿", ["symbols"]],
  // accented letters: no group (Block 15 adds an "accents" group); a capital is still a shift
  ["á", []],
  ["ñ", []],
  ["Á", ["shift"]],
  ["Ñ", ["shift"]],
  // space is in no group
  [" ", []],
];

test("each key sits in exactly the groups the design says", () => {
  for (const [key, want] of TABLE) {
    assert.deepEqual(idsOf(key), [...want].sort(), `key ${JSON.stringify(key)}`);
  }
});

test("every letter a to z is in exactly one row and one hand; its capital adds only shift", () => {
  for (const c of "abcdefghijklmnopqrstuvwxyz") {
    const ids = idsOf(c);
    const rows = ids.filter((id) => id.endsWith("Row"));
    const hands = ids.filter((id) => id.endsWith("Hand"));
    assert.equal(rows.length, 1, c);
    assert.equal(hands.length, 1, c);
    assert.equal(ids.length, 2, c);
    assert.deepEqual(idsOf(c.toUpperCase()), [...ids, "shift"].sort(), c.toUpperCase());
  }
});

test("every digit is in the digits group and exactly one hand, and in no row", () => {
  for (const d of "0123456789") {
    const ids = idsOf(d);
    assert.ok(ids.includes("digits"), d);
    assert.equal(ids.filter((id) => id.endsWith("Hand")).length, 1, d);
    assert.equal(ids.filter((id) => id.endsWith("Row")).length, 0, d);
  }
});

test("the eight groups, each with a phrase for the sentence", () => {
  assert.deepEqual(
    GROUPS.map((g) => [g.id, g.phrase]),
    [
      ["topRow", "top row"],
      ["homeRow", "home row"],
      ["bottomRow", "bottom row"],
      ["leftHand", "left hand"],
      ["rightHand", "right hand"],
      ["shift", "shift keys"],
      ["digits", "digits"],
      ["symbols", "symbols"],
    ],
  );
});
