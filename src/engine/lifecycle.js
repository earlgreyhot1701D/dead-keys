// Time, lives, the free continue, resume and end for a round. Pure, like round.js: every call
// returns a new { state, events }; an ignored call returns the very same state and no events.
import { LIVES_MAX } from "./config.js";
import { dropTail, tailOf } from "./lostTail.js";
import { fill } from "./round.js";
import { advance, cool } from "./targets.js";

const same = (state) => ({ state, events: [] });

/**
 * Move time forward. Targets that reach danger are removed, each takes a life (never below 0)
 * and releases the lock if it held it. A warm-up word that lands takes no life: it only counts
 * the warm-up down ("warmupLanded", then "warmupDone" after the last one). At 0 lives the round is held, or ended if the free
 * continue is already used. Ignored while paused, held or ended; practice only counts time.
 * @param {object} state
 * @param {number} dtMs Milliseconds since the last call.
 * @returns {{ state: object, events: object[] }}
 * @throws {RangeError} If `dtMs` is negative or not finite.
 */
export function tick(state, dtMs) {
  if (!Number.isFinite(dtMs) || dtMs < 0) throw new RangeError(`bad dtMs ${dtMs}`);
  if (state.ended || state.paused || state.held) return same(state);
  const { state: moved, arrived } = advance(state, dtMs);
  let s = { ...cool(moved, dtMs), activeMs: state.activeMs + dtMs };
  if (arrived.length === 0) return { state: fill(s), events: [] }; // a word after the spawn gap
  s = { ...s, lostTail: tailOf(s, arrived) }; // the landed word's leftover letters, if locked
  if (s.warmup > 0) {
    const left = Math.max(0, s.warmup - arrived.length);
    const events = arrived.map((targetId) => ({ type: "warmupLanded", targetId }));
    if (left === 0) events.push({ type: "warmupDone" });
    s = {
      ...s,
      targets: s.targets.filter((t) => !arrived.includes(t.id)),
      lockId: arrived.includes(s.lockId) ? null : s.lockId,
      warmup: left,
    };
    return { state: fill(s), events };
  }
  s = {
    ...s,
    targets: s.targets.filter((t) => !arrived.includes(t.id)),
    lockId: arrived.includes(s.lockId) ? null : s.lockId,
    lives: Math.max(0, s.lives - arrived.length),
  };
  const events = arrived.map((targetId) => ({ type: "lifeLost", targetId }));
  if (s.lives > 0) return { state: fill(s), events };
  if (s.continueUsed)
    return { state: { ...s, ended: true }, events: [...events, { type: "ended" }] };
  return { state: { ...s, held: true }, events: [...events, { type: "outOfLives" }] };
}

/**
 * Answer the "out of lives" hold. Continue refills lives, keeps score, wave and cleared count,
 * and uses up the free continue; the screen restarts with fresh targets so none is already near
 * danger. Decline ends the round. Ignored unless the round is held.
 * @param {object} state
 * @param {boolean} doContinue
 * @returns {{ state: object, events: object[] }}
 */
export function resolveOutOfLives(state, doContinue) {
  if (!state.held) return same(state);
  if (!doContinue) return endRound({ ...state, held: false });
  const s = fill({
    ...state,
    lives: LIVES_MAX,
    continueUsed: true,
    held: false,
    lockId: null,
    targets: [],
    spawnWaitMs: 0, // the first fresh word comes at once
    lostTail: null, // the old screen's leftover letters don't reach the fresh one
  });
  return { state: s, events: [{ type: "continued" }] };
}

/**
 * End the round now (the player quits, or practice finishes). Ignored if already ended.
 * @param {object} state
 * @returns {{ state: object, events: object[] }}
 */
export function endRound(state) {
  if (state.ended) return same(state);
  return {
    state: { ...state, ended: true, held: false, paused: false },
    events: [{ type: "ended" }],
  };
}

/**
 * Backspace: clear the wrong key shown on the locked word. Nothing else: a miss never went into
 * the word, so there is nothing to delete (Shara, Nov 12). Ignored with no mark to clear.
 * @param {object} state
 * @returns {{ state: object, events: object[] }}
 */
export function backspace(state) {
  const t = state.targets.find((x) => x.id === state.lockId);
  if (!t?.wrong || state.paused || state.held || state.ended) return same(state);
  const targets = state.targets.map((x) => (x === t ? { ...x, wrong: false } : x));
  return { state: { ...state, targets }, events: [] };
}

/**
 * Pause without dropping the lock (auto-pause when the tab is hidden or the window loses focus;
 * Escape pauses only with nothing locked). Ignored if already paused, held or ended.
 * @param {object} state
 * @returns {{ state: object, events: object[] }}
 */
export function pause(state) {
  if (state.paused || state.held || state.ended) return same(state);
  return { state: { ...dropTail(state), paused: true }, events: [{ type: "paused" }] };
}

/**
 * Leave pause (the pause dialog button; Escape does the same). Ignored if not paused.
 * @param {object} state
 * @returns {{ state: object, events: object[] }}
 */
export function resume(state) {
  if (!state.paused || state.ended) return same(state);
  return { state: { ...state, paused: false }, events: [{ type: "resumed" }] };
}
