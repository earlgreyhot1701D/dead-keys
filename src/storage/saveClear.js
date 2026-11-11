// Write and remove the saved Progress (requirements.md, Req 5). Split from store.js at the line
// cap. Storage is passed in and every call to it sits in try/catch; nothing here draws or confirms.
import { validate } from "../../contract/validate.js";
import { freshProgress } from "./migrate.js";
import { CORRUPT_KEY, KEY } from "./store.js";
import { vet } from "./vet.js";

/**
 * @typedef {import("./store.js").Storage} Storage
 * @typedef {import("./notices.js").NoticeId} NoticeId
 */

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

/**
 * Write the whole Progress to `deadkeys:v1`. Progress that fails the contract or the vet checks is
 * never written (the earlier save stays safe): `reason` is "invalid", which means a bug, not a
 * full disk. A missing or throwing storage gives `reason` "storage". Either way the notice is
 * `saveFailed` and the game keeps running in memory.
 * @param {Storage} storage
 * @param {import("../../contract/types.js").Progress} progress
 * @returns {{ notice: null } | { notice: NoticeId, reason: "invalid" | "storage" }}
 */
export function save(storage, progress) {
  let text;
  try {
    if (validate("Progress", progress).status !== "valid" || vet(progress).length > 0) {
      return { notice: "saveFailed", reason: "invalid" };
    }
    text = JSON.stringify(progress);
  } catch {
    return { notice: "saveFailed", reason: "invalid" };
  }
  if (!usable(storage) || !attempt(() => storage.setItem(KEY, text))) {
    return { notice: "saveFailed", reason: "storage" };
  }
  return { notice: null };
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
  const progress = freshProgress(now);
  if (!usable(storage)) return { progress, notice: "blocked", persist: false };
  const a = attempt(() => storage.removeItem(KEY));
  const b = attempt(() => storage.removeItem(CORRUPT_KEY)); // tried even if the first failed
  return a && b
    ? { progress, notice: null, persist: true }
    : { progress, notice: "blocked", persist: false };
}
