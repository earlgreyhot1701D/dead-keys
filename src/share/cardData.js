// Job: what the share card says (share Req 1; Shara approved the mock Nov 13). Pure: the round's
// result, its milestones and the saved progress in; the card's words and numbers out. Nothing
// personal goes on the card: no name, no keys, no typing.

import { isDrill } from "../ui/components/drillLabel.js";
import { bestSpeed, currentStreak } from "../ui/components/menuSide.js";
import { modeName } from "../ui/components/progressText.js";
import { topBandOnly } from "../ui/components/resultsPanels.js";

export const SITE = "dead-keys.vercel.app";
export const TAGLINE = "a typing game, back from the dead";
const MONTHS = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ");

/** "1:12" for a duration in ms. */
export const clock = (ms) => {
  const s = Math.max(0, Math.round((Number(ms) || 0) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** "NOV 13 2026" for a time in ms, local. */
export const dayLine = (ms) => {
  const d = new Date(Number(ms) || 0);
  return `${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
};

/** The mode as the card names it: a drill, Practice, or the mode's own name, uppercase. */
function modeLine(r) {
  if (isDrill(r)) return "DRILL";
  if (r.mode === "practice") return "PRACTICE";
  return modeName(r.mode).toUpperCase();
}

/**
 * @param {{ result: object, outcome: { milestones?: object[] }, progress: object, now?: Date }} o
 * @returns {{ wpm: number, accuracy: number, best: number|null, rounds: number, streak: number,
 *   meta: string, milestone: string|null }}
 */
export function cardData({ result: r, outcome, progress: p = {}, now = new Date() }) {
  const best = bestSpeed(p.bests);
  const parts = [modeLine(r)];
  if (r.mode !== "practice" && Number.isInteger(r.wave))
    parts.push(`WAVE ${String(r.wave).padStart(2, "0")}`);
  parts.push(clock(r.durationMs), dayLine(r.date));
  const ms = topBandOnly(outcome?.milestones ?? [])[0];
  return {
    wpm: Math.round(r.wpm),
    accuracy: Math.round(r.accuracy * 100),
    best: best ? Math.round(best.wpm) : null,
    rounds: (p.rounds ?? []).length,
    streak: currentStreak(p.dayStreak, now),
    meta: parts.join(" · "),
    milestone: ms ? `MILESTONE: ${ms.label.toUpperCase()}` : null,
  };
}

/** The words Copy text puts on the clipboard (copy table). */
export const shareText = (d) =>
  `I typed ${d.wpm} WPM at ${d.accuracy}% accuracy in Dead Keys, ${TAGLINE}. ${SITE}`;

/** The card's text alternative, for screen readers (copy table). */
export const cardAlt = (d) =>
  `Dead Keys round card: ${d.wpm} WPM, ${d.accuracy}% accuracy, ${d.meta.toLowerCase()}.${d.milestone ? ` ${d.milestone.replace("MILESTONE: ", "Milestone: ").toLowerCase()}.` : ""}`;

/** Everything the share window needs, from the round and the saved progress. */
export function sharePieces(o) {
  const data = cardData(o);
  return { data, text: shareText(data), alt: cardAlt(data) };
}
