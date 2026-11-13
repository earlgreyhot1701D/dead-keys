// Fold one finished round into Progress (requirements.md, Req 4; design decision 8). Pure; never
// changes its input. Storage vets saved data on load, so this gets input that already passed.
import { updateDayStreak } from "./dayStreak.js";
import { mergeRound } from "./keystats.js";
import { newMilestones, updateBests } from "./milestones.js";

/** Rounds kept in Progress. Matches `maxItems` of `rounds` in contract/schemas/progress.json. */
export const MAX_ROUNDS = 200;
/** How a lesson can be passed (contract/schemas/progress.json, lessonsPassed.how). */
const HOWS = Object.freeze(["lesson", "testout"]);

/**
 * Merge the key stats, update the bests, move the day streak (every round, practice included),
 * add the milestones now earned, then append the round and drop the oldest past 200. The order
 * matters: milestones read the updated streak and the lessons already in `lessonsPassed`.
 * If no new best is set, `bests` in the result is the same object as in `progress`, so the
 * results screen can tell a new best by `after.bests !== before.bests`; new milestones are
 * `after.milestones.slice(before.milestones.length)`.
 * @param {import("../../contract/types.js").Progress} progress
 * @param {import("../../contract/types.js").RoundResult} result A finished round, passing the contract.
 * @param {string} localDay The player's local day for the round, "YYYY-MM-DD".
 * @param {{ lessonId: string, how: "lesson"|"testout" } | null} [pass] A lesson passed by this
 *   round (lessons Req 4.4). It joins `lessonsPassed` before the milestones are worked out, once
 *   per lesson: a lesson already there (passed or tested out) adds nothing.
 * A round already in `progress.rounds` (same id) is ignored and `progress` comes back unchanged,
 * so a results screen that fires twice cannot crash or count a round's keys twice. The round is
 * stored as a copy, so the caller's object and the saved one share nothing.
 * @returns {import("../../contract/types.js").Progress}
 * @throws {TypeError|RangeError} If an input is malformed (programmer error).
 */
export function record(progress, result, localDay, pass = null) {
  if (typeof progress !== "object" || progress === null || !Array.isArray(progress.rounds)) {
    throw new TypeError("progress needs a rounds list");
  }
  if (typeof result?.id !== "string" || result.id === "") {
    throw new TypeError("the round needs an id");
  }
  const goodPass =
    pass === null ||
    (typeof pass?.lessonId === "string" && pass.lessonId !== "" && HOWS.includes(pass.how));
  if (!goodPass) throw new TypeError("a pass needs a lessonId and how (lesson or testout)");
  if (progress.rounds.some((r) => r?.id === result.id)) return progress;
  const keys = mergeRound(progress.keys, result);
  const { bests } = updateBests(progress.bests, result);
  const dayStreak = updateDayStreak(progress.dayStreak, localDay);
  const isNew = pass && !progress.lessonsPassed.some((l) => l.lessonId === pass.lessonId);
  const lessonsPassed = isNew
    ? [...progress.lessonsPassed, { lessonId: pass.lessonId, how: pass.how }]
    : progress.lessonsPassed;
  const updated = { ...progress, keys, bests, dayStreak, lessonsPassed };
  const earned = newMilestones(updated, result, localDay);
  return {
    ...updated,
    rounds: [...progress.rounds, structuredClone(result)].slice(-MAX_ROUNDS),
    milestones: [...progress.milestones, ...earned],
  };
}
