// The typing line (lessons Req 3): the line, how much is typed, the wrong key if any, and every
// keystroke, carried from line to line across a lesson. Pure: every call returns a new state and
// an ignored call returns the very same one. Strict but clear, as in Play: a wrong key never
// moves on, it stays as the line's wrong key and counts as a miss against the expected key;
// Backspace clears the wrong key and nothing else. A space is a real key here and counts.

/** Each gap between keystrokes counts for at most this long (Req 3.4). */
export const GAP_CAP_MS = 5000;

/**
 * @typedef {object} LineState
 * @property {string} text
 * @property {number} typed Characters typed right so far.
 * @property {string|null} wrong The wrong key showing, or null.
 * @property {{ t: number, expected: string, typed: string, ok: boolean }[]} keystrokes The
 *   lesson's keystrokes so far (the contract's Keystroke shape); `t` is active ms.
 * @property {number} activeMs Time typed so far: the gaps between keys, each capped.
 * @property {number|null} lastAt When the last key came (the caller's clock), or null after a
 *   pause or before the first key, so the next gap counts nothing.
 * @property {boolean} done
 */

/**
 * Start a line, carrying the lesson's keystrokes and time from the line before.
 * @param {string} text A line from generate.js.
 * @param {Partial<LineState>} [carry] The previous line's state.
 * @returns {LineState}
 * @throws {TypeError} For an empty line.
 */
export function startLine(text, carry = {}) {
  if (typeof text !== "string" || text.length === 0) throw new TypeError("a line needs text");
  return {
    text,
    typed: 0,
    wrong: null,
    keystrokes: carry.keystrokes ?? [],
    activeMs: carry.activeMs ?? 0,
    lastAt: carry.lastAt ?? null,
    done: false,
  };
}

/**
 * One key press at time `at` (milliseconds on the caller's clock). Ignored when the line is
 * done or `char` is not one character (so Shift, Tab and Backspace never count here).
 * @param {LineState} state
 * @param {string} char
 * @param {number} at
 * @returns {LineState}
 * @throws {RangeError} If `at` is not a finite number.
 */
export function typeKey(state, char, at) {
  if (!Number.isFinite(at)) throw new RangeError(`bad time ${at}`);
  if (state.done || typeof char !== "string" || [...char].length !== 1) return state;
  const gap = state.lastAt === null ? 0 : Math.min(Math.max(0, at - state.lastAt), GAP_CAP_MS);
  const activeMs = state.activeMs + gap;
  const expected = state.text[state.typed];
  const ok = char === expected;
  const keystrokes = [...state.keystrokes, { t: Math.round(activeMs), expected, typed: char, ok }];
  const base = { ...state, keystrokes, activeMs, lastAt: at };
  if (!ok) return { ...base, wrong: char };
  const typed = state.typed + 1;
  return { ...base, typed, wrong: null, done: typed === state.text.length };
}

/** Backspace: clear the wrong key, nothing else; ignored when none is showing. Never a keystroke. */
export const backspace = (state) => (state.wrong === null ? state : { ...state, wrong: null });

/** Pause: the time until the next key after it counts nothing (Req 3.4). */
export const pauseLine = (state) => (state.lastAt === null ? state : { ...state, lastAt: null });

/** The letter the line waits on, or null when it is done. */
export const waitingKey = (state) => (state.done ? null : state.text[state.typed]);
