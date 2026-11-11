// Backup text out and in (requirements.md, Req 6; design decision 6). Pure: no storage, so a failed
// import cannot change anything. The screen confirms before it saves what import returns.
import { validate } from "../../contract/validate.js";
import { migrate } from "./migrate.js";
import { vet } from "./vet.js";

/** The biggest backup text import accepts, in UTF-8 bytes. */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

const bytes = (s) => new TextEncoder().encode(s).length;

/**
 * Backup text for the Settings download. Compact JSON (the ghosts alone could pass 2 MB if it
 * were indented), so what export makes is always something import accepts.
 * @param {import("../../contract/types.js").Progress} progress
 * @returns {string}
 * @throws {RangeError} If the progress fails the contract or the vet checks, or the text would be
 *   over the import limit. Either is a bug upstream, and a backup that cannot be restored is worse
 *   than none.
 */
export function exportText(progress) {
  if (validate("Progress", progress).status !== "valid" || vet(progress).length > 0) {
    throw new RangeError("progress is not valid, so it cannot be exported");
  }
  const text = JSON.stringify(progress);
  if (bytes(text) > MAX_IMPORT_BYTES) throw new RangeError("progress is too large to export");
  return text;
}

/**
 * Read a backup. The size is checked on the string first (UTF-8 bytes), then it is parsed with
 * `JSON.parse` only, upgraded if older, and checked with the contract and the vet checks. Nothing
 * is saved or changed; on success the screen confirms before saving the returned progress.
 * `reason` is plain words for the screen, with nothing from inside the file in it.
 * @param {unknown} text The file's text.
 * @param {number} now Milliseconds, for the fresh `createdAt` of an upgraded backup.
 * @returns {{ ok: true, progress: import("../../contract/types.js").Progress } | { ok: false, reason: string }}
 * @throws {TypeError} If `now` is not a whole number (programmer error).
 */
export function importText(text, now) {
  if (!Number.isInteger(now) || now < 0) throw new TypeError("now must be a whole number");
  const fail = (reason) => ({ ok: false, reason });
  if (typeof text !== "string") return fail("That isn't a text file.");
  // A UTF-8 byte count is never below the string's length, so a long string is refused unmeasured.
  if (text.length > MAX_IMPORT_BYTES || bytes(text) > MAX_IMPORT_BYTES) {
    return fail("That file is too big to be a Dead Keys backup. The limit is 2 MB.");
  }
  let value;
  try {
    value = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text); // allow a BOM
  } catch {
    return fail("That file isn't a Dead Keys backup. It isn't valid JSON.");
  }
  const result = migrate(value, now);
  if (result.ok) return result;
  if (result.reason.startsWith("saved by a newer version")) {
    return fail(
      "That backup was made by a newer version of Dead Keys. Refresh to get the latest version, then try again.",
    );
  }
  return fail("That file isn't a valid Dead Keys backup, or it is damaged.");
}
