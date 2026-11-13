// The menu's Daily drill panel (daily Req 3): the mock's head (title, TODAY, the 2-minute limit),
// today's best from saved rounds only, the same-words line, and Start opening the daily drill.
import assert from "node:assert/strict";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { bestLine, DAILY_COPY, dailyPanel } from "./menuDaily.js";

const NOW = new Date(2026, 10, 13, 12);
const draw = (rounds) =>
  withFakeDocument(() => {
    const went = [];
    const node = dailyPanel({ go: (id) => went.push(id) }, { rounds }, NOW);
    return { node, went, text: textOf(node) };
  });

test("the head: DAILY DRILL, TODAY and LIMIT: 02:00; the section is named by its title", () => {
  const { node, text } = draw([]);
  assert.ok(text.startsWith("DAILY DRILLTODAYLIMIT: 02:00"));
  assert.equal(node.attrs["aria-labelledby"], "daily-title");
  assert.ok(text.includes(DAILY_COPY.same));
});

test("no daily round today: the ready line; one today: today's best, rounded", () => {
  assert.ok(draw(undefined).text.includes(DAILY_COPY.ready));
  const yesterday = { mode: "daily", date: new Date(2026, 10, 12, 20).getTime(), wpm: 60 };
  assert.ok(draw([yesterday]).text.includes(DAILY_COPY.ready));
  const today = { mode: "daily", date: new Date(2026, 10, 13, 9).getTime(), wpm: 36.6 };
  assert.ok(draw([yesterday, today]).text.includes(bestLine(37)));
});

test("Start says Start, is named for the daily drill, and opens it", () => {
  const { node, went } = draw([]);
  const [b] = findAll(node, (n) => n.tag === "button");
  assert.equal(textOf(b), "Start daily drill"); // visible "Start" plus screen-reader words
  b.click();
  assert.deepEqual(went, ["daily"]);
});

test("the ghost icon stays decorative until the ghost race (Block 13)", () => {
  const { node, text } = draw([]);
  const box = findAll(node, (n) => n.attrs?.class === "ghost-box")[0];
  assert.equal(box.attrs["aria-hidden"], "true");
  assert.ok(!/ghost/i.test(text));
});

test("with a daily ghost: race it, with its pace (ghost Req 4)", () => {
  const ghosts = [{ mode: "daily", packId: "general", wpm: 36.2, keystrokes: [] }];
  const t = withFakeDocument(() => textOf(dailyPanel({ go() {} }, { rounds: [], ghosts }, NOW)));
  assert.ok(t.includes("Race your ghost: 36 WPM"));
  assert.ok(t.includes("TARGET PACE: 181 CPM // SAME WORDS FOR EVERYONE TODAY"));
});
