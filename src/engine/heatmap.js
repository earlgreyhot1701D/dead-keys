// Band per key for the heat map (PRD G5: Miss rate, Heat bands). Pure; never changes input.
import { BANDS, MIN_KEY_ATTEMPTS } from "./progressConfig.js";

const NO_DATA = BANDS.find((b) => b.min === null);
const whole = (n) => Number.isInteger(n) && n >= 0;

/** Throw unless the stat has whole counts with misses no more than attempts. */
function check(stat) {
  if (!whole(stat?.attempts) || !whole(stat?.misses) || stat.misses > stat.attempts) {
    throw new RangeError(`bad key stat for "${stat?.key}"`);
  }
}

/**
 * The band for one key: "no data" under MIN_KEY_ATTEMPTS attempts, otherwise by miss rate
 * (misses / attempts) against the cutoffs in BANDS.
 * @param {{ key: string, attempts: number, misses: number }} stat
 * @returns {"missed"|"shaky"|"uneven"|"steady"|"noData"} The band's internal name.
 * @throws {RangeError} If the counts are not whole numbers or misses exceed attempts.
 */
export function bandFor(stat) {
  check(stat);
  if (stat.attempts < MIN_KEY_ATTEMPTS) return NO_DATA.name;
  const rate = stat.misses / stat.attempts;
  return BANDS.find((b) => b.min !== null && rate >= b.min).name;
}

/**
 * Band, glyph, player label and miss rate for every key, in the order given. `missRate` is null
 * for "no data" keys, because a rate from a few keystrokes should not be read as a verdict.
 * @param {{ key: string, attempts: number, misses: number }[]} keys
 * @returns {{ key: string, band: string, glyph: string, label: string, missRate: number|null }[]}
 */
export function heatmap(keys) {
  return keys.map((stat) => {
    const band = bandFor(stat);
    const { glyph, label } = BANDS.find((b) => b.name === band);
    const missRate = band === NO_DATA.name ? null : stat.misses / stat.attempts;
    return { key: stat.key, band, glyph, label, missRate };
  });
}
