// The model's answer (ai-drills Req 2.5, 7.1): normal end only, lines trimmed and capped at 8, the
// charset plus space, one bad character rejects all, and the ugly fixtures stay rejected.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkAnswer, MAX_LINES, NORMAL_END } from "./answer.js";

const CHARSET = "abcdefghijklmnopqrstuvwxyz";
const ok = (text) => checkAnswer({ text, stopReason: NORMAL_END }, CHARSET);
const fixture = (p) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${p}`, import.meta.url), "utf8")).value;

test("a clean answer: lines trimmed, blank lines dropped", () => {
  assert.deepEqual(ok("  quiet queen quote \n\n equal square\r\n"), {
    ok: true,
    lines: ["quiet queen quote", "equal square"],
  });
});

test("anything but a normal end is discarded: cut off, filtered, missing", () => {
  for (const stopReason of ["max_tokens", "content_filtered", "guardrail_intervened", null]) {
    assert.deepEqual(checkAnswer({ text: "quiet queen", stopReason }, CHARSET), {
      ok: false,
      code: "stop",
    });
  }
});

test("an empty answer is its own code", () => {
  assert.deepEqual(ok("\n  \n"), { ok: false, code: "empty" });
  assert.deepEqual(ok(""), { ok: false, code: "empty" });
});

test("at most 8 lines are kept", () => {
  const r = ok(Array.from({ length: 12 }, (_, i) => `line ${"q".repeat(i + 1)}`).join("\n"));
  assert.equal(MAX_LINES, 8);
  assert.equal(r.lines.length, 8);
});

test("one bad character anywhere rejects the whole answer", () => {
  for (const bad of [
    "quiet, queen",
    "Quiet queen",
    "quiet queen 2",
    "quiet\tqueen",
    "ñame",
    "1. quiet",
  ]) {
    assert.deepEqual(ok(`equal square\n${bad}`), { ok: false, code: "invalid" }, bad);
  }
});

test("a line over 80 characters rejects the answer", () => {
  assert.deepEqual(ok("q".repeat(81)), { ok: false, code: "invalid" });
  assert.equal(ok("q".repeat(80)).ok, true);
});

test("the ugly fixtures: out of charset rejected; truncated mid-line rejected by its stop reason", () => {
  const raw = (p) =>
    JSON.parse(readFileSync(new URL(`../../fixtures/${p}`, import.meta.url), "utf8"));
  const mini = fixture("normal/pack.mini.json").charset; // the fixture's own pack: no x
  const bad = fixture("ugly/drillResponse.out-of-charset.json");
  const text = bad.lines.join("\n");
  assert.deepEqual(checkAnswer({ text, stopReason: NORMAL_END }, mini), {
    ok: false,
    code: "invalid",
  });
  const cut = raw("ugly/drillResponse.truncated-mid-line.json").raw;
  assert.deepEqual(checkAnswer({ text: cut, stopReason: "max_tokens" }, mini), {
    ok: false,
    code: "stop",
  });
});
