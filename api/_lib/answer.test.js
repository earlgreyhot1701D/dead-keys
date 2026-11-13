// The model's answer (ai-drills Req 2.5 as changed Nov 13, 7.1): normal end only; then a bag of
// words, each kept only if it is charset letters, 2 to 12 long and not blocked; packed into lines of
// at most 80 characters, at most 8 lines. The golden set's failures (a 122-character line, a
// numbered run-on list) now keep their good words instead of throwing the drill away.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkAnswer, cleanWords, MAX_LINE, MAX_LINES, NORMAL_END, packLines } from "./answer.js";

const CHARSET = "abcdefghijklmnopqrstuvwxyz";
const ok = (text) => checkAnswer({ text, stopReason: NORMAL_END }, CHARSET);
const fixture = (p) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${p}`, import.meta.url), "utf8")).value;

test("a clean answer keeps its words, lowercased, packed into lines", () => {
  assert.deepEqual(ok("  Quiet queen quote \n\n equal  SQUARE\r\n"), {
    ok: true,
    lines: ["quiet queen quote equal square"],
    dropped: 0,
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

test("an answer with no usable word is empty", () => {
  for (const text of ["", "\n  \n", "1. 2. 3.", "ñ ¿ ¡", "a b c"]) {
    assert.deepEqual(ok(text), { ok: false, code: "empty" }, JSON.stringify(text));
  }
});

test("numbers, punctuation and list markers are dropped word by word", () => {
  const r = ok("1. quiet, queen\n2) equal square 2026 ñame quiz!");
  assert.deepEqual(r.lines, ["queen equal square"]);
  assert.equal(r.dropped, 6); // "1." "quiet," "2)" "2026" "ñame" "quiz!"
});

test("blocklisted words never reach the player", () => {
  const blocked = readFileSync(new URL("../../packs/blocklist.txt", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && /^[a-z]{2,12}$/.test(l));
  assert.ok(blocked, "the blocklist has a plain word to test with");
  assert.deepEqual(cleanWords(`quiet ${blocked} queen`, CHARSET).kept, ["quiet", "queen"]);
});

test("words over 12 letters are dropped; 2 to 12 are kept", () => {
  assert.deepEqual(cleanWords(`qq ${"q".repeat(12)} ${"q".repeat(13)} q`, CHARSET).kept, [
    "qq",
    "q".repeat(12),
  ]);
});

test("a long run-on answer becomes lines of at most 80 characters, at most 8 lines", () => {
  const words = Array.from(
    { length: 200 },
    (_, i) =>
      `q${"abcdefghij"[i % 10]}${"klmnopqrst"[Math.floor(i / 10) % 10]}${"uvwxyz"[Math.floor(i / 100)]}`,
  );
  const r = ok(words.join(" ")); // one 1,200-character line, like the golden set's failure
  assert.equal(r.ok, true);
  assert.equal(r.lines.length, MAX_LINES);
  assert.ok(r.lines.every((l) => l.length <= MAX_LINE));
  assert.deepEqual(packLines([]), []);
});

test("the ugly fixtures: out-of-charset words dropped; truncated mid-line rejected by its stop reason", () => {
  const raw = (p) =>
    JSON.parse(readFileSync(new URL(`../../fixtures/${p}`, import.meta.url), "utf8"));
  const mini = fixture("normal/pack.mini.json").charset; // the fixture's own pack: no x
  const bad = fixture("ugly/drillResponse.out-of-charset.json");
  const r = checkAnswer({ text: bad.lines.join("\n"), stopReason: NORMAL_END }, mini);
  if (r.ok) assert.ok(r.lines.every((l) => [...l].every((ch) => ch === " " || mini.includes(ch))));
  else assert.equal(r.code, "empty");
  const cut = raw("ugly/drillResponse.truncated-mid-line.json").raw;
  assert.deepEqual(checkAnswer({ text: cut, stopReason: "max_tokens" }, mini), {
    ok: false,
    code: "stop",
  });
});

test("a repeated word counts once", () => {
  assert.deepEqual(cleanWords("quiet quiet Quiet queen quiet", CHARSET).kept, ["quiet", "queen"]);
});
