// Spawn targets and move them toward danger. Pure; reads only config and the seeded rng.
import {
  BASE_TRAVEL_MS,
  SLOTS,
  SPEED_MAX,
  SPEED_MIN,
  TARGETS_MAX,
  TARGETS_START,
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
 */

/** How many targets may be on screen: the wave's limit, but never more than there are slots. */
function cap(state) {
  const waveCap = Math.min(TARGETS_START + state.wave - 1, TARGETS_MAX);
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

/**
 * Add one target if fewer are on screen than the wave allows. Call it again for more.
 * The item is picked uniformly (Block 9 swaps in weighted sampling here), then a free slot.
 * @param {TargetState} state
 * @returns {{ state: TargetState, events: [] }} The same state, untouched, when at the limit.
 * @throws {Error} If there are no items to spawn from.
 */
export function spawn(state) {
  check(state);
  if (state.items.length === 0) throw new Error("spawn needs at least one item");
  if (state.targets.length >= cap(state)) return { state, events: [] };
  const taken = new Set(state.targets.map((t) => t.slot));
  const free = Array.from({ length: SLOTS[state.mechanic] }, (_, i) => i).filter(
    (i) => !taken.has(i),
  );
  const a = next(state.rng);
  const b = next(a.state);
  const item = state.items[Math.floor(a.value * state.items.length)];
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
    },
    events: [],
  };
}

/**
 * Move every target toward danger by `dtMs`. A target takes
 * BASE_TRAVEL_MS / (speed x WAVE_SPEEDUP^(min(wave, WAVE_SPEEDUP_MAX_WAVE)-1)) to get there.
 * Practice never moves.
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
  const travelMs = BASE_TRAVEL_MS / (state.speed * WAVE_SPEEDUP ** waves);
  const targets = state.targets.map((t) => ({
    ...t,
    progress: Math.min(1, t.progress + dtMs / travelMs),
  }));
  return {
    state: { ...state, targets },
    arrived: targets.filter((t) => t.progress >= 1).map((t) => t.id),
  };
}
