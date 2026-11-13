// Job: the main menu's Daily drill panel (daily Req 3, ghost Req 4; locked mock, screen 2). Its
// words come from saved data only: your daily ghost and its pace when you have one, else today's
// best daily speed, or a line saying today's words are ready.
import pack from "../../../packs/general.json" with { type: "json" };
import { DAILY_MS, todayBest } from "../../drills/daily.js";
import { findGhost, paceText, raceIt } from "../../ghost/ghost.js";
import { timeText } from "../../render/hud.js";
import { el } from "../dom.js";
import { ghostIcon, panelHead } from "./chrome.js";

/** The panel's words (daily copy table). */
export const DAILY_COPY = Object.freeze({
  title: "Daily drill",
  today: "TODAY",
  same: "SAME WORDS FOR EVERYONE TODAY",
  ready: "Today's words are ready.",
  start: "Start",
});
/** "Today's best: 37 WPM". */
export const bestLine = (wpm) => `Today's best: ${wpm} WPM`;

/**
 * @param {{ go: (id: string) => void }} ctx The router's ctx.
 * @param {{ rounds?: object[] }} p Saved progress.
 * @param {Date} [now]
 */
export function dailyPanel(ctx, p, now = new Date()) {
  const best = todayBest(p.rounds, now);
  const ghost = findGhost(p, "daily", pack.id); // your best daily run, raced in every daily drill
  const line = ghost ? raceIt(ghost.wpm) : best === null ? DAILY_COPY.ready : bestLine(best);
  const small = ghost ? `${paceText(ghost.wpm)} // ${DAILY_COPY.same}` : DAILY_COPY.same;
  return el("section", { class: "term-panel daily-panel", "aria-labelledby": "daily-title" }, [
    panelHead(
      el("span", { class: "daily-name" }, [
        el("span", { id: "daily-title", class: "panel-title" }, DAILY_COPY.title.toUpperCase()),
        el("span", { class: "daily-today" }, DAILY_COPY.today),
      ]),
      el("span", {}, `LIMIT: ${timeText(DAILY_MS).padStart(5, "0")}`),
    ),
    el("div", { class: "daily-row" }, [
      el("span", { class: "ghost-box", "aria-hidden": "true" }, ghostIcon(26, 28)),
      el("div", { class: "daily-text" }, [
        el("span", { class: "daily-line" }, line),
        el("span", { class: "daily-same" }, small),
      ]),
      el(
        "button",
        {
          type: "button",
          class: "btn btn-term btn-primary daily-start",
          "data-focus-id": "daily-start",
          onClick: () => ctx.go("daily"),
        },
        [DAILY_COPY.start, el("span", { class: "sr-only" }, " daily drill")],
      ),
    ]),
  ]);
}
