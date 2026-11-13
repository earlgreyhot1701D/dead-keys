// What a lesson says as it moves on (lessons-8b Req 9.6): each part once, with its coach line,
// then each line; the very first announcement waits for the heading.
import assert from "node:assert/strict";
import { test } from "node:test";
import { COACH, SAY } from "../../lessons/copy.js";
import { createSay } from "./lessonSay.js";

test("a part's first line says the part and its coach first; later lines just the line", () => {
  const said = [];
  const waited = [];
  const say = createSay("L03", "lesson", (f, ms) => waited.push(ms) && f());
  const lines = ["asdf", "jkl;"];
  say((t) => said.push(t), 1, "new", 1, lines);
  say((t) => said.push(t), 1, "new", 2, lines);
  assert.deepEqual(said, [
    `2. NEW KEYS. ${COACH.new.L03} ${SAY.line(1, 2, "asdf")}`,
    SAY.line(2, 2, "jkl;"),
  ]);
  assert.deepEqual(waited, [50], "only the very first announcement waits");
});

test("a test out says CHECK and the Check's coach line", () => {
  const said = [];
  createSay("L05", "testout", (f) => f())((t) => said.push(t), 0, "check", 1, ["we were"]);
  assert.deepEqual(said, [`CHECK. ${COACH.check} ${SAY.line(1, 1, "we were")}`]);
});
