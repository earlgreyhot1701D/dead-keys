// The US QWERTY keycaps and the plain-text summary of a heat map (pure, no DOM; shell Req 6.1).
// Bands, glyphs and labels come from the engine, so the picture and "How we count" cannot differ.
import { heatmap } from "../../engine/heatmap.js";
import { BANDS } from "../../engine/progressConfig.js";

/** Unshifted keys, row by row. Space is drawn as a wide key on its own row. */
export const ROWS = Object.freeze(
  ["1234567890-=", "qwertyuiop[]", "asdfghjkl;'", "zxcvbnm,./", " "].map((r) => [...r]),
);

const NO_DATA = BANDS.find((b) => b.min === null);

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

const name = (k) => (k === " " ? "space" : k);

/**
 * Plain sentences for a screen reader, one per band that has keys, worst band first. Every
 * layout key is placed in exactly one band, so the lines add up to the whole keyboard.
 * @returns {string[]} For example "Focus here: f, j." or "Not enough yet: 12 keys."
 */
export function summarizeKeyboard(model) {
  const caps = model.flat();
  return BANDS.flatMap((b) => {
    const inBand = caps.filter((c) => c.band === b.name).map((c) => name(c.key));
    if (!inBand.length) return [];
    if (b.min === null) return [`${b.label}: ${inBand.length} keys.`];
    return [`${b.label}: ${inBand.join(", ")}.`];
  });
}
