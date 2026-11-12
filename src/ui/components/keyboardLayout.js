// The US QWERTY keycaps and the plain-text summary of a heat map (pure, no DOM; shell Req 6.1).
// Bands, glyphs and labels come from the engine, so the picture and "How we count" cannot differ.
import { heatmap } from "../../engine/heatmap.js";
import { BANDS, MIN_KEY_ATTEMPTS } from "../../engine/progressConfig.js";
import { keyList } from "./progressText.js";

/** Unshifted keys, row by row, as in the locked mock. Space is drawn as a wide key on its own row. */
export const ROWS = Object.freeze(
  ["`1234567890-=", "qwertyuiop[]", "asdfghjkl;'", "zxcvbnm,./", " "].map((r) => [...r]),
);

/** The shifted character printed small on a cap, as the mock does (top row only). */
export const SHIFT_LABELS = Object.freeze({
  "`": "~",
  1: "!",
  2: "@",
  3: "#",
  4: "$",
  5: "%",
  6: "^",
  7: "&",
  8: "*",
  9: "(",
  0: ")",
  "-": "_",
  "=": "+",
});

/** The home-row keys with a bump, marked as the mock marks them. */
export const BUMPS = Object.freeze(["f", "j"]);

const NO_DATA = BANDS.find((b) => b.min === null);
const pct = (x) => `${Math.round(x * 100)}%`;

/**
 * Each band's range in words, from the same config the heat map uses (the "How we count"
 * wording): "15% or more", "8% up to 15%", "under 3%", "fewer than 10 tries".
 * @returns {Record<string, string>} By band name.
 */
export function bandRanges(bands = BANDS, minAttempts = MIN_KEY_ATTEMPTS) {
  const real = bands.filter((b) => b.min !== null);
  const out = {};
  real.forEach((b, i) => {
    if (i === 0) out[b.name] = `${pct(b.min)} or more`;
    else if (b.min === 0) out[b.name] = `under ${pct(real[i - 1].min)}`;
    else out[b.name] = `${pct(b.min)} up to ${pct(real[i - 1].min)}`;
  });
  for (const b of bands) if (b.min === null) out[b.name] = `fewer than ${minAttempts} tries`;
  return out;
}

/**
 * One cap per layout key, with its band. A key with no saved stat is "no data". Shifted
 * characters and accented letters have no cap here; they still count in the diagnosis.
 * @param {{ key: string, attempts: number, misses: number }[]} keys Saved stats.
 * @returns {{ key: string, band: string, glyph: string, label: string, missRate: number|null }[][]}
 */
export function keyboardModel(keys) {
  const known = new Map(heatmap(keys).map((h) => [h.key, h]));
  const empty = (key) => ({
    key,
    band: NO_DATA.name,
    glyph: NO_DATA.glyph,
    label: NO_DATA.label,
    missRate: null,
  });
  return ROWS.map((row) => row.map((k) => known.get(k) ?? empty(k)));
}

/**
 * Plain sentences for eyes and a screen reader, one per band that has keys, worst band first.
 * Every layout key is placed in exactly one band, so the lines add up to the whole keyboard.
 * Keys are separated by " · ", and hard-to-see keys are named ("comma", "space").
 * @returns {string[]} For example "Focus here: f · comma." or "Not enough yet: 12 keys."
 */
export function summarizeKeyboard(model) {
  const caps = model.flat();
  return BANDS.flatMap((b) => {
    const inBand = caps.filter((c) => c.band === b.name).map((c) => c.key);
    if (!inBand.length) return [];
    if (b.min === null) return [`${b.label}: ${inBand.length} keys.`];
    return [`${b.label}: ${keyList(inBand)}.`];
  });
}
