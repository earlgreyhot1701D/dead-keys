// Lock choice and one keystroke against one target (PRD G5: Lock, Miss, Case). Pure.

/**
 * @typedef {object} Target
 * @property {number} id Counts up from 0 in spawn order; breaks lock ties.
 * @property {string} itemId
 * @property {string} text
 * @property {number} typed Characters done so far.
 * @property {number} progress 0 = just spawned, 1 = reached danger.
 * @property {number} slot
 */

/** Throw unless c is exactly one character (a code point, so ñ and ¿ count as one). */
function checkChar(c) {
  if (typeof c !== "string" || [...c].length !== 1) {
    throw new TypeError("char must be a string of exactly one character");
  }
}

/** The character this target expects next, or undefined if it is finished. */
const nextChar = (t) => [...t.text][t.typed];

/**
 * Pick the target to lock: nearest to danger among those whose next character is `char`.
 * Ties go to the target that spawned first (lower id). Case counts: "A" is not "a".
 * @param {Target[]} targets
 * @param {string} char One character.
 * @returns {Target | null} Null when no target expects that character.
 * @throws {TypeError} If `char` is not one character. The round filters bad input first.
 */
export function pickLock(targets, char) {
  checkChar(char);
  let best = null;
  for (const t of targets) {
    if (nextChar(t) !== char) continue;
    if (!best || t.progress > best.progress || (t.progress === best.progress && t.id < best.id)) {
      best = t;
    }
  }
  return best;
}

/**
 * Type one character at a target. Never changes the target it is given.
 * A match moves typed forward by one; a miss changes nothing and keeps the lock.
 * @param {Target} target A locked target that is not finished.
 * @param {string} char One character.
 * @returns {{ target: Target, ok: boolean, expected: string, cleared: boolean }}
 *   `expected` is the key the player should have pressed. `cleared` is true on the last character.
 * @throws {TypeError} If `char` is not one character.
 * @throws {RangeError} If the target is already finished.
 */
export function applyKey(target, char) {
  checkChar(char);
  const expected = nextChar(target);
  if (expected === undefined) throw new RangeError("target is already finished");
  if (char !== expected) return { target, ok: false, expected, cleared: false };
  const typed = target.typed + 1;
  return {
    target: { ...target, typed },
    ok: true,
    expected,
    cleared: typed === [...target.text].length,
  };
}
