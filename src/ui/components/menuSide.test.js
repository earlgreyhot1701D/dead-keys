// The menu's right column: best speed and the streak still running, from saved data only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { bestSpeed, currentStreak, dayOf, lessonPanel, renderMenuSide } from "./menuSide.js";

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
    assert.match(
      text,
      /Best speed--WPMNo personal bests yet\. A best needs 90% accuracy or better\./,
    );
    assert.match(text, /Current streak0DAYS/);
    // the daily Start, and "What's this?" for WPM (lessons-8b Req 8)
    assert.deepEqual(
      findAll(node, (n) => n.tag === "button").map((b) => b.attrs["aria-label"] ?? textOf(b)),
      ["Start daily drill", "What's this: WPM"],
    );
  });
});

// The recommended lesson panel (lessons Req 8.3, the map for mock screen 2).
const pass = (lessonId) => ({ lessonId, how: "lesson" });
const panelText = (progress) => withFakeDocument(() => textOf(lessonPanel(progress)));

test("a new player is pointed at Lesson 0, with its card line and no test out", () => {
  const t = panelText({ lessonsPassed: [], rounds: [], keys: [] });
  assert.equal(
    t,
    "Recommended next lesson[L00]Lesson 0: Meet your keyboardFJ" +
      "Your keyboard. Is it this one?[WHY] New to typing? Start here.",
  );
  assert.equal(panelText({}), t); // nothing saved reads the same
});

test("the next lesson in order: tag, title, letter caps, New keys coach line, Why, Test out", () => {
  const t = panelText({ lessonsPassed: ["L00", "L01", "L02"].map(pass), rounds: [{}], keys: [] });
  assert.equal(
    t,
    "Recommended next lesson[L03]Lesson 3: Full home rowGH" +
      "Index fingers reach in: left for G, right for H. Thumbs press Space." +
      "[WHY] Next in order.[TEST OUT] 95% to skip",
  );
  // caps are letters only: Lesson 2's ; and Lesson 6's , . are left out
  const l2 = panelText({ lessonsPassed: ["L00", "L01"].map(pass), rounds: [{}], keys: [] });
  assert.match(l2, /Lesson 2: Home row, right handJKL[A-Z]/);
});

test("weak keys pick the lesson and name the keys", () => {
  const keys = [{ key: "r", attempts: 40, misses: 20, lastSeen: 0 }];
  const t = panelText({ lessonsPassed: [pass("L00")], rounds: [{}], keys });
  assert.match(t, /\[L04\]Lesson 4: Top row, index fingersRTYU/);
  assert.match(t, /\[WHY\] You miss "r" most\./);
});

test("every built lesson passed: the copy-table title and line, no tag", () => {
  const all = Array.from({ length: 14 }, (_, i) => `L${String(i).padStart(2, "0")}`).map(pass);
  withFakeDocument(() => {
    const node = lessonPanel({ lessonsPassed: all, rounds: [{}], keys: [] });
    assert.equal(
      textOf(node),
      "Recommended next lessonAll lessons passed.Keep your keys sharp with the daily drill.",
    );
    assert.equal(findAll(node, (n) => n.tag === "h2").length, 1);
    assert.equal(findAll(node, (n) => n.tag === "button").length, 0); // information only
  });
});

test("the main menu's right column shows the panel, not Not built yet", () => {
  withFakeDocument(() => {
    const t = textOf(renderMenuSide({ state: { progress: {}, settings: {} } }, NOW));
    assert.ok(t.startsWith("Recommended next lesson[L00]"));
    assert.ok(!t.startsWith("Recommended next lessonNot built yet"));
  });
});

test("from Lesson 7 on, the caps show ⇧ and symbols (lessons-8b)", () => {
  const upTo = (n) => Array.from({ length: n }, (_, i) => pass(`L${String(i).padStart(2, "0")}`));
  assert.match(
    panelText({ lessonsPassed: upTo(7), rounds: [{}], keys: [] }),
    /Lesson 7: Capitals⇧/,
  );
  assert.match(
    panelText({ lessonsPassed: upTo(11), rounds: [{}], keys: [] }),
    /Lesson 11: Symbols\$%&\(\)\/@#/,
  );
});
