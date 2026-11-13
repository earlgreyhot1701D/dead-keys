// The Lessons menu's model (lessons Req 5.2, 5.3) and its copy: states, group counts, the
// learned-keys map, the key labels as the mock writes them, and every line from the copy table.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { MENU } from "./copy.js";
import { LADDER } from "./ladder.js";
import {
  CARD_STATE,
  capLabels,
  GROUPS,
  groupCount,
  KEY_LABELS,
  legendText,
  lessonStates,
  mapKeys,
  STATE,
} from "./menuModel.js";

const design = readFileSync(
  new URL("../../.kiro/specs/lessons/design.md", import.meta.url),
  "utf8",
);
const row = (where) => design.split("\n").find((l) => l.startsWith(`| ${where} |`)) ?? "";
const mock = readFileSync(new URL("../../mock/lessons.html", import.meta.url), "utf8");
const progress = (passed = [], rounds = [{ id: "r", mode: "falling" }]) => ({
  rounds,
  keys: [],
  lessonsPassed: passed,
});

test("states: passed, tested out, next (recommended), open, later", () => {
  const p = progress([
    { lessonId: "L00", how: "lesson" },
    { lessonId: "L01", how: "lesson" },
    { lessonId: "L02", how: "testout" },
  ]);
  const { states, recommended } = lessonStates(p);
  assert.equal(recommended, "L03");
  assert.deepEqual(
    LADDER.map((l) => states[l.id]),
    ["passed", "passed", "testedOut", "next", "open", "open", "open", ...Array(7).fill("later")],
  );
  assert.equal(lessonStates(progress([], [])).recommended, "L00", "a new player: Lesson 0");
});

test("group counts: tested out counts; Beyond letters is LATER (the mock's screen D)", () => {
  const { states } = lessonStates(
    progress([
      { lessonId: "L00", how: "lesson" },
      { lessonId: "L01", how: "lesson" },
      { lessonId: "L02", how: "testout" },
    ]),
  );
  assert.equal(groupCount("home", states), "3 OF 4 PASSED");
  assert.equal(groupCount("top", states), "0 OF 2 PASSED");
  assert.equal(groupCount("bottom", states), "0 OF 1 PASSED");
  assert.equal(groupCount("beyond", states), "LATER");
});

test("the map: passed lessons' keys lit, the recommended lesson's outlined, as the mock draws", () => {
  const { states, recommended } = lessonStates(
    progress([
      { lessonId: "L00", how: "lesson" },
      { lessonId: "L01", how: "lesson" },
      { lessonId: "L02", how: "testout" },
    ]),
  );
  const m = mapKeys(states, recommended);
  assert.deepEqual([...m.lit].sort().join(""), ";adfjkls");
  assert.deepEqual(m.next, ["g", "h"]);
  assert.equal(m.learned, 8); // the mock's LEARNED 8
  assert.deepEqual(legendText(8, ["g", "h"]), {
    learned: "LEARNED 8",
    next: "NEXT: G H",
    toCome: "TO COME",
  });
  assert.equal(legendText(30, []).next, null, "nothing next: no NEXT line");
});

test("key labels and caps: the mock's rows, and the card's caps", () => {
  for (const l of LADDER) {
    const n = String(l.n).padStart(2, "0");
    assert.ok(
      mock.includes(
        `<span class="n">${n}</span><span class="nm">${l.name}</span><span class="ks">${KEY_LABELS[l.id]}</span>`,
      ),
      l.id,
    );
  }
  assert.deepEqual(capLabels("L03"), ["G", "H", "SPACE"]);
  assert.deepEqual(capLabels("L00"), ["F", "J"]);
});

test("every Lessons menu line is the copy table's", () => {
  assert.ok(row("Ladder sub-title").includes(`\`${MENU.sub}\``));
  assert.ok(row("Group headings").includes(GROUPS.map(([, h]) => `\`${h}\``).join(", ")));
  assert.ok(
    row("Row states").includes(
      Object.values(STATE)
        .map((s) => `\`${s}\``)
        .join(", "),
    ),
  );
  for (const s of ["NEXT UP", "PASSED", "TESTED OUT", "OPEN"])
    assert.ok(Object.values(CARD_STATE).includes(s));
  assert.ok(row("Card labels").includes("`NEXT UP`, `PASSED`, `TESTED OUT`, `OPEN`"));
  const parts = (list) => list.map(([b, rest], i) => `\`${i + 1}. ${b}${rest}\``).join(" / ");
  assert.ok(row("Card parts, Lessons 1 to 6").includes(parts(MENU.parts)));
  assert.ok(row("Card parts, Lesson 0").includes(parts(MENU.parts0)));
  assert.ok(row("Card, Later lessons").includes(`\`${MENU.later}\``));
  assert.ok(row("Buttons").includes(`\`[ ${MENU.start} ]\`, \`[ ${MENU.testOut} ]\``));
  assert.ok(row("Under the buttons").includes(`\`${MENU.testOutNote}\``));
  assert.ok(row("Ladder footer").includes(MENU.footer.map((s) => `\`${s}\``).join(", ")));
  assert.ok(mock.includes(MENU.node));
});
