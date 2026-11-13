// The finger table (lessons design: Fingers), word for word, and the home key each new-key
// pattern is anchored on.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { anchorOf, FINGER_KEYS, fingerKind, fingerOf } from "./fingers.js";
import { learnedKeys } from "./ladder.js";

const design = readFileSync(
  new URL("../../.kiro/specs/lessons/design.md", import.meta.url),
  "utf8",
);

test("the table is design.md's Fingers line, finger by finger", () => {
  const line = design.split("\n").find((l) => l.startsWith("Left pinky `"));
  const parts = line.replace(/\.$/, "").split("; ");
  const rows = parts.slice(0, 8).map((p) => p.match(/^(\w+ \w+) `([^`]+)`$/));
  for (const [, finger, keys] of rows) {
    for (const k of keys.split(" ")) assert.equal(fingerOf(k), finger.toLowerCase(), k);
  }
  assert.equal(parts[8], "thumbs: space");
  assert.equal(fingerOf(" "), "thumbs");
});

test("every key any lesson uses has a finger, and nothing else does", () => {
  for (const k of learnedKeys("L13")) assert.ok(fingerOf(k), `"${k}"`);
  // 26 letters, ; , . space (8a), then 10 digits and ' " - : ? / ! @ # $ % & ( ) (8b)
  assert.equal(FINGER_KEYS.length, 54);
  for (const k of ["`", "[", "=", "^", "*", "x1", "AB", ""]) assert.equal(fingerOf(k), null, k);
});

test("8b keys use their base key's finger; a capital uses its letter's (lessons-8b Req 3.1)", () => {
  const want = {
    1: "left pinky",
    "!": "left pinky",
    2: "left ring",
    "@": "left ring",
    3: "left middle",
    "#": "left middle",
    4: "left index",
    $: "left index",
    5: "left index",
    "%": "left index",
    6: "right index",
    7: "right index",
    "&": "right index",
    8: "right middle",
    9: "right ring",
    "(": "right ring",
    0: "right pinky",
    ")": "right pinky",
    "'": "right pinky",
    '"': "right pinky",
    "-": "right pinky",
    ":": "right pinky",
    "?": "right pinky",
    "/": "right pinky",
    A: "left pinky",
    J: "right index",
    P: "right pinky",
  };
  for (const [k, f] of Object.entries(want)) assert.equal(fingerOf(k), f, k);
});

test("finger kinds for the colors: pinky, ring, middle, index, thumb", () => {
  assert.equal(fingerKind("q"), "pinky");
  assert.equal(fingerKind(";"), "pinky");
  assert.equal(fingerKind("s"), "ring");
  assert.equal(fingerKind(","), "middle");
  assert.equal(fingerKind("g"), "index");
  assert.equal(fingerKind(" "), "thumb");
  assert.equal(fingerKind("1"), "pinky");
  assert.equal(fingerKind("`"), null);
});

test("anchors: a reach key on its finger's home key, a home key on F or J", () => {
  assert.equal(anchorOf("g"), "f");
  assert.equal(anchorOf("h"), "j");
  assert.equal(anchorOf("r"), "f");
  assert.equal(anchorOf("q"), "a");
  assert.equal(anchorOf("p"), ";");
  assert.equal(anchorOf("."), "l");
  assert.equal(anchorOf("a"), "f");
  assert.equal(anchorOf("l"), "j");
  assert.equal(anchorOf("f"), "j");
  assert.equal(anchorOf("j"), "f");
  assert.equal(anchorOf(" "), null);
  assert.equal(anchorOf("4"), "f");
  assert.equal(anchorOf("$"), "f");
  assert.equal(anchorOf("0"), ";");
  assert.equal(anchorOf("A"), "a");
  for (const k of FINGER_KEYS.filter((x) => x !== " ")) {
    assert.notEqual(anchorOf(k), k, k);
    assert.match(anchorOf(k), /^[asdfjkl;]$/, k);
  }
});
