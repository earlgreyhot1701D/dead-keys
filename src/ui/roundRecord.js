// Record a finished round (play Req 7.1), split from app.js like backup.js. app.js hands in the
// pieces this needs; storage is reached only through `persistNow`, which never writes while
// `persist` is false. Every failure is a result, never a crash: the round is still shown.
import { validate } from "../../contract/validate.js";
import { record } from "../engine/record.js";
import { findGhost, ghostFrom, saveGhost } from "../ghost/ghost.js";

/**
 * The player's local day, "YYYY-MM-DD", from their own clock.
 * @param {number} ms Epoch milliseconds.
 */
export function localDay(ms) {
  const d = new Date(ms);
  const two = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

/**
 * @param {object} io
 * @param {() => { progress: any }} io.getState
 * @param {(progress: any, patch?: object) => void} io.adopt Make this the app's progress.
 * @param {(progress: any) => boolean} io.persistNow Save if saving is allowed.
 * @param {(patch: object) => void} io.set Change the app state.
 */
export function createRoundRecord({ getState, adopt, persistNow, set }) {
  return {
    /**
     * Fold the round into progress and save it. Returns what the results screen shows.
     * @param {import("../../contract/types.js").RoundResult} result
     * @param {string} day The player's local day, "YYYY-MM-DD".
     * @param {{ lessonId: string, how: "lesson"|"testout" } | null} [pass] A lesson this round
     *   passed (lessons Req 4.4), handed to `record`.
     * @param {object[] | null} [keystrokes] The round's keystrokes: a new best in a ghost mode
     *   saves them as that mode's ghost (ghost Req 1).
     * @returns {{ recorded: boolean, saved: boolean, newBest: { wpm: number, old: number|null } | null,
     *   milestones: import("../../contract/types.js").Milestone[], previous: any }}
     *   `previous` is the player's last round in the same mode before this one, or null.
     *   `ghost`: the wpm of the ghost raced (or null) and whether a new ghost was saved.
     */
    finishRound(result, day, pass = null, keystrokes = null) {
      const before = getState().progress;
      const previous = before.rounds.findLast((r) => r.mode === result?.mode) ?? null;
      const none = { recorded: false, saved: false, newBest: null, milestones: [], previous };
      let after;
      try {
        if (validate("RoundResult", result).status !== "valid") throw new TypeError("bad round");
        after = record(before, result, day, pass);
      } catch {
        set({ notice: "saveFailed" }); // a bug, not the player's doing: the round still shows
        return none;
      }
      if (after === before) return none; // the same round twice: counted once (record.js)
      const raced = findGhost(before, result.mode, result.packId);
      const ghost = after.bests !== before.bests && ghostFrom(result, keystrokes);
      if (ghost) after = saveGhost(after, ghost); // a new best becomes the ghost to race
      adopt(after);
      const old = before.bests[result.mode];
      return {
        recorded: true,
        saved: persistNow(after),
        newBest: after.bests === before.bests ? null : { wpm: result.wpm, old: old?.wpm ?? null },
        milestones: after.milestones.slice(before.milestones.length),
        previous,
        ghost: { raced: raced?.wpm ?? null, saved: !!ghost },
      };
    },
  };
}
