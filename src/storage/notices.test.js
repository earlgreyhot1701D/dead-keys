// Notice wording: the seven notices exist, each has a line and a button, and the wording is exactly
// what was approved. The first five are in the storage requirements table; `otherTab` and
// `exportFailed` are in the shell design's copy table. The test reads both, so the code and the docs cannot drift apart.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NOTICES } from "./notices.js";

const FROM_STORAGE = ["blocked", "corrupt", "newer", "saveFailed", "importFailed"];
const FROM_SHELL = ["otherTab", "exportFailed"];
const IDS = [...FROM_STORAGE, ...FROM_SHELL];

/** A `notice` row of the shell design's copy table: its line and its button. */
function shellApproved(id) {
  const text = readFileSync(new URL("../../.kiro/specs/shell/design.md", import.meta.url), "utf8");
  const row = text.split("\n").find((l) => l.startsWith(`| \`${id}\` notice |`));
  const cell = row
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim())[1];
  const [line, button] = cell.split(" Button: ");
  return { line, button };
}

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

test("there are exactly the seven approved notice ids", () => {
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

test("the first five match the approved table in the storage requirements, word for word", () => {
  const want = approved();
  assert.deepEqual(Object.keys(want).sort(), [...FROM_STORAGE].sort());
  for (const id of FROM_STORAGE) {
    assert.equal(NOTICES[id].line, want[id].line, `${id} line`);
    assert.equal(NOTICES[id].button, want[id].button, `${id} button`);
  }
});

test("the Block 6 notices match the shell design's copy table, word for word", () => {
  for (const id of FROM_SHELL) {
    const want = shellApproved(id);
    assert.equal(NOTICES[id].line, want.line, `${id} line`);
    assert.equal(NOTICES[id].button, want.button, `${id} button`);
  }
  assert.match(NOTICES.otherTab.line, /^Your progress changed in another Dead Keys tab\./);
  assert.equal(
    NOTICES.exportFailed.line,
    "We couldn't make a backup file just now. Your progress is still saved in this browser. Try again in a moment.",
  );
  assert.equal(NOTICES.exportFailed.button, "Try again");
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
