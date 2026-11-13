// The results header's mode line, and what Play again starts (split from results.js at the line
// cap). A drill adds its badge under the mode line, built-in or AI (drills Req 4.2, ai-drills
// Req 4.1), as the mock draws it, and Play again starts a drill again: a built-in one with fresh
// weights, or an AI one on the same AI words with no new request (ai-drills Req 3.5; the words
// stay in play.js's round items). Other rounds draw exactly as before.
import { AI, drillBadge, isDrill } from "../components/drillLabel.js";
import { el } from "../dom.js";
import { roundItems } from "./play.js";

/** The pack part: an AI drill names the AI's words, Play these keys the lesson's, else the pack. */
const packLabel = (r) => {
  if (r.drillSource === AI) return "PACK: AI WORDS"; // ai-drills copy table, decision 6
  return roundItems() && !isDrill(r) ? "PACK: YOUR KEYS" : "PACK: GENERAL";
};

/** "MODE: PRACTICE // PACK: GENERAL", with the drill badge under it for a drill. */
export function modeBlock(r) {
  const line = el("p", { class: "rs-mode" }, `MODE: ${r.mode.toUpperCase()} // ${packLabel(r)}`);
  if (!isDrill(r)) return line;
  const badge = drillBadge(el, "rs-drill", r.drillSource === AI ? AI : undefined);
  return el("div", { class: "rs-mode-col" }, [line, badge]);
}

/** The round kind Play again starts: a drill again for a drill, else the same mode. */
export const againKind = (r) => (isDrill(r) ? "drill" : r.mode);
