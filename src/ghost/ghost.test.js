// The ghost race's rules (ghost Reqs 1 and 2): which modes have a ghost, one ghost per mode and
// pack, the ghost's progress at any moment, your lead, and the words the race shows.
import assert from "node:assert/strict";
import { test } from "node:test";
import fc from "fast-check";
import { validate } from "../../contract/validate.js";
import {
  findGhost,
  GHOST_MAX_KEYS,
  ghostChars,
  ghostFrom,
  lead,
  leadText,
  paceText,
  prepareGhost,
  raceIt,
  raceLine,
  saveGhost,
} from "./ghost.js";

const k = (t, ok = true) => ({ t, expected: "a", typed: ok ? "a" : "s", ok });
const result = (mode = "falling", wpm = 36) => ({ mode, packId: "general", wpm });

test("only the two games and the daily drill have a ghost; it matches the contract", () => {
  for (const mode of ["practice", "lesson", "testout", "specwave"])
    assert.equal(ghostFrom(result(mode), [k(1)]), null, mode);
  assert.equal(ghostFrom(result(), null), null);
  for (const mode of ["falling", "corners", "daily"]) {
    const g = ghostFrom(result(mode), [k(10), k(20, false)]);
    assert.equal(validate("GhostRun", g).status, "valid", mode);
  }
});

test("a ghost keeps at most the contract's 2,000 keystrokes, and only the four fields", () => {
  const many = Array.from({ length: 2500 }, (_, i) => ({ ...k(i), extra: 1 }));
  const g = ghostFrom(result(), many);
  assert.equal(g.keystrokes.length, GHOST_MAX_KEYS);
  assert.deepEqual(Object.keys(g.keystrokes[0]), ["t", "expected", "typed", "ok"]);
});

test("one ghost per mode and pack: a new one replaces the old, others stay", () => {
  let p = { ghosts: [] };
  p = saveGhost(p, ghostFrom(result("falling", 30), [k(1)]));
  p = saveGhost(p, ghostFrom(result("daily", 25), [k(1)]));
  p = saveGhost(p, ghostFrom(result("falling", 41), [k(1)]));
  assert.equal(p.ghosts.length, 2);
  assert.equal(findGhost(p, "falling", "general").wpm, 41);
  assert.equal(findGhost(p, "corners", "general"), null);
  assert.equal(findGhost(undefined, "falling", "general"), null);
});

test("ghostChars counts right letters up to a moment; a miss never counts", () => {
  const g = prepareGhost({ wpm: 30, keystrokes: [k(100), k(200, false), k(300), k(300), k(900)] });
  assert.deepEqual(
    [0, 99, 100, 250, 300, 899, 900, 5000].map((ms) => ghostChars(g, ms)),
    [0, 0, 1, 1, 3, 3, 4, 4],
  );
  assert.equal(ghostChars({ keystrokes: [k(5)] }, 5), 1); // works unprepared too
});

test("property: ghostChars never goes down as time goes on, and never passes the right letters", () => {
  fc.assert(
    fc.property(fc.array(fc.tuple(fc.nat(10_000), fc.boolean()), { maxLength: 80 }), (raw) => {
      const keys = raw.map(([t, ok]) => k(t, ok)).sort((a, b) => a.t - b.t);
      const g = prepareGhost({ wpm: 1, keystrokes: keys });
      let last = 0;
      for (let ms = 0; ms <= 10_000; ms += 500) {
        const n = ghostChars(g, ms);
        assert.ok(n >= last);
        last = n;
      }
      assert.equal(last, keys.filter((x) => x.ok).length);
    }),
  );
});

test("your lead: your right letters minus the ghost's at the same moment", () => {
  const g = prepareGhost({ wpm: 30, keystrokes: [k(100), k(200), k(300)] });
  assert.equal(lead(g, { activeMs: 250, keystrokes: [k(50), k(60), k(70), k(80, false)] }), 1);
  assert.equal(lead(g, { activeMs: 300, keystrokes: [k(50)] }), -2);
  assert.deepEqual([leadText(12), leadText(-5), leadText(0)], ["+12 AHEAD", "5 BEHIND", "LEVEL"]);
});

test("the race's words: results line, menu line, pace in CPM", () => {
  assert.equal(raceLine(41, 36), "You beat your ghost: 41 WPM to 36.");
  assert.equal(raceLine(36, 36), "You tied your ghost at 36 WPM.");
  assert.equal(raceLine(33, 36), "Your ghost was faster: 36 WPM to your 33.");
  assert.equal(raceIt(35.6), "Race your ghost: 36 WPM");
  assert.equal(paceText(36), "TARGET PACE: 180 CPM");
});
