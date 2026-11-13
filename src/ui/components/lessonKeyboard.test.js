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

test("the rows: q to p, a to ;, z to period, then space", () => {
  assert.deepEqual(
    LESSON_ROWS.map((r) => r.join("")),
    ["qwertyuiop", "asdfghjkl;", "zxcvbnm,.", " "],
  );
});

test("each key: its finger, learned or dimmed, the waiting key filled, F and J bumped", () => {
  const learned = new Set(learnedKeys("L01"));
  assert.equal(keyClass("a", learned, null), "ls-k f-pinky is-learned");
  assert.equal(keyClass("f", learned, "f"), "ls-k f-index is-learned is-next is-bump");
  assert.equal(keyClass("q", learned, null), "ls-k f-pinky");
  assert.equal(keyClass(" ", learned, " "), "ls-k f-thumb is-learned is-next is-space");
  for (const k of LESSON_ROWS.flat())
    assert.ok(keyClass(k, learned, null).includes(`f-${fingerKind(k)}`));
});

test("show() fills only the waiting key, and the keyboard is hidden from a screen reader", () => {
  withDoc(() => {
    const kb = createLessonKeyboard(learnedKeys("L03"));
    assert.equal(kb.node.attrs["aria-hidden"], "true");
    const next = () => findAll(kb.node, (n) => (n.attrs?.class ?? "").includes("is-next"));
    kb.show("g");
    assert.deepEqual(next().map(textOf), ["g"]);
    kb.show(" ");
    assert.deepEqual(next().map(textOf), ["space"]);
    kb.show(null);
    assert.equal(next().length, 0);
  });
});

test("the legend is the copy table's", () => {
  const design = readFileSync(
    new URL("../../../.kiro/specs/lessons/design.md", import.meta.url),
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
