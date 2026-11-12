// Job: when the word you were typing lands, swallow the rest of it as you finish typing it, so
// those letters never lock a different word (Shara, Nov 12: one lost word was costing two).
// Pure: no clock; time is the round's activeMs.

/** How long after a word lands its leftover letters are still swallowed. */
export const LOST_TAIL_MS = 1500;

/**
 * The tail to remember when targets land: the unfinished part of the locked word, if it landed.
 * @param {object} state Before the landed targets are removed.
 * @param {number[]} arrived Ids that reached danger.
 * @returns {{ text: string, at: number } | null}
 */
export function tailOf(state, arrived) {
  const t = state.targets.find((x) => x.id === state.lockId);
  if (!t || !arrived.includes(t.id)) return state.lostTail ?? null;
  return { text: t.text.slice(t.typed), at: state.activeMs };
}

/**
 * Swallow one key if it is the next letter of the landed word's tail, still in time.
 * @param {object} state
 * @param {string} char
 * @returns {object | null} The new state if the key was swallowed (no keystroke counted), or
 *   null to type it normally. A non-matching or late key drops the tail first (see `dropTail`).
 */
export function swallow(state, char) {
  const tail = state.lostTail;
  if (!tail || state.activeMs - tail.at > LOST_TAIL_MS || tail.text[0] !== char) return null;
  const text = tail.text.slice(1);
  return { ...state, lostTail: text ? { ...tail, text } : null };
}

/** The state without a tail, for a key that was not swallowed. */
export const dropTail = (state) => (state.lostTail ? { ...state, lostTail: null } : state);
