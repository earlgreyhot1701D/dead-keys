// The model's answer, checked before anything leaves the route (ai-drills Req 2.5): a normal end
// only; then lines, trimmed, empty ones dropped, at most 8, validated as a DrillResponse against
// the pack charset plus space. One bad character rejects the whole answer. Treated as untrusted
// data, never as instructions.
import { validate } from "../../contract/validate.js";

/** The only stop reason that means the answer is complete (not cut off, not filtered). */
export const NORMAL_END = "end_turn";
export const MAX_LINES = 8;

/**
 * @param {{ text: string, stopReason: string|null }} answer From bedrock.js.
 * @param {string} charset The pack charset; a space is added for the gaps between words.
 * @returns {{ ok: true, lines: string[] } | { ok: false, code: "stop"|"empty"|"invalid" }}
 */
export function checkAnswer(answer, charset) {
  if (answer?.stopReason !== NORMAL_END) return { ok: false, code: "stop" };
  const lines = String(answer.text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, MAX_LINES);
  if (lines.length === 0) return { ok: false, code: "empty" };
  const r = validate("DrillResponse", { lines, source: "ai" }, { charset: `${charset} ` });
  return r.status === "valid" ? { ok: true, lines } : { ok: false, code: "invalid" };
}
