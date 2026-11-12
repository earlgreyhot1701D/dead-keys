// The play footer's hint (play copy table, Shara, Nov 12): coaching during the warm-up and in
// Practice, then only the let-go line, and the amber line after a wrong key.
import assert from "node:assert/strict";
import { test } from "node:test";
import { COACH, LET_GO_HINT, lockHint, WRONG_HINT } from "./playHud.js";

const word = (over = {}) => ({ id: 1, text: "cat", typed: 1, progress: 0, slot: 0, ...over });
const st = (over = {}) => ({
  mode: "falling",
  warmup: 0,
  lockId: null,
  targets: [word()],
  ...over,
});

test("after the warm-up: nothing locked says nothing; locked says how to let go", () => {
  assert.equal(lockHint(st()), "");
  assert.equal(lockHint(st({ lockId: 1 })), LET_GO_HINT);
});

test("during the warm-up and in Practice it coaches every step", () => {
  for (const s of [st({ warmup: 2 }), st({ mode: "practice" })]) {
    assert.equal(lockHint(s), COACH.pick);
    assert.equal(lockHint({ ...s, lockId: 1 }), COACH.finish);
  }
});

test("after a wrong key, it always names the amber letter", () => {
  const wrong = { targets: [word({ wrong: true })], lockId: 1 };
  assert.equal(lockHint(st(wrong)), WRONG_HINT);
  assert.equal(lockHint(st({ ...wrong, warmup: 1 })), WRONG_HINT);
});

test("every line is in the copy table", async () => {
  const { readFileSync } = await import("node:fs");
  const design = readFileSync(new URL("../../.kiro/specs/play/design.md", import.meta.url), "utf8");
  for (const line of [LET_GO_HINT, WRONG_HINT, COACH.pick, COACH.finish])
    assert.ok(design.includes(`"${line}"`), line);
});
