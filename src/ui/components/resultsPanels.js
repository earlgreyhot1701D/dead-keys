// The results screen's panels (play Req 7.2, 7.3, 7.5; mock screen 5 through the map): the four
// stat tiles with their plain explanations, milestones and the round breakdown (accuracy and the
// word log are in results.js). Every number is the round's own; every word is the copy table's
// or the mock's.
import { timeText } from "../../render/hud.js";
import { el } from "../dom.js";
import { panelHead } from "./chrome.js";
import { drillRow, isDrill } from "./drillLabel.js";

/** Approved wording (play copy table). */
export const STAT_EXPLAIN = Object.freeze({
  wpm: "Words per minute. Every 5 correct letters count as 1 word.",
  accuracy: "Keys you got right, out of every key you pressed.",
  cleared: "Words you finished.",
  time: "Time played. Pauses don't count.",
});
export const BREAKDOWN_EXPLAIN = Object.freeze({
  keystrokes: "every key you pressed",
  correct: "keys that matched",
  missed: "the keys you missed most",
  breaches: "words that reached your station",
  breachesCorners: "words that reached the core",
});
export const NO_RECORDS = "No new records this round.";
export const CONTINUE_USED = "Free continue used this round.";
/** "+4 WPM over your last falling round". */
export const fasterLine = (n, mode) => `+${n} WPM over your last ${mode} round`;
/** "New best: 38 WPM. Your old best was 35." (first best: "New best: 38 WPM.") */
export const newBestLine = (n, old) =>
  old === null ? `New best: ${n} WPM.` : `New best: ${n} WPM. Your old best was ${old}.`;

const two = (n) => String(n).padStart(2, "0");
const pct = (a) => Math.round(a * 100);

/** How much faster than the last round in this mode, in whole WPM; 0 when not faster. */
export function fasterBy(result, previous) {
  if (!previous) return 0;
  return Math.max(0, Math.round(result.wpm) - Math.round(previous.wpm));
}

/** "16 [TOP: a, q]": every wrong key press, and the two keys missed most. */
export function missedText(result) {
  const missed = result.totalKeystrokes - result.correctChars;
  const top = Object.entries(result.keyDeltas)
    .filter(([, d]) => d.misses > 0)
    .sort(([a, x], [b, y]) => y.misses - x.misses || (a < b ? -1 : 1))
    .slice(0, 2)
    .map(([k]) => k);
  return top.length ? `${missed} [TOP: ${top.join(", ")}]` : String(missed);
}

function tile(n, label, value, explain, extra = null) {
  return el("section", { class: "rs-tile", "aria-label": label }, [
    el("span", { class: "rs-tile-head" }, [
      el("span", {}, `[ STAT_0${n} ]`),
      el("span", { class: "rs-tile-label" }, label),
    ]),
    el("span", { class: "rs-tile-value" }, [value, extra]),
    el("p", { class: "rs-explain" }, explain),
  ]);
}

/** The four stat tiles; the "+n WPM" pill only when faster than the last round in this mode. */
export function statTiles({ result, outcome }) {
  const faster = fasterBy(result, outcome.previous);
  const acc = el("span", {}, [String(pct(result.accuracy)), el("span", { class: "rs-unit" }, "%")]);
  return el("div", { class: "rs-tiles" }, [
    tile(
      1,
      "WPM",
      String(Math.round(result.wpm)),
      STAT_EXPLAIN.wpm,
      faster > 0 ? el("span", { class: "pill rs-faster" }, fasterLine(faster, result.mode)) : null,
    ),
    tile(2, "ACCURACY", acc, STAT_EXPLAIN.accuracy),
    tile(3, "CLEARED", String(result.cleared), STAT_EXPLAIN.cleared),
    tile(4, "TIME", timeText(result.durationMs), STAT_EXPLAIN.time),
  ]);
}

/** New best, new milestones, or "No new records this round."; the free continue when used. */
/** Only the highest WPM band when one round earns several at once (Block 8a, Req 10.2). */
export function topBandOnly(milestones) {
  const top = Math.max(
    0,
    ...milestones.filter((m) => m.kind === "wpm-band").map((m) => m.threshold),
  );
  return milestones.filter((m) => m.kind !== "wpm-band" || m.threshold === top);
}

export function milestonesPanel({ result, outcome }) {
  const { newBest, saved } = outcome;
  const milestones = topBandOnly(outcome.milestones);
  const rows = [];
  if (newBest) {
    rows.push(
      el("p", { class: "rs-record" }, [
        el("span", { class: "rs-chip" }, "[ RECORD ]"),
        el(
          "span",
          {},
          newBestLine(
            Math.round(newBest.wpm),
            newBest.old === null ? null : Math.round(newBest.old),
          ),
        ),
      ]),
    );
  }
  for (const m of milestones) {
    rows.push(
      el("p", { class: "rs-milestone" }, [
        el("span", { class: "rs-star", "aria-hidden": "true" }, "[★]"),
        el("span", {}, `MILESTONE: ${m.label}`),
      ]),
    );
  }
  if (!rows.length) rows.push(el("p", { class: "rs-none" }, NO_RECORDS));
  if (result.continued) rows.push(el("p", { class: "rs-none" }, CONTINUE_USED));
  // tabindex: when the list is longer than the panel, the keyboard can scroll it too.
  return el("section", { class: "rs-panel rs-ms", "aria-labelledby": "rs-ms", tabindex: "0" }, [
    panelHead(
      el("h2", { id: "rs-ms", class: "rs-panel-title" }, "[═] MILESTONES // THIS ROUND"),
      el("span", { class: "rs-saved" }, saved ? "SAVED: THIS BROWSER" : "NOT SAVING"),
    ),
    ...rows,
  ]);
}

const row = (label, explain, value, cls = "") =>
  el("p", { class: "rs-row" }, [
    el("span", { class: "rs-row-label" }, [label, el("small", {}, ` ${explain}`)]),
    el("span", { class: `rs-row-value ${cls}`.trim() }, value),
  ]);

/** Keystrokes, correct characters, missed keys and breaches, each with its plain explanation. */
export function breakdownPanel({ result, log }) {
  const breach = result.mode === "corners" ? "breachesCorners" : "breaches";
  return el("section", { class: "rs-panel", "aria-labelledby": "rs-bd" }, [
    el("h2", { id: "rs-bd", class: "rs-bar-title" }, "ROUND BREAKDOWN"),
    row("KEYSTROKES", BREAKDOWN_EXPLAIN.keystrokes, String(result.totalKeystrokes)),
    row("CORRECT CHARACTERS", BREAKDOWN_EXPLAIN.correct, String(result.correctChars)),
    row("MISSED KEYS", BREAKDOWN_EXPLAIN.missed, missedText(result), "is-missed"),
    row("TARGET BREACHES", BREAKDOWN_EXPLAIN[breach], two(log.breaches), "is-accent"),
    isDrill(result) ? drillRow(el) : null, // drills Req 4.2: last row, drill rounds only
  ]);
}
