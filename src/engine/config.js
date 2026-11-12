// Every tunable number for the engine, named, in one place. Tuning never touches the rules.

/** Most lives a player can hold. */
export const LIVES_MAX = 5;

/** Targets cleared in one wave before the next wave starts. */
export const WAVE_SIZE = 10;

/** Each wave, travel is this many times faster than the wave before... */
export const WAVE_SPEEDUP = 1.1;
/** ...up to this wave; later waves keep its speed (Block 7: wave 20 was about 1.3 s a word). */
export const WAVE_SPEEDUP_MAX_WAVE = 12;

/** Characters that count as one word for WPM (PRD G5). */
export const CHARS_PER_WORD = 5;

/** Lowest and highest value of the speed slider. Default is 1. */
export const SPEED_MIN = 0.5;
export const SPEED_MAX = 2;

/** Targets allowed on screen in wave 1, one more each wave, never above the max. */
export const TARGETS_START = 3;
export const TARGETS_MAX = 8;

/** Milliseconds for a target to reach danger at speed 1 in wave 1. Tuned in Block 7. */
export const BASE_TRAVEL_MS = 8000;

/** Where a target can appear: corners for the four-corner mechanic, lanes for falling. */
export const SLOTS = Object.freeze({ corners: 4, falling: 8 });
