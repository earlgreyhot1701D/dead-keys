// The dip notice (lessons Req 9.1, PRD G5): shown on the Lesson done card when this is the
// player's second or third lesson round ever and its speed is more than 15% below their first
// lesson round's. Never "you got slower": the card says the dip is normal. Pure.

/** More than this share slower than the first lesson round shows the dip line. */
export const DIP_SHARE = 0.15;
/** Only the second and third lesson rounds ever can show it. */
const DIP_ROUNDS = Object.freeze([2, 3]);

/**
 * @param {import("../../contract/types.js").RoundResult[]} before The saved rounds before this
 *   one (any mode; only lesson rounds count, test outs do not).
 * @param {import("../../contract/types.js").RoundResult} result This lesson round.
 * @returns {boolean}
 */
export function showDip(before, result) {
  if (result?.mode !== "lesson") return false;
  const lessons = before.filter((r) => r.mode === "lesson" && r.id !== result.id);
  if (!DIP_ROUNDS.includes(lessons.length + 1)) return false;
  const first = lessons[0].wpm;
  return first > 0 && result.wpm < first * (1 - DIP_SHARE);
}
