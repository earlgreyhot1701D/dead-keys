// A finished lesson as one RoundResult (lessons Req 4.3; design decision 2), the Check accuracy,
// the pass rule (Req 4.1, 4.2) and the most-missed keys for the Lesson done card. Pure.
import { accuracy, wpm } from "../engine/score.js";

/** A lesson or test out passes at this Check accuracy or better, at any speed (PRD G5). */
export const PASS_ACCURACY = 0.95;
/** Every lesson round names the general pack (the only pack in Block 8a). */
export const LESSON_PACK = "general";

const correctOf = (keystrokes) => keystrokes.filter((k) => k.ok).length;

/** Accuracy over some keystrokes: right ones out of all of them; 0 when there are none. */
export const accuracyOf = (keystrokes) => accuracy(correctOf(keystrokes), keystrokes.length);

/**
 * Does this lesson pass? Lesson 0 passes when it is finished; any other lesson, or a test out,
 * when its Check keystrokes are PASS_ACCURACY accurate or better.
 * @param {string} lessonId
 * @param {{ ok: boolean }[]} checkKeystrokes The Check part's keystrokes only.
 */
export function passes(lessonId, checkKeystrokes) {
  if (lessonId === "L00") return true;
  return checkKeystrokes.length > 0 && accuracyOf(checkKeystrokes) >= PASS_ACCURACY;
}

/** The pass to hand to `record` when the lesson passed, or null (Req 4.4). */
export const passFor = (lessonId, kind, passed) =>
  passed ? { lessonId, how: kind === "testout" ? "testout" : "lesson" } : null;

/** Attempts and misses per expected key, the contract's keyDeltas. */
export function keyDeltasOf(keystrokes) {
  const out = {};
  for (const k of keystrokes) {
    const d = out[k.expected] ?? { attempts: 0, misses: 0 };
    out[k.expected] = { attempts: d.attempts + 1, misses: d.misses + (k.ok ? 0 : 1) };
  }
  return out;
}

/**
 * Up to `n` keys missed most in this lesson, most first; ties in key order. None: [].
 * @param {{ expected: string, ok: boolean }[]} keystrokes
 */
export function mostMissed(keystrokes, n = 2) {
  return Object.entries(keyDeltasOf(keystrokes))
    .filter(([, d]) => d.misses > 0)
    .sort(([a, x], [b, y]) => y.misses - x.misses || (a < b ? -1 : 1))
    .slice(0, n)
    .map(([k]) => k);
}

/**
 * The lesson's RoundResult: every keystroke of every part, so the heat map learns from all of it.
 * @param {object} o
 * @param {string} o.id
 * @param {number} o.date Epoch milliseconds.
 * @param {string} o.lessonId
 * @param {"lesson"|"testout"} o.kind
 * @param {{ t: number, expected: string, typed: string, ok: boolean }[]} o.keystrokes
 * @param {number} o.activeMs Lesson time (line.js: gaps between keys, capped, no pauses).
 * @returns {import("../../contract/types.js").RoundResult}
 */
export function toLessonResult({ id, date, lessonId, kind, keystrokes, activeMs }) {
  const durationMs = Math.round(activeMs);
  const correctChars = correctOf(keystrokes);
  return {
    id,
    date,
    mode: kind === "testout" ? "testout" : "lesson",
    packId: LESSON_PACK,
    lessonId,
    durationMs,
    correctChars,
    totalKeystrokes: keystrokes.length,
    wpm: wpm(correctChars, durationMs),
    accuracy: accuracy(correctChars, keystrokes.length),
    cleared: 0,
    wave: 0,
    keyDeltas: keyDeltasOf(keystrokes),
    drillSource: null,
    continued: false,
  };
}
