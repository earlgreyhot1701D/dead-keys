// Random play across the whole API (split from lifecycle.test.js at the line cap): any mix of
// keys, Escape, time, resume, continue and end keeps every rule and never mutates a state.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { LIVES_MAX, SLOTS, TARGETS_MAX, TARGETS_START } from "./config.js";
import { endRound, resolveOutOfLives, resume, tick } from "./lifecycle.js";
import { createRound, key, pressEscape } from "./round.js";

const items = [
  { id: "i1", text: "ab" },
  { id: "i2", text: "cd" },
  { id: "i3", text: "ef" },
  { id: "i4", text: "Ag" },
];
const opts = (over = {}) => ({
  mode: "falling",
  mechanic: "falling",
  items,
  seed: 7,
  speed: 1,
  ...over,
});

/** Freeze deep, so any mutation by the engine throws (ES modules run in strict mode). */
function freeze(o) {
  for (const v of Object.values(o)) if (v && typeof v === "object") freeze(v);
  return Object.freeze(o);
}

const op = fc.oneof(
  { weight: 6, arbitrary: fc.constantFrom(..."abcdefgA;z").map((c) => ["key", c]) },
  { weight: 1, arbitrary: fc.constant(["key", "Backspace"]) },
  { weight: 2, arbitrary: fc.constant(["esc"]) },
  { weight: 1, arbitrary: fc.constant(["resume"]) },
  { weight: 5, arbitrary: fc.integer({ min: 0, max: 9000 }).map((n) => ["tick", n]) },
  { weight: 1, arbitrary: fc.boolean().map((b) => ["cont", b]) },
  { weight: 1, arbitrary: fc.constant(["end"]) },
);

function apply(s, [name, arg]) {
  if (name === "key") return key(s, arg);
  if (name === "esc") return pressEscape(s);
  if (name === "resume") return resume(s);
  if (name === "tick") return tick(s, arg);
  if (name === "cont") return resolveOutOfLives(s, arg);
  return endRound(s);
}

const mode = fc.constantFrom("falling", "corners", "practice", "lesson");

test("random play keeps every rule: lives, caps, hold, continue, end, and never mutates", () => {
  fc.assert(
    fc.property(fc.integer(), mode, fc.array(op, { maxLength: 80 }), (seed, m, ops) => {
      let s = freeze(
        createRound(opts({ seed, mode: m, mechanic: m === "corners" ? "corners" : "falling" }))
          .state,
      );
      for (const o of ops) {
        const prev = s;
        const r = apply(prev, o);
        s = freeze(r.state);
        const cap = Math.min(TARGETS_START + s.wave - 1, TARGETS_MAX, SLOTS[s.mechanic]);
        assert.ok(s.lives >= 0 && s.lives <= LIVES_MAX);
        assert.ok(s.targets.length <= cap);
        assert.ok(s.lockId === null || s.targets.some((t) => t.id === s.lockId));
        assert.ok(s.activeMs >= prev.activeMs);
        assert.ok(s.cleared >= prev.cleared);
        assert.ok(!prev.continueUsed || s.continueUsed);
        assert.ok(!prev.ended || s.ended);
        if (s.held) assert.ok(s.lives === 0 && !s.continueUsed && !s.ended);
        if (s.mode === "practice") assert.ok(s.lives === LIVES_MAX && !s.held);
        if (prev.ended) assert.equal(s, prev);
        if (r.events.length === 0 && o[0] !== "tick") {
          // A swallowed key (the landed word's leftover letter, lostTail.js) may only clear or
          // shorten lostTail; everything else stays the same (Kiro's finding, Nov 13).
          const { lostTail: was, ...prevRest } = prev;
          const { lostTail: now, ...rest } = s;
          assert.deepEqual(rest, prevRest);
          const same = JSON.stringify(now ?? null) === JSON.stringify(was ?? null);
          if (!same && now) assert.ok(was && now.text.length < was.text.length);
          if (!same && now) assert.ok(was.text.endsWith(now.text));
        }
      }
    }),
  );
});

test("the same inputs give the same state and events", () => {
  fc.assert(
    fc.property(fc.integer(), fc.array(op, { maxLength: 60 }), (seed, ops) => {
      const run = () => {
        let s = createRound(opts({ seed })).state;
        const all = [];
        for (const o of ops) {
          const r = apply(s, o);
          s = r.state;
          all.push(r.events);
        }
        return { s, all };
      };
      assert.deepEqual(run(), run());
    }),
  );
});
