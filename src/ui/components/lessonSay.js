// Job: what the live region says as a lesson moves on (lessons Req 7.5; lessons-8b Req 9.6).
// The first line of a part says the part and its coach line first, once. The lesson's very
// first line waits a moment, so it is heard after the screen's heading, not before.
import { coachFor, SAY, STEP_NAMES } from "../../lessons/copy.js";

/**
 * @param {string} id
 * @param {"lesson"|"testout"} kind
 * @param {(f: () => void, ms: number) => unknown} [later]
 * @returns {(announce: (s: string) => void, part: number, partName: string, lineNo: number,
 *   lines: string[]) => void}
 */
export function createSay(id, kind, later = globalThis.setTimeout) {
  const names = STEP_NAMES[kind === "testout" ? "testout" : id === "L00" ? "lesson0" : "lesson"];
  let said = false;
  return (announce, part, partName, lineNo, lines) => {
    const coach = coachFor(id, partName);
    const intro = lineNo === 1 ? [names[part], coach].filter(Boolean).join(". ") : "";
    const text = `${intro ? `${intro} ` : ""}${SAY.line(lineNo, lines.length, lines[lineNo - 1])}`;
    if (said || !later) announce(text);
    else later(() => announce(text), 50);
    said = true;
  };
}
