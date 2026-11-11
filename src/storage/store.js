// Load the one saved Progress and read the damaged copy (requirements.md, Req 2). Storage is
// passed in (the browser's localStorage, or a stand-in in tests), every call to it sits in
// try/catch, and nothing here draws, confirms or reads a clock. Functions return a notice id (see
// notices.js) or null; the screen draws it. Saving and clearing are in saveClear.js.
import { CURRENT_SCHEMA_VERSION } from "../../contract/types.js";
import { freshProgress, migrate } from "./migrate.js";

export { freshProgress };
export const KEY = "deadkeys:v1";
export const CORRUPT_KEY = "deadkeys:v1:corrupt";

/**
 * Anything with getItem, setItem and removeItem.
 * @typedef {{ getItem: (k: string) => string | null, setItem: (k: string, v: string) => void, removeItem: (k: string) => void }} Storage
 * @typedef {import("./notices.js").NoticeId} NoticeId
 */

const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const usable = (s) =>
  ["getItem", "setItem", "removeItem"].every((m) => typeof s?.[m] === "function");

/** Run `fn`; false if it threw. */
function attempt(fn) {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
}

/** Write a Progress that was just checked (by migrate) or built (by freshProgress). */
const put = (storage, progress) => attempt(() => storage.setItem(KEY, JSON.stringify(progress)));

/**
 * Read the saved Progress. `persist` is false when the app must not write: storage is blocked, or
 * the save is from a newer version (never overwritten). In every case `progress` is usable.
 * - nothing saved: fresh, no notice
 * - saved and good: used as is
 * - older version: the raw text is copied to `deadkeys:v1:corrupt` first (an upgrade can drop
 *   data), then the upgraded save is written, no notice; if the copy cannot be written, nothing is
 *   touched, the upgraded progress runs in memory, `blocked`; if only the upgraded write fails it
 *   still loads, with `saveFailed`
 * - newer version: left alone, fresh in memory, `newer`
 * - damaged (not JSON, fails the contract or the vet checks, cannot be upgraded, or the upgrade
 *   throws): the raw text
 *   is copied to `deadkeys:v1:corrupt`, fresh progress replaces it at once, `corrupt`
 * - if that copy cannot be written, nothing is touched, fresh in memory, `blocked`
 * - storage missing or throwing: fresh in memory, `blocked`
 * @param {Storage} storage
 * @param {number} now Milliseconds, for a fresh `createdAt`.
 * @param {typeof migrate} [migrateFn] Only tests pass this, to prove a throwing upgrade is handled.
 * @returns {{ progress: import("../../contract/types.js").Progress, notice: NoticeId | null, persist: boolean }}
 * @throws {TypeError} If `now` is not a whole number (programmer error).
 */
export function load(storage, now, migrateFn = migrate) {
  if (!Number.isInteger(now) || now < 0) throw new TypeError("now must be a whole number");
  const blocked = () => ({ progress: freshProgress(now), notice: "blocked", persist: false });
  if (!usable(storage)) return blocked();
  let raw;
  try {
    raw = storage.getItem(KEY);
  } catch {
    return blocked();
  }
  if (raw === null || raw === undefined) {
    return { progress: freshProgress(now), notice: null, persist: true };
  }
  raw = String(raw);
  let parsed;
  let isJson = true;
  try {
    parsed = JSON.parse(raw);
  } catch {
    isJson = false;
  }
  const version = isJson && isObj(parsed) ? parsed.schemaVersion : undefined;
  if (Number.isInteger(version) && version > CURRENT_SCHEMA_VERSION) {
    return { progress: freshProgress(now), notice: "newer", persist: false };
  }
  let result = { ok: false };
  if (isJson) {
    try {
      result = migrateFn(parsed, now);
    } catch {
      result = { ok: false }; // a throw while checking or upgrading means the save is damaged
    }
  }
  if (result.ok) {
    if (parsed.schemaVersion === CURRENT_SCHEMA_VERSION) {
      return { progress: result.progress, notice: null, persist: true };
    }
    // An upgrade can drop data (version 0 keeps only valid rounds), so keep the original first.
    if (!attempt(() => storage.setItem(CORRUPT_KEY, raw))) {
      return { progress: result.progress, notice: "blocked", persist: false };
    }
    const notice = put(storage, result.progress) ? null : "saveFailed";
    return { progress: result.progress, notice, persist: true };
  }
  // Damaged. Keep the raw text first; if that fails, leave the original alone rather than lose it.
  if (!attempt(() => storage.setItem(CORRUPT_KEY, raw))) return blocked();
  const progress = freshProgress(now);
  put(storage, progress); // replace the damaged save so the notice is not shown on every load
  return { progress, notice: "corrupt", persist: true };
}

/**
 * The raw text of the damaged save, so the screen can offer it as a download.
 * @param {Storage} storage
 * @returns {string | null} Null if there is none or storage throws.
 */
export function readCorrupt(storage) {
  if (!usable(storage)) return null;
  try {
    const raw = storage.getItem(CORRUPT_KEY);
    return typeof raw === "string" ? raw : null;
  } catch {
    return null;
  }
}
