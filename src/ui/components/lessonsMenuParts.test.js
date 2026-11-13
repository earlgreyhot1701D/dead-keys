// The Lessons menu's learned-keys map keeps the locked mock's letter rows after Block 8b: no
// number row, no ' and no /, even though the lesson keyboard has them from Lesson 8.
import assert from "node:assert/strict";
import { test } from "node:test";
import { lessonStates } from "../../lessons/menuModel.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { lessonsMap } from "./lessonsMenuParts.js";

test("the map: three letter rows, as the mock draws them", () => {
  withFakeDocument(() => {
    const { states, recommended } = lessonStates({ lessonsPassed: [], rounds: [], keys: [] });
    const rows = findAll(lessonsMap(states, recommended), (n) =>
      (n.attrs?.class ?? "").startsWith("lm-kb-row "),
    ).map(textOf);
    assert.deepEqual(rows, ["qwertyuiop", "asdfghjkl;", "zxcvbnm,."]);
  });
});
