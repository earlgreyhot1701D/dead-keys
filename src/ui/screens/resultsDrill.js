// The results header's mode line, and what Play again starts (split from results.js at the line
// cap). A drill adds its badge under the mode line, built-in or AI (drills Req 4.2, ai-drills
// Req 4.1), as the mock draws it, and Play again starts a drill again: a built-in one with fresh
// weights, or an AI one on the same AI words with no new request (ai-drills Req 3.5; the words
// stay in play.js's round items). Other rounds draw exactly as before.

import { GHOST_COPY, raceLine } from "../../ghost/ghost.js";
import { AI, drillBadge, isDrill } from "../components/drillLabel.js";
import { el } from "../dom.js";
import { roundItems } from "./play.js";

/** The pack part: an AI drill names the AI's words, Play these keys the lesson's, else the pack. */
const packLabel = (r) => {
  if (r.drillSource === AI) return "PACK: AI WORDS"; // ai-drills copy table, decision 6
  if (r.packId === "specwave") return "PACK: SPEC WAVE"; // specwave copy table
  if (r.packId === "spanish") return "PACK: ESPAÑOL"; // spanish copy table
  return roundItems() && !isDrill(r) ? "PACK: YOUR KEYS" : "PACK: GENERAL";
};

/** The ghost line under the mode line (ghost Req 3): the race, a new ghost, or nothing. */
export function ghostLine(r, ghost) {
  if (!ghost || roundItems()) return null; // Play these keys never raced or saved a ghost
  const raced = ghost.raced === null ? null : raceLine(Math.round(r.wpm), Math.round(ghost.raced));
  const line = [raced, ghost.saved ? GHOST_COPY.saved : null].filter(Boolean).join(" ");
  return line ? el("p", { class: "rs-ghost" }, line) : null;
}

/** "MODE: PRACTICE // PACK: GENERAL", the drill badge under it for a drill, then the ghost line. */
export function modeBlock(r, outcome = {}) {
  const line = el("p", { class: "rs-mode" }, `MODE: ${r.mode.toUpperCase()} // ${packLabel(r)}`);
  const badge = isDrill(r)
    ? drillBadge(el, "rs-drill", r.drillSource === AI ? AI : undefined)
    : null;
  const ghost = ghostLine(r, outcome.ghost);
  if (!badge && !ghost) return line;
  return el("div", { class: "rs-mode-col" }, [line, badge, ghost]);
}

/** The round kind Play again starts: a drill again for a drill, else the same mode. */
export const againKind = (r) => (isDrill(r) ? "drill" : r.mode);
