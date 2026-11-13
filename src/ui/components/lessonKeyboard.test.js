// The lesson keyboard (lessons Req 7.1, 7.5): the letter rows and space, finger colors, learned
// keys bright, the waiting key filled, bumps on F and J, hidden from a screen reader; the legend
// is the copy table's.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fingerKind } from "../../lessons/fingers.js";
import { learnedKeys } from "../../lessons/ladder.js";
import { createEl } from "../dom.js";
import { findAll, makeFakeDoc, textOf } from "../fakeDom.js";
import {
  createLessonKeyboard,
  keyClass,
  LEGEND,
  LESSON_ROWS,
  legend,
  NEXT_KEY,
} from "./lessonKeyboard.js";

function withDoc(fn) {
  globalThis.document = makeFakeDoc();
  try {
    return fn(createEl(globalThis.document));
  } finally {
    delete globalThis.document;
  }
}

test("the rows: numbers, q to p, a to ', z to /, then space (lessons-8b Req 6)", () => {
  assert.deepEqual(
    LESSON_ROWS.map((r) => r.join("")),
    ["1234567890-", "qwertyuiop", "asdfghjkl;'", "zxcvbnm,./", " "],
  );
});

const rowsOf = (node) =>
  findAll(node, (n) => (n.attrs?.class ?? "").startsWith("ls-row ")).map((r) => r.attrs.class);

test("Lessons 0 to 6 draw the letter rows only; the number row from Lesson 8; Shift from 7", () => {
  withDoc(() => {
    const kb = (id) => createLessonKeyboard(learnedKeys(id)).node;
    for (const id of ["L00", "L03", "L06", "L07"]) {
      assert.deepEqual(
        rowsOf(kb(id)),
        ["ls-row ls-row-0", "ls-row ls-row-1", "ls-row ls-row-2", "ls-row ls-row-3"],
        id,
      );
    }
    assert.equal(rowsOf(kb("L08"))[0], "ls-row ls-row-num");
    const shifts = (id) =>
      findAll(kb(id), (n) => (n.attrs?.class ?? "").includes("is-shift")).length;
    assert.equal(shifts("L06"), 0);
    assert.equal(shifts("L07"), 2);
  });
});

test("each key: its finger, learned or dimmed, the waiting key filled, F and J bumped", () => {
  const learned = new Set(learnedKeys("L01"));
  assert.equal(keyClass("a", learned, null), "ls-k f-pinky is-learned");
  assert.equal(keyClass("f", learned, "f"), "ls-k f-index is-learned is-next is-bump");
  assert.equal(keyClass("q", learned, null), "ls-k f-pinky");
  assert.equal(keyClass(" ", learned, " "), "ls-k f-thumb is-learned is-next is-space");
  assert.equal(keyClass("ShiftLeft", learned, null), "ls-k f-pinky is-shift");
  for (const k of LESSON_ROWS.flat())
    assert.ok(keyClass(k, learned, null).includes(`f-${fingerKind(k)}`));
});

test("show() fills only the waiting key, and the keyboard is hidden from a screen reader", () => {
  withDoc(() => {
    const kb = createLessonKeyboard(learnedKeys("L03"));
    assert.equal(kb.node.attrs["aria-hidden"], "true");
    const next = () => findAll(kb.node, (n) => (n.attrs?.class ?? "").includes("is-next"));
    kb.show("g");
    assert.deepEqual(next().map(textOf), ["gI"]); // the key and its finger's initial
    kb.show(" ");
    assert.deepEqual(next().map(textOf), ["spaceT"]);
    kb.show(null);
    assert.equal(next().length, 0);
  });
});

test("a capital or a symbol fills its key and the other hand's Shift (Lesson 7 teaches it)", () => {
  withDoc(() => {
    const kb = createLessonKeyboard(learnedKeys("L11"));
    const next = () =>
      findAll(kb.node, (n) => (n.attrs?.class ?? "").includes("is-next"))
        .map(textOf)
        .sort();
    kb.show("A"); // left pinky letter: right Shift
    assert.deepEqual(next(), ["aP", "shiftP"]);
    kb.show("$"); // on 4, left index: right Shift
    assert.deepEqual(next(), ["4I", "shiftP"]);
    kb.show("?"); // on /, right pinky: left Shift
    assert.deepEqual(next(), ["/P", "shiftP"]);
    kb.show("k");
    assert.deepEqual(next(), ["kM"]);
  });
});

test("finger colors off keeps the initials and drops the colors (Req 7)", () => {
  withDoc(() => {
    assert.equal(
      createLessonKeyboard(learnedKeys("L09"), { colors: false }).node.attrs.class,
      "ls-kb no-colors",
    );
    assert.equal(createLessonKeyboard(learnedKeys("L09")).node.attrs.class, "ls-kb");
  });
});

test("the legend is the copy table's", () => {
  const design = readFileSync(
    new URL("../../../.kiro/specs/lessons-8b/design.md", import.meta.url),
    "utf8",
  );
  const row = design.split("\n").find((l) => l.startsWith("| Legend |"));
  assert.equal(
    row,
    `| Legend | ${[...LEGEND.map(([, l]) => l), NEXT_KEY].map((s) => `\`${s}\``).join(", ")} |`,
  );
  withDoc(() => {
    assert.equal(textOf(legend()), [...LEGEND.map(([, l]) => l), NEXT_KEY].join(""));
  });
});

test("a letters lesson's rows are Block 8a's exactly: no ' and no /", () => {
  withDoc(() => {
    const caps = (id) =>
      findAll(createLessonKeyboard(learnedKeys(id)).node, (n) =>
        (n.attrs?.class ?? "").startsWith("ls-k "),
      )
        .map((n) => textOf(n).slice(0, -1))
        .join("");
    assert.equal(caps("L06"), "qwertyuiopasdfghjkl;zxcvbnm,.space");
    assert.ok(caps("L08").includes("'") && caps("L08").includes("/"));
  });
});
