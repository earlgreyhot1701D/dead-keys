// Turn a finished round into a RoundResult (contract/schemas/roundResult.json). Pure.
import { accuracy, wpm } from "./score.js";

const DRILL_SOURCES = ["built-in", "ai", null];
const text = (v) => typeof v === "string" && v !== "";

/**
 * Build the RoundResult for a round that has ended.
 * Stray keys count in `totalKeystrokes` but not in `keyDeltas` (design decision 3).
 * Practice reports `wave` 0; `cleared` is the count as played.
 * @param {object} state An ended round.
 * @param {object} meta What the engine cannot know, passed in so it stays deterministic.
 * @param {string} meta.id
 * @param {number} meta.date Epoch milliseconds.
 * @param {string} meta.packId
 * @param {string|null} meta.lessonId Null when the round is not a lesson or test out.
 * @param {"built-in"|"ai"|null} meta.drillSource Null when the round was not a drill.
 * @returns {import("../../contract/types.js").RoundResult}
 * @throws {Error} If the round has not ended. @throws {TypeError} If `meta` is malformed.
 */
export function toResult(state, meta) {
  if (!state.ended) throw new Error("toResult needs a round that has ended");
  const ok =
    text(meta?.id) &&
    text(meta?.packId) &&
    Number.isInteger(meta?.date) &&
    meta.date >= 0 &&
    (meta.lessonId === null || text(meta.lessonId)) &&
    DRILL_SOURCES.includes(meta.drillSource);
  if (!ok) throw new TypeError("meta needs id, date, packId, lessonId and drillSource");
  const durationMs = Math.round(state.activeMs); // the contract wants whole milliseconds
  const correctChars = state.keystrokes.filter((k) => k.ok).length;
  const totalKeystrokes = state.keystrokes.length + state.strayKeys;
  return {
    id: meta.id,
    date: meta.date,
    mode: state.mode,
    packId: meta.packId,
    lessonId: meta.lessonId,
    durationMs,
    correctChars,
    totalKeystrokes,
    wpm: wpm(correctChars, durationMs),
    accuracy: accuracy(correctChars, totalKeystrokes),
    cleared: state.cleared,
    wave: state.mode === "practice" ? 0 : state.wave,
    keyDeltas: structuredClone(state.keyDeltas), // no shared object between result and round
    drillSource: meta.drillSource,
    continued: state.continueUsed,
  };
}
