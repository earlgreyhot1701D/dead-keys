// Load, save and clear the one saved Progress (requirements.md, Req 2 and 5). Storage is passed in
// (the browser's localStorage, or a stand-in in tests), every call to it sits in try/catch, and
// nothing here draws, confirms or reads a clock. Functions return a notice id (see notices.js) or
// null; the screen draws it.
import { CURRENT_SCHEMA_VERSION } from "../../contract/types.js";
import { validate } from "../../contract/validate.js";
import { migrate } from "./migrate.js";
import { vet } from "./vet.js";

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

function checkNow(now) {
  if (!Number.isInteger(now) || now < 0) throw new TypeError("now must be a whole number");
}

/**
 * A new, empty Progress (design decision 5).
 * @param {number} now Milliseconds, for `createdAt`.
 * @returns {import("../../contract/types.js").Progress}
 * @throws {TypeError} If `now` is not a whole number (programmer error).
 */
export function freshProgress(now) {
  checkNow(now);
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    rounds: [],
    keys: [],
    bests: {},
    dayStreak: { lastDay: null, count: 0 },
    lessonsPassed: [],
    milestones: [],
    settings: {},
    ghosts: [],
  };
}

/**
 * Write the whole Progress to `deadkeys:v1`. A Progress that fails the contract or the vet checks
 * is never written (the earlier save stays safe) and counts as a failed save. A throwing storage
 * (full, blocked) also gives the `saveFailed` notice; the game keeps running in memory.
 * @param {Storage} storage
 * @param {import("../../contract/types.js").Progress} progress
 * @returns {{ notice: NoticeId | null }}
 */
export function save(storage, progress) {
  if (!usable(storage)) return { notice: "saveFailed" };
  let text;
  try {
    if (validate("Progress", progress).status !== "valid" || vet(progress).length > 0) {
      return { notice: "saveFailed" };
    }
    text = JSON.stringify(progress);
  } catch {
    return { notice: "saveFailed" };
  }
  return { notice: attempt(() => storage.setItem(KEY, text)) ? null : "saveFailed" };
}

/**
 * Read the saved Progress. `persist` is false when the app must not write: storage is blocked, or
 * the save is from a newer version (never overwritten). In every case `progress` is usable.
 * - nothing saved: fresh, no notice
 * - saved and good: used as is
 * - older version: upgraded, checked and saved, no notice
 * - newer version: left alone, fresh in memory, `newer`
 * - damaged (not JSON, fails the contract or the vet checks, or cannot be upgraded): the raw text
 *   is copied to `deadkeys:v1:corrupt`, fresh progress replaces it, `corrupt`
 * - if that copy cannot be written, nothing is touched, fresh in memory, `blocked`
 * - storage missing or throwing: fresh in memory, `blocked`
 * @param {Storage} storage
 * @param {number} now Milliseconds, for a fresh `createdAt`.
 * @returns {{ progress: import("../../contract/types.js").Progress, notice: NoticeId | null, persist: boolean }}
 * @throws {TypeError} If `now` is not a whole number (programmer error).
 */
export function load(storage, now) {
  checkNow(now);
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
  if (isJson && isObj(parsed) && Number.isInteger(parsed.schemaVersion)) {
    if (parsed.schemaVersion > CURRENT_SCHEMA_VERSION) {
      return { progress: freshProgress(now), notice: "newer", persist: false };
    }
  }
  const result = isJson ? migrate(parsed, now) : { ok: false };
  if (result.ok) {
    if (parsed.schemaVersion === CURRENT_SCHEMA_VERSION) {
      return { progress: result.progress, notice: null, persist: true };
    }
    return {
      progress: result.progress,
      notice: save(storage, result.progress).notice,
      persist: true,
    };
  }
  // Damaged. Keep the raw text first; if that fails, leave the original alone rather than lose it.
  if (!attempt(() => storage.setItem(CORRUPT_KEY, raw))) return blocked();
  const progress = freshProgress(now);
  save(storage, progress); // replace the damaged save so the notice is not shown on every load
  return { progress, notice: "corrupt", persist: true };
}

/**
 * Remove the save and the corrupt copy, and return fresh progress. The confirm step is the
 * screen's job. If storage refuses, `blocked` and `persist` false: the old data may still be there.
 * @param {Storage} storage
 * @param {number} now
 * @returns {{ progress: import("../../contract/types.js").Progress, notice: NoticeId | null, persist: boolean }}
 * @throws {TypeError} If `now` is not a whole number (programmer error).
 */
export function clear(storage, now) {
  checkNow(now);
  const progress = freshProgress(now);
  if (!usable(storage)) return { progress, notice: "blocked", persist: false };
  const a = attempt(() => storage.removeItem(KEY));
  const b = attempt(() => storage.removeItem(CORRUPT_KEY)); // tried even if the first failed
  return a && b
    ? { progress, notice: null, persist: true }
    : { progress, notice: "blocked", persist: false };
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
