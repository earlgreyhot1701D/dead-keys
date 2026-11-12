// The progress screen's approved words and the mode names (shell design copy table), shared by
// the progress panels and the menu's best-speed tile.
import { BEST_ACCURACY } from "../../engine/progressConfig.js";
export const EMPTY_LINE = "Play a round and your keys will show up here.";
export const FEW_LINE = "Not enough typing yet to say anything about your keys. Keep playing.";
export const EVEN_LINE = "Nothing stands out. Your keys look even.";
export const NO_GROUP_LINE =
  "No group of keys stands out. Single keys to work on are listed under Keys to practice.";
/** The accuracy a best needs comes from the engine's config, so the words cannot drift. */
export const NO_BESTS_LINE = `No personal bests yet. A best needs ${Math.round(BEST_ACCURACY * 100)}% accuracy or better.`;

/** Keys that are hard to see or hear as a single character, by name. */
const KEY_NAMES = Object.freeze({
  ",": "comma",
  ".": "period",
  " ": "space",
  ";": "semicolon",
  "'": "apostrophe",
  "`": "backtick",
});
/** A key as a player reads it: "comma", not ",". */
export const keyName = (k) => (Object.hasOwn(KEY_NAMES, k) ? KEY_NAMES[k] : k);
/** Keys in a list: "a · comma · space". */
export const keyList = (keys) => keys.map(keyName).join(" · ");

/** Player names for the modes that can hold a personal best. */
export const MODE_NAMES = Object.freeze({
  corners: "Four corners",
  falling: "Falling words",
  lesson: "Lessons",
  testout: "Test outs",
  daily: "Daily drill",
  specwave: "Spec Wave",
});
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/**
 * "set Nov 11" for a time in ms, in the player's local time. Empty when the time is unusable.
 * @param {unknown} ms
 */
export function setOn(ms) {
  const d = new Date(typeof ms === "number" ? ms : Number.NaN);
  return Number.isNaN(d.getTime()) ? "" : `set ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** A mode's player name, or its own id for a mode this build does not know. */
export const modeName = (mode) => (Object.hasOwn(MODE_NAMES, mode) ? MODE_NAMES[mode] : mode);

/** "2 FINDINGS, WORST FIRST". */
export const findingsText = (n) => `${n} ${n === 1 ? "FINDING" : "FINDINGS"}, WORST FIRST`;
