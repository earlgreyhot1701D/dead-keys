// Player settings (shell Req 5.1, 5.2). The contract leaves `progress.settings` a loose object, so
// this file is where its fields, defaults and checks live. Saved with the rest of Progress through
// saveClear.js. Pure; never throws on bad saved data, and never keeps a field it does not know.
import { SPEED_MAX, SPEED_MIN } from "../engine/config.js";
import { PACK_IDS } from "../packs/registry.js";

/** The sound sets (PRD G2). Off by default; the sounds themselves arrive in Block 14. */
export const SOUND_SETS = Object.freeze(["off", "typewriter", "arcade"]);

/**
 * @typedef {object} Settings
 * @property {boolean} ai AI drills (stored now, used in Block 10). Off until the player opts in,
 *   because turning it on is what lets weak keys and recent speed leave the browser.
 * @property {"off"|"typewriter"|"arcade"} sound
 * @property {number} speed From SPEED_MIN to SPEED_MAX; passed to `createRound` in Block 7.
 * @property {boolean} fingerColors Finger colors on the keyboard.
 * @property {boolean} privacySeen The first-launch privacy card was dismissed (shell Req 4.2).
 * @property {"general"|"spanish"} pack The words for Falling words, Four corners and Practice.
 */

/** What a new player gets. */
export const DEFAULTS = Object.freeze({
  ai: false,
  sound: "off",
  speed: 0.7, // new typists start slow; anyone can raise it on the picker (Shara, Nov 12)
  fingerColors: true,
  privacySeen: false,
  pack: "general", // English (spanish Req 2)
});

const bool = (v) => typeof v === "boolean";
const CHECKS = {
  ai: bool,
  sound: (v) => SOUND_SETS.includes(v),
  speed: (v) => typeof v === "number" && Number.isFinite(v) && v >= SPEED_MIN && v <= SPEED_MAX,
  fingerColors: bool,
  privacySeen: bool,
  pack: (v) => PACK_IDS.includes(v),
};

/**
 * Is `value` allowed for the setting called `key`? An unknown key is never valid.
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidSetting(key, value) {
  return Object.hasOwn(CHECKS, key) && CHECKS[key](value);
}

/**
 * Turn whatever was saved into a complete, valid Settings. Each field is judged on its own: a good
 * one is kept, a missing or bad one gets its default (a speed outside the slider's range counts as
 * bad). Fields this build does not know are dropped. Always returns a new object.
 * @param {unknown} raw
 * @returns {Settings}
 */
export function normalizeSettings(raw) {
  const given = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const key of Object.keys(DEFAULTS)) {
    // hasOwn, so an inherited property (or a `__proto__` trick) can never supply a value
    out[key] = Object.hasOwn(given, key) && CHECKS[key](given[key]) ? given[key] : DEFAULTS[key];
  }
  return out;
}

/**
 * A copy of `settings` with one field changed.
 * @param {Settings} settings
 * @param {string} key
 * @param {unknown} value
 * @returns {Settings}
 * @throws {TypeError} If `key` is not a setting. @throws {RangeError} If `value` is not allowed
 *   for it. Both are programmer errors: the Settings screen only offers valid choices.
 */
export function withSetting(settings, key, value) {
  if (!Object.hasOwn(CHECKS, key)) throw new TypeError(`"${key}" is not a setting`);
  if (!CHECKS[key](value))
    throw new RangeError(`${JSON.stringify(value)} is not allowed for "${key}"`);
  return { ...normalizeSettings(settings), [key]: value };
}
