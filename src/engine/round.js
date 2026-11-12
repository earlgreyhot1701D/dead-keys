// Create a round, take keys, handle Escape. Pure: a new { state, events } per call, no clock.
import { LIVES_MAX, SLOTS, SPEED_MAX, SPEED_MIN, WARMUP_WORDS, WAVE_SIZE } from "./config.js";
import { dropTail, swallow } from "./lostTail.js";
import { applyKey, pickLock } from "./match.js";
import { createRng } from "./rng.js";
import { spawn } from "./targets.js";

// Every mode a RoundResult can carry (contract/schemas/roundResult.json).
export const MODES = ["corners", "falling", "practice", "lesson", "testout", "daily", "specwave"];
const same = (state) => ({ state, events: [] }); // an ignored input: the very same state

/** Spawn up to the wave's limit; the spawn gap stops it after one (tick brings the rest). */
export function fill(state) {
  for (;;) {
    const r = spawn(state);
    if (r.state === state) return state;
    state = r.state;
  }
}

/**
 * Start a round. Everything is passed in; nothing is read from a clock.
 * @param {object} o
 * @param {string} o.mode One of MODES.
 * @param {"corners"|"falling"} o.mechanic The layout. Practice uses it too but never moves.
 * @param {{ id: string, text: string }[]} o.items The pack's items to spawn from.
 * @param {number} o.seed
 * @param {number} o.speed From SPEED_MIN to SPEED_MAX.
 * @returns {{ state: object, events: [] }}
 * @throws {TypeError|RangeError} On bad options (programmer error).
 */
export function createRound({ mode, mechanic, items, seed, speed }) {
  if (!MODES.includes(mode)) throw new RangeError(`unknown mode "${mode}"`);
  if (!Object.hasOwn(SLOTS, mechanic)) throw new RangeError(`unknown mechanic "${mechanic}"`);
  if (!Array.isArray(items) || items.length === 0) throw new TypeError("items must not be empty");
  if (items.some((i) => typeof i?.id !== "string" || typeof i?.text !== "string" || !i.text)) {
    throw new TypeError("every item needs an id and some text");
  }
  if (!(speed >= SPEED_MIN && speed <= SPEED_MAX)) throw new RangeError(`bad speed ${speed}`);
  const state = fill({
    mode,
    mechanic,
    items: items.map((i) => ({ ...i })), // the caller can't change a running round
    rng: createRng(seed).state,
    speed,
    lives: LIVES_MAX,
    wave: 1, // practice has no waves; toResult reports 0 for it
    warmup: mode === "falling" || mode === "corners" ? WARMUP_WORDS : 0, // Shara, Nov 12
    clearedThisWave: 0,
    cleared: 0,
    targets: [],
    nextId: 0,
    spawnWaitMs: 0, // the first word comes at once, the rest one spawn gap apart
    lockId: null,
    paused: false,
    held: false,
    continueUsed: false,
    ended: false,
    activeMs: 0,
    keystrokes: [],
    strayKeys: 0,
    keyDeltas: {},
  });
  return same(state);
}

/**
 * One key press. Ignored when paused, held, ended, a space (no word has one), or not one
 * character (Req 2.7). A miss sets the locked word's `wrong` to the key, until the right key.
 * @param {object} state
 * @param {string} char
 * @returns {{ state: object, events: object[] }}
 */
export function key(state, char) {
  if (state.ended || state.paused || state.held || char === " ") return same(state);
  if (typeof char !== "string" || [...char].length !== 1) return same(state);
  const swallowed = swallow(state, char); // the rest of a word that just landed (lostTail.js)
  if (swallowed) return same(swallowed);
  const events = [];
  let s = dropTail(state);
  let lock = s.targets.find((t) => t.id === s.lockId);
  if (!lock) {
    lock = pickLock(s.targets, char);
    // Nothing expects this key: a counted keystroke, with no expected key to blame.
    if (!lock) {
      const miss = { type: "miss", expected: null, typed: char };
      return { state: { ...s, strayKeys: s.strayKeys + 1 }, events: [miss] };
    }
    s = { ...s, lockId: lock.id };
    events.push({ type: "locked", targetId: lock.id });
  }
  const r = applyKey(lock, char);
  const d = s.keyDeltas[r.expected] ?? { attempts: 0, misses: 0 };
  s = {
    ...s,
    targets: s.targets.map((t) => (t.id === lock.id ? { ...r.target, wrong: !r.ok && char } : t)),
    keystrokes: [
      ...s.keystrokes,
      { t: Math.round(s.activeMs), expected: r.expected, typed: char, ok: r.ok },
    ],
    keyDeltas: {
      ...s.keyDeltas,
      [r.expected]: { attempts: d.attempts + 1, misses: d.misses + (r.ok ? 0 : 1) },
    },
  };
  if (!r.ok) {
    events.push({ type: "miss", expected: r.expected, typed: char });
    return { state: s, events };
  }
  if (!r.cleared) return { state: s, events };
  const warm = s.warmup > 0; // a warm-up word counts as cleared, not toward wave 1
  s = {
    ...s,
    targets: s.targets.filter((t) => t.id !== lock.id),
    lockId: null,
    cleared: s.cleared + 1,
    clearedThisWave: s.clearedThisWave + (warm ? 0 : 1),
    warmup: warm ? s.warmup - 1 : (s.warmup ?? 0),
  };
  events.push({ type: "cleared", targetId: lock.id });
  if (warm && s.warmup === 0) events.push({ type: "warmupDone" });
  if (s.mode !== "practice" && s.clearedThisWave === WAVE_SIZE) {
    s = { ...s, wave: s.wave + 1, clearedThisWave: 0, lives: Math.min(LIVES_MAX, s.lives + 1) };
    events.push({ type: "waveUp", wave: s.wave });
  }
  return { state: fill(s), events };
}

/**
 * Escape: drop a held lock, else pause; while paused, resume. Ignored when held or ended.
 * @param {object} state
 * @returns {{ state: object, events: object[] }}
 */
export function pressEscape(state) {
  if (state.ended || state.held) return same(state);
  if (state.paused) return { state: { ...state, paused: false }, events: [{ type: "resumed" }] };
  if (state.lockId === null)
    return { state: { ...dropTail(state), paused: true }, events: [{ type: "paused" }] };
  return {
    state: {
      ...state,
      lockId: null,
      targets: state.targets.map((t) =>
        t.id === state.lockId ? { ...t, typed: 0, wrong: false } : t,
      ),
    },
    events: [{ type: "unlocked", targetId: state.lockId }],
  };
}
