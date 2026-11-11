// Fold one finished round into Progress (requirements.md, Req 4; design decision 8). Pure; never
// changes its input. Storage vets saved data on load, so this gets input that already passed.
import { updateDayStreak } from "./dayStreak.js";
import { mergeRound } from "./keystats.js";
import { newMilestones, updateBests } from "./milestones.js";

/** Rounds kept in Progress. Matches `maxItems` of `rounds` in contract/schemas/progress.json. */
export const MAX_ROUNDS = 200;

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
 * @returns {import("../../contract/types.js").Progress}
 * @throws {TypeError|RangeError} If an input is malformed, or the round is already in
 *   `progress.rounds` (recording it twice would count its keys twice). Programmer errors.
 */
export function record(progress, result, localDay) {
  if (typeof progress !== "object" || progress === null || !Array.isArray(progress.rounds)) {
    throw new TypeError("progress needs a rounds list");
  }
  if (progress.rounds.some((r) => r?.id === result?.id)) {
    throw new RangeError(`round "${result?.id}" is already recorded`);
  }
  const keys = mergeRound(progress.keys, result);
  const { bests } = updateBests(progress.bests, result);
  const dayStreak = updateDayStreak(progress.dayStreak, localDay);
  const updated = { ...progress, keys, bests, dayStreak };
  const earned = newMilestones(updated, result, localDay);
  return {
    ...updated,
    rounds: [...progress.rounds, result].slice(-MAX_ROUNDS),
    milestones: [...progress.milestones, ...earned],
  };
}
