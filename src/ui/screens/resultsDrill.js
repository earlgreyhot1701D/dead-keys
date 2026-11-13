// The results header's mode line, and what Play again starts (split from results.js at the line
// cap). A built-in drill adds its badge under the mode line (drills Req 4.2), as the mock draws
// it, and Play again starts a new drill (Req 3.5). Other rounds draw exactly as before.
import { drillBadge, isDrill } from "../components/drillLabel.js";
import { el } from "../dom.js";
import { roundItems } from "./play.js";

/** The pack part: a Play these keys round names the lesson's words, not the pack. */
const packLabel = () => (roundItems() ? "PACK: YOUR KEYS" : "PACK: GENERAL");

/** "MODE: PRACTICE // PACK: GENERAL", with the drill badge under it for a drill. */
export function modeBlock(r) {
  const line = el("p", { class: "rs-mode" }, `MODE: ${r.mode.toUpperCase()} // ${packLabel()}`);
  if (!isDrill(r)) return line;
  return el("div", { class: "rs-mode-col" }, [line, drillBadge(el, "rs-drill")]);
}

/** The round kind Play again starts: a drill again for a drill, else the same mode. */
export const againKind = (r) => (isDrill(r) ? "drill" : r.mode);
