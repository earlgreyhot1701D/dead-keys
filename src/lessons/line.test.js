// The typing line (lessons Req 3): the right key moves on; a wrong key is kept and counted;
// Backspace clears only the wrong key; a space counts; gaps capped at 5 s; paused time never
// counts; keystrokes and time carry from line to line.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { backspace, GAP_CAP_MS, pauseLine, startLine, typeKey, waitingKey } from "./line.js";

/** Freeze deep, so any mutation by the engine throws. */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}
const type = (s, keys, every = 200) => {
  let at = s.lastAt ?? 1000;
  for (const k of keys) {
    at += every;
    s = freeze(typeKey(s, k, at));
  }
  return s;
};

test("the right key moves on and is a keystroke; the last one finishes the line", () => {
  const s = type(freeze(startLine("fj")), "f");
  assert.equal(s.typed, 1);
  assert.equal(waitingKey(s), "j");
  assert.deepEqual(s.keystrokes, [{ t: 0, expected: "f", typed: "f", ok: true }]);
  const done = type(s, "j");
  assert.equal(done.done, true);
  assert.equal(waitingKey(done), null);
  assert.equal(typeKey(done, "x", 9999), done, "a finished line ignores keys");
});

test("a wrong key never moves on: it is kept and counted as a miss against the expected key", () => {
  let s = type(freeze(startLine("fj")), "fk");
  assert.equal(s.typed, 1);
  assert.equal(s.wrong, "k");
  assert.deepEqual(s.keystrokes.at(-1), { t: 200, expected: "j", typed: "k", ok: false });
  s = type(s, "l"); // another wrong key takes its place, and counts too
  assert.equal(s.wrong, "l");
  assert.equal(s.keystrokes.length, 3);
  s = type(s, "j"); // the right key clears it and moves on
  assert.equal(s.wrong, null);
  assert.equal(s.done, true);
});

test("Backspace clears the wrong key and nothing else, and is never a keystroke", () => {
  const s = type(freeze(startLine("fjd")), "fk");
  const b = backspace(s);
  assert.equal(b.wrong, null);
  assert.equal(b.typed, 1);
  assert.equal(b.keystrokes, s.keystrokes);
  const clean = type(freeze(startLine("fjd")), "f");
  assert.equal(backspace(clean), clean, "no wrong key: the same state");
  assert.equal(typeKey(clean, "Backspace", 5000), clean, "never a key");
});

test("a space is a real key and counts like any other", () => {
  let s = type(freeze(startLine("f j")), "f ");
  assert.equal(s.typed, 2);
  assert.deepEqual(s.keystrokes.at(-1), { t: 200, expected: " ", typed: " ", ok: true });
  s = type(s, " "); // a space where "j" is expected is a miss
  assert.equal(s.wrong, " ");
  assert.equal(s.keystrokes.at(-1).ok, false);
});

test("time counts only the gaps between keys, each at most 5 seconds", () => {
  let s = freeze(startLine("abcd"));
  s = freeze(typeKey(s, "a", 10_000)); // the first key starts the clock: no time yet
  assert.equal(s.activeMs, 0);
  s = freeze(typeKey(s, "b", 10_300));
  assert.equal(s.activeMs, 300);
  s = freeze(typeKey(s, "c", 60_000)); // walked away for almost a minute
  assert.equal(s.activeMs, 300 + GAP_CAP_MS);
  s = freeze(typeKey(s, "d", 59_000)); // a clock that went back counts nothing
  assert.equal(s.activeMs, 300 + GAP_CAP_MS);
  assert.equal(GAP_CAP_MS, 5000);
});

test("paused time never counts: the next key after a pause adds nothing", () => {
  let s = type(freeze(startLine("abc")), "a");
  const before = s.activeMs;
  s = freeze(pauseLine(s));
  assert.equal(s.lastAt, null);
  assert.equal(pauseLine(s), s, "pausing twice: the same state");
  s = freeze(typeKey(s, "b", 1_000_000));
  assert.equal(s.activeMs, before);
});

test("keystrokes and time carry from line to line", () => {
  const one = type(freeze(startLine("ab")), "ab");
  const two = type(freeze(startLine("cd", one)), "cd");
  assert.equal(two.keystrokes.length, 4);
  assert.equal(two.activeMs, one.activeMs + 400);
  assert.equal(two.keystrokes[2].t, 400);
});

test("any keys: typed never passes the line, misses are counted, accuracy stays in range", () => {
  fc.assert(
    fc.property(fc.array(fc.constantFrom(..."fjdk "), { maxLength: 60 }), (keys) => {
      let s = freeze(startLine("fj dk"));
      let at = 0;
      for (const k of keys) {
        at += 100;
        s = freeze(k === " " && s.wrong ? backspace(s) : typeKey(s, k, at));
      }
      assert.ok(s.typed >= 0 && s.typed <= 5);
      assert.equal(s.keystrokes.filter((k) => k.ok).length, s.typed);
      assert.equal(s.done, s.typed === 5);
      for (const k of s.keystrokes) assert.equal(k.ok, k.typed === k.expected);
    }),
  );
});

test("bad input is a programmer error", () => {
  assert.throws(() => startLine(""), TypeError);
  assert.throws(() => typeKey(startLine("a"), "a", Number.NaN), RangeError);
});
