// The main menu's right column (locked mock, screen 2): the recommended lesson (lessons Req 8.3),
// daily drill as a "Not built yet" panel (Block 12), best speed and current streak from saved
// data, and a status line read from settings. Nothing here is made up: no "this week" or "best
// streak", which are not stored.
import { COACH, MENU } from "../../lessons/copy.js";
import { lessonById } from "../../lessons/ladder.js";
import { recommend, whyLine } from "../../lessons/recommend.js";
import { el } from "../dom.js";
import { ghostIcon, notBuiltPanel, panelHead } from "./chrome.js";
import { modeName, NO_BESTS_LINE, setOn } from "./progressText.js";

const REC = "Recommended next lesson";
export const ALL_PASSED = Object.freeze({
  title: "All letter lessons passed.",
  line: "Capitals, punctuation and numbers are next.",
});

/**
 * The recommended lesson panel, information only (design decision 8; the map for screen 2).
 * @param {{ lessonsPassed?: object[], rounds?: object[], keys?: object[] }} p Saved progress.
 */
export function lessonPanel(p) {
  const rec = recommend({ lessonsPassed: [], rounds: [], keys: [], ...p });
  const l = rec && lessonById(rec.lessonId);
  const title = (t) => el("h2", { class: "rec-title" }, t);
  const body = !l
    ? [title(ALL_PASSED.title), el("p", { class: "rec-line" }, ALL_PASSED.line)]
    : [
        el("div", { class: "rec-row" }, [
          title(`Lesson ${l.n}: ${l.name}`),
          el(
            "span",
            { class: "rec-caps" },
            l.keys.filter((k) => /^[a-z]$/.test(k)).map((k) => el("span", {}, k.toUpperCase())),
          ),
        ]),
        // Lesson 0 has no New keys part: its card line (the first card part) stands in.
        el("p", { class: "rec-line" }, l.n === 0 ? MENU.parts0[0].join("") : COACH.new[l.id]),
        el("p", { class: "rec-foot" }, [
          el("span", {}, whyLine(rec.why)),
          l.n === 0 ? null : el("span", {}, "[TEST OUT] 95% to skip"),
        ]),
      ];
  return el("section", { class: "term-panel rec-panel", "aria-label": REC }, [
    panelHead(el("span", { class: "panel-title" }, REC), l ? el("span", {}, `[${l.id}]`) : null),
    ...body,
  ]);
}

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
    lessonPanel(p),
    notBuiltPanel(
      "Daily drill",
      el("span", { class: "ghost-box", "aria-hidden": "true" }, ghostIcon(26, 28)),
    ),
    el("div", { class: "menu-stats" }, [
      best
        ? tile(
            "Best speed",
            String(Math.round(best.wpm)),
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
