// WPM and accuracy (PRD G5). Pure. Bad input is a programmer error and throws (design decision 6).

/** Throw unless n is a finite number of at least 0. */
function check(name, n) {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
    throw new RangeError(`${name} must be a finite number of at least 0, got ${n}`);
  }
}

/**
 * Words per minute: (correct characters / 5) / minutes. 0 when no time has passed.
 * @param {number} correctChars Keystrokes that matched.
 * @param {number} durationMs Active play time in milliseconds, paused time left out.
 * @returns {number} At least 0.
 * @throws {RangeError} If either input is negative, not finite or not a number.
 */
export function wpm(correctChars, durationMs) {
  check("correctChars", correctChars);
  check("durationMs", durationMs);
  if (durationMs === 0) return 0;
  // (chars / 5) / (ms / 60000), rearranged: a tiny ms must not underflow to 0 and give 0 / 0.
  const w = (correctChars * 12000) / durationMs;
  return Number.isFinite(w) ? w : 0; // overflow only with absurd inputs; real rounds never get here
}

/**
 * Accuracy: correct keystrokes / total keystrokes. 0 when there are no keystrokes.
 * Backspace is not a keystroke, so callers never count it.
 * @param {number} correct Keystrokes that matched.
 * @param {number} total All keystrokes.
 * @returns {number} From 0 to 1.
 * @throws {RangeError} If an input is negative, not finite or not a number, or correct > total.
 */
export function accuracy(correct, total) {
  check("correct", correct);
  check("total", total);
  if (correct > total) throw new RangeError(`correct (${correct}) is more than total (${total})`);
  return total === 0 ? 0 : correct / total;
}
