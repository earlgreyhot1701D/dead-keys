// Notice wording: the five notices exist, each has a line and a button, and the wording is exactly
// what requirements.md approved (the test reads the table there, so the two cannot drift apart).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NOTICES } from "./notices.js";

const IDS = ["blocked", "corrupt", "newer", "saveFailed", "importFailed"];

/** The approved table: id -> { line, button }, read from the requirements file. */
function approved() {
  const text = readFileSync(
    new URL("../../.kiro/specs/storage/requirements.md", import.meta.url),
    "utf8",
  );
  const section = text.slice(text.indexOf("## Notice wording"));
  const rows = section.split("\n").filter((l) => /^\| `\w+` \|/.test(l));
  return Object.fromEntries(
    rows.map((row) => {
      const [id, , line, button] = row
        .split("|")
        .slice(1, -1)
        .map((c) => c.trim());
      return [id.replaceAll("`", ""), { line, button }];
    }),
  );
}

test("there are exactly the five approved notice ids", () => {
  assert.deepEqual(Object.keys(NOTICES).sort(), [...IDS].sort());
});

test("every id has a line and a button, and the id on the notice matches its key", () => {
  for (const id of IDS) {
    const n = NOTICES[id];
    assert.equal(n.id, id);
    assert.ok(typeof n.line === "string" && n.line.length > 0, `${id} needs a line`);
    assert.ok(typeof n.button === "string" && n.button.length > 0, `${id} needs a button`);
  }
});

test("the wording matches the approved table in requirements.md, word for word", () => {
  const want = approved();
  assert.deepEqual(Object.keys(want).sort(), [...IDS].sort());
  for (const id of IDS) {
    assert.equal(NOTICES[id].line, want[id].line, `${id} line`);
    assert.equal(NOTICES[id].button, want[id].button, `${id} button`);
  }
});

test("the lines are plain text: no markup characters, no blame words", () => {
  for (const n of Object.values(NOTICES)) {
    assert.doesNotMatch(n.line, /[<>&]/, n.id);
    assert.doesNotMatch(n.line, /\byour fault\b|\binvalid\b|\billegal\b|\bforbidden\b/i, n.id);
  }
});

test("the notices cannot be changed by the screen", () => {
  assert.ok(Object.isFrozen(NOTICES));
  for (const n of Object.values(NOTICES)) assert.ok(Object.isFrozen(n), n.id);
});
