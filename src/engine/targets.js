// Spawn targets and move them toward danger. Pure; reads only config and the seeded rng.
import {
  BASE_TRAVEL_MS,
  SLOTS,
  SPAWN_GAP_MS,
  SPEED_MAX,
  SPEED_MIN,
  TARGETS_MAX,
  TARGETS_START,
  WARMUP_SLOW,
  WAVE_ADD_EVERY,
  WAVE_SPEEDUP,
  WAVE_SPEEDUP_MAX_WAVE,
} from "./config.js";
import { createRng } from "./rng.js";

const { next } = createRng(0); // `next` takes the state as an argument, so any seed will do

/**
 * The slice of round state these functions use. `rng` is the plain rng state number and
 * `nextId` counts every target ever spawned, so ids keep rising after targets leave.
 * @typedef {object} TargetState
 * @property {"corners"|"falling"} mechanic
 * @property {string} mode
 * @property {{ id: string, text: string }[]} items
 * @property {number} rng
 * @property {number} speed
 * @property {number} wave 1 or more.
 * @property {import("./match.js").Target[]} targets
 * @property {number} nextId
 * @property {number} [warmup] Warm-up words still to come or on screen (0 or missing: none).
 * @property {number} [spawnWaitMs] Time left before the next spawn may happen (0 or missing: now).
 */

/**
 * How many targets may be on screen: one during the warm-up, otherwise the wave's limit, but
 * never more than there are slots.
 */
export function cap(state) {
  if (state.warmup > 0) return 1;
  const waveCap = Math.min(
    TARGETS_START + Math.floor((state.wave - 1) / WAVE_ADD_EVERY),
    TARGETS_MAX,
  );
  return Math.min(waveCap, SLOTS[state.mechanic]);
}

/** Throw unless the state can be used to spawn or move targets. */
function check(state) {
  if (!Number.isInteger(state.wave) || state.wave < 1) {
    throw new RangeError(`wave must be a whole number of at least 1, got ${state.wave}`);
  }
  if (!(state.speed >= SPEED_MIN && state.speed <= SPEED_MAX)) {
    throw new RangeError(`speed must be from ${SPEED_MIN} to ${SPEED_MAX}, got ${state.speed}`);
  }
  if (!Object.hasOwn(SLOTS, state.mechanic))
    throw new RangeError(`unknown mechanic "${state.mechanic}"`);
}

/** The first character of a word. Case counts, as in the lock rule. */
const firstChar = (text) => [...text][0] ?? "";

/** The wait after a spawn before the next one: SPAWN_GAP_MS divided by the speed. */
export const spawnGap = (speed) => SPAWN_GAP_MS / speed;

/**
 * Add one target if fewer are on screen than the wave allows and the spawn gap has passed
 * (`spawnWaitMs` is 0 or missing). The new target starts the gap again; `cool` runs it down.
 * The item is picked uniformly (Block 9 swaps in weighted sampling here) from the items whose
 * first letter no on-screen word starts with, then a free slot. One word per first letter means
 * the first key always locks the word the player is looking at (ZType's rule).
 * @param {TargetState} state
 * @returns {{ state: TargetState, events: [] }} The same state, untouched, when at the limit,
 *   still inside the gap, or every item shares a first letter with a word on screen.
 * @throws {Error} If there are no items to spawn from.
 */
export function spawn(state) {
  check(state);
  if (state.items.length === 0) throw new Error("spawn needs at least one item");
  if (state.targets.length >= cap(state) || state.spawnWaitMs > 0) return { state, events: [] };
  const taken = new Set(state.targets.map((t) => t.slot));
  const free = Array.from({ length: SLOTS[state.mechanic] }, (_, i) => i).filter(
    (i) => !taken.has(i),
  );
  const used = new Set(state.targets.map((t) => firstChar(t.text)));
  const pool = state.items.filter((it) => !used.has(firstChar(it.text)));
  if (pool.length === 0) return { state, events: [] };
  const a = next(state.rng);
  const b = next(a.state);
  const item = pool[Math.floor(a.value * pool.length)];
  const target = {
    id: state.nextId,
    itemId: item.id,
    text: item.text,
    typed: 0,
    progress: 0,
    slot: free[Math.floor(b.value * free.length)],
  };
  return {
    state: {
      ...state,
      rng: b.state,
      nextId: state.nextId + 1,
      targets: [...state.targets, target],
      spawnWaitMs: spawnGap(state.speed),
    },
    events: [],
  };
}

/**
 * Run the spawn gap down by `dtMs`, never below 0.
 * @param {TargetState} state
 * @param {number} dtMs
 * @returns {TargetState}
 */
export const cool = (state, dtMs) => ({
  ...state,
  spawnWaitMs: Math.max(0, (state.spawnWaitMs ?? 0) - dtMs),
});

/**
 * Move every target toward danger by `dtMs`. A target takes
 * BASE_TRAVEL_MS / (speed x WAVE_SPEEDUP^(min(wave, WAVE_SPEEDUP_MAX_WAVE)-1)) to get there,
 * and WARMUP_SLOW of that speed during the warm-up. Practice never moves.
 * Targets stop at progress 1; the caller (round.tick) removes them and takes the life.
 * @param {TargetState} state
 * @param {number} dtMs Milliseconds since the last call.
 * @returns {{ state: TargetState, arrived: number[] }} `arrived` is the ids at progress 1.
 * @throws {RangeError} If `dtMs` is negative or not finite.
 */
export function advance(state, dtMs) {
  check(state);
  if (!Number.isFinite(dtMs) || dtMs < 0) {
    throw new RangeError(`dtMs must be a finite number of at least 0, got ${dtMs}`);
  }
  if (state.mode === "practice") return { state, arrived: [] };
  const waves = Math.min(state.wave, WAVE_SPEEDUP_MAX_WAVE) - 1; // no faster after the cap
  const slow = state.warmup > 0 ? WARMUP_SLOW : 1;
  const travelMs = BASE_TRAVEL_MS / (state.speed * slow * WAVE_SPEEDUP ** waves);
  const targets = state.targets.map((t) => ({
    ...t,
    progress: Math.min(1, t.progress + dtMs / travelMs),
  }));
  return {
    state: { ...state, targets },
    arrived: targets.filter((t) => t.progress >= 1).map((t) => t.id),
  };
}
