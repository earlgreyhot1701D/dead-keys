// The main menu's right column (locked mock, screen 2): recommended lesson and daily drill as
// "Not built yet" panels (Blocks 8 and 12), best speed and current streak from saved data, and a
// status line read from settings. Nothing here is made up: no "this week" or "best streak", which
// are not stored.
import { el } from "../dom.js";
import { ghostIcon, notBuiltPanel } from "./chrome.js";
import { modeName, NO_BESTS_LINE, setOn } from "./progressText.js";

/** The player's local day, "YYYY-MM-DD". */
export const dayOf = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * The streak still running today: the saved count if the last round was today or yesterday,
 * otherwise 0 (the streak has lapsed, even if the save still holds the old count).
 * @param {{ lastDay: string|null, count: number } | undefined} streak
 * @param {Date} now
 */
export function currentStreak(streak, now) {
  if (!streak?.lastDay || !Number.isInteger(streak.count)) return 0;
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return [dayOf(now), dayOf(yesterday)].includes(streak.lastDay) ? streak.count : 0;
}

/**
 * The fastest personal best across modes, or null.
 * @param {Record<string, { wpm: number, date: number }>} bests
 */
export function bestSpeed(bests) {
  let top = null;
  for (const [mode, b] of Object.entries(bests ?? {})) {
    if (Number.isFinite(b?.wpm) && (!top || b.wpm > top.wpm)) top = { mode, ...b };
  }
  return top;
}

const tile = (label, value, unit, foot) =>
  el("div", { class: "menu-stat" }, [
    el("span", { class: "menu-stat-label" }, label),
    el("span", { class: "menu-stat-value" }, [
      el("span", { class: "menu-stat-num" }, value),
      unit ? el("span", { class: "menu-stat-unit" }, unit) : null,
    ]),
    foot ? el("span", { class: "menu-stat-foot" }, foot) : null,
  ]);

const onOff = (v) => (v ? "ON" : "OFF");

/** @param {object} ctx The router's ctx. */
export function renderMenuSide(ctx, now = new Date()) {
  const p = ctx.state?.progress ?? {};
  const s = ctx.state?.settings ?? {};
  const best = bestSpeed(p.bests);
  const name = best && modeName(best.mode);
  const streak = currentStreak(p.dayStreak, now);
  return el("section", { class: "menu-side", "aria-label": "At a glance" }, [
    notBuiltPanel("Recommended next lesson"),
    notBuiltPanel(
      "Daily drill",
      el("span", { class: "ghost-box", "aria-hidden": "true" }, ghostIcon(26, 28)),
    ),
    el("div", { class: "menu-stats" }, [
      best
        ? tile(
            "Best speed",
            String(best.wpm),
            "WPM",
            [name, setOn(best.date)].filter(Boolean).join(", "),
          )
        : tile("Best speed", "--", "WPM", NO_BESTS_LINE),
      tile("Current streak", String(streak), streak === 1 ? "DAY" : "DAYS", null),
    ]),
    el("div", { class: "menu-status" }, [
      el("span", {}, [
        el("span", { class: "prompt", "aria-hidden": "true" }, ">_ "),
        `LAYOUT: QWERTY // AI DRILLS: ${onOff(s.ai)} // FINGER COLORS: ${onOff(s.fingerColors)}`,
      ]),
      el("span", { class: "mem" }, "MEM_ADDR: 0x84FF_DEAD"),
    ]),
  ]);
}
