// The progress screen's approved words and the mode names (shell design copy table), shared by
// the progress panels and the menu's best-speed tile.
export const EMPTY_LINE = "Play a round and your keys will show up here.";
export const FEW_LINE = "Not enough typing yet to say anything about your keys. Keep playing.";
export const EVEN_LINE = "Nothing stands out. Your keys look even.";
export const NO_BESTS_LINE = "No personal bests yet. Play a round to set one.";

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
