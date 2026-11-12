// The menu's right column: best speed and the streak still running, from saved data only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { bestSpeed, currentStreak, dayOf, renderMenuSide } from "./menuSide.js";

const NOW = new Date(2026, 10, 12, 9, 30); // Nov 12 2026, local

test("the streak counts only while it is still running (last round today or yesterday)", () => {
  assert.equal(currentStreak({ lastDay: "2026-11-12", count: 5 }, NOW), 5);
  assert.equal(currentStreak({ lastDay: "2026-11-11", count: 5 }, NOW), 5);
  assert.equal(currentStreak({ lastDay: "2026-11-10", count: 5 }, NOW), 0); // lapsed
  assert.equal(currentStreak({ lastDay: null, count: 0 }, NOW), 0);
  assert.equal(currentStreak(undefined, NOW), 0);
  // across a month and a year
  assert.equal(currentStreak({ lastDay: "2026-12-31", count: 2 }, new Date(2027, 0, 1)), 2);
  assert.equal(dayOf(new Date(2026, 0, 5)), "2026-01-05");
});

test("best speed is the fastest best across modes, or nothing", () => {
  assert.equal(bestSpeed({}), null);
  assert.equal(bestSpeed(undefined), null);
  assert.deepEqual(bestSpeed({ corners: { wpm: 30, date: 1 }, falling: { wpm: 41, date: 2 } }), {
    mode: "falling",
    wpm: 41,
    date: 2,
  });
});

test("the tiles and status line say what is saved", () => {
  withFakeDocument(() => {
    const state = {
      progress: {
        bests: { corners: { wpm: 38, date: new Date(2026, 10, 11).getTime() } },
        dayStreak: { lastDay: "2026-11-12", count: 1 },
      },
      settings: { ai: false, fingerColors: true },
    };
    const text = textOf(renderMenuSide({ state }, NOW));
    assert.match(text, /Best speed38WPMFour corners, set Nov 11/);
    assert.match(text, /Current streak1DAY/);
    assert.match(text, /AI DRILLS: OFF \/\/ FINGER COLORS: ON/);
  });
});

test("no saved data: dashes and the approved no-bests line, a zero streak", () => {
  withFakeDocument(() => {
    const node = renderMenuSide({ state: { progress: {}, settings: {} } }, NOW);
    const text = textOf(node);
    assert.match(text, /Best speed--WPMNo personal bests yet\. Play a round to set one\./);
    assert.match(text, /Current streak0DAYS/);
    assert.equal(findAll(node, (n) => n.tag === "button").length, 0);
  });
});
