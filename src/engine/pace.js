// Job: estimate the typing speed (WPM) a round asks for, from the same numbers the engine uses.
// The picker shows it so "1×" means something. Pure: no DOM, no clock.
import {
  BASE_TRAVEL_MS,
  CHARS_PER_WORD,
  SLOTS,
  TARGETS_MAX,
  TARGETS_START,
  WAVE_ADD_EVERY,
  WAVE_SPEEDUP,
  WAVE_SPEEDUP_MAX_WAVE,
} from "./config.js";

/** The average length of the words, in characters. 0 for an empty list. */
export const averageLength = (items) =>
  items.length === 0 ? 0 : items.reduce((n, it) => n + [...it.text].length, 0) / items.length;

/**
 * About how many WPM a player needs to keep up: every word on screen cleared within one travel
 * time. A WPM word is 5 characters plus the space the player never types here, so this is a
 * floor, not a promise.
 * @param {{ speed: number, wave?: number, avgLength: number, mechanic?: "falling"|"corners" }} o
 * @returns {number} Rounded to a whole number.
 */
export function paceWpm({ speed, wave = 1, avgLength, mechanic = "falling" }) {
  const added = Math.floor((wave - 1) / WAVE_ADD_EVERY);
  const onScreen = Math.min(TARGETS_START + added, TARGETS_MAX, SLOTS[mechanic]);
  const waveSpeed = WAVE_SPEEDUP ** (Math.min(wave, WAVE_SPEEDUP_MAX_WAVE) - 1);
  const travelMin = BASE_TRAVEL_MS / (speed * waveSpeed) / 60000;
  return Math.round((onScreen * avgLength) / CHARS_PER_WORD / travelMin);
}
