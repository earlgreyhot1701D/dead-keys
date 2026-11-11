// Personal bests and milestones (PRD G5: Milestones). Pure; never changes input.
// Nothing here ever awards, labels or reports anything for getting slower.
import {
  BEST_ACCURACY,
  STREAK_ACCURACY,
  STREAK_DAYS,
  STREAK_ROUNDS,
  WPM_BAND,
} from "./progressConfig.js";

const whole = (n) => Number.isInteger(n) && n >= 0;
const WPM_CAP = 1000; // no real typist is this fast; it keeps the band loop bounded on bad data

/** Throw unless `r` has what these functions read from a round. */
function checkRound(r) {
  const ok =
    typeof r?.mode === "string" &&
    r.mode !== "" &&
    Number.isFinite(r.wpm) &&
    r.wpm >= 0 &&
    r.accuracy >= 0 &&
    r.accuracy <= 1 &&
    whole(r.date);
  if (!ok) throw new RangeError("a round needs a mode, wpm, accuracy from 0 to 1, and a date");
}

/**
 * Update the personal bests with one finished round. A best is the highest WPM per mode, from
 * rounds at BEST_ACCURACY or better, so speed never beats accuracy. Practice never sets one
 * (it is untimed by design), a round with no speed (0 WPM) never sets one, and a tie is not a
 * new best.
 * @param {Object<string, { wpm: number, date: number }>} bests Saved bests, by mode.
 * @param {import("../../contract/types.js").RoundResult} result A finished round.
 * @returns {{ bests: Object<string, { wpm: number, date: number }>, newBest: boolean }}
 *   When there is no new best, `bests` is the very object passed in.
 * @throws {TypeError|RangeError} If the bests or the round are malformed (programmer error).
 */
export function updateBests(bests, result) {
  if (typeof bests !== "object" || bests === null || Array.isArray(bests)) {
    throw new TypeError("bests must be an object");
  }
  checkRound(result);
  const old = Object.hasOwn(bests, result.mode) ? bests[result.mode] : undefined;
  const qualifies =
    result.mode !== "practice" &&
    result.accuracy >= BEST_ACCURACY &&
    result.wpm > 0 &&
    (old === undefined || result.wpm > old.wpm);
  if (!qualifies) return { bests, newBest: false };
  return {
    bests: { ...bests, [result.mode]: { wpm: result.wpm, date: result.date } },
    newBest: true,
  };
}

/** Whole days for "YYYY-MM-DD" (civil-days arithmetic, no clock). Throws on a bad date. */
function dayNumber(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new RangeError(`bad day "${s}"`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const inMonth = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
  if (!(d >= 1 && d <= inMonth)) throw new RangeError(`bad day "${s}"`);
  const yy = mo <= 2 ? y - 1 : y;
  const era = Math.floor(yy / 400);
  const yoe = yy - era * 400;
  const doy = Math.floor((153 * ((mo + 9) % 12) + 2) / 5) + d - 1;
  return era * 146097 + yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
}

/** True if the ascending, unique day numbers hold `n` days in a row. */
function hasRun(days, n) {
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    if (run >= n) return true;
  }
  return false;
}

/**
 * Milestones earned that the player does not have yet, worked out from the whole history, so
 * calling it twice never awards a card twice. `progress` is the saved progress; `result` is the
 * round that just finished (it is used even if `progress.rounds` already holds it).
 * Awards: each WPM band reached (10, 20, 30 ...; practice excluded), 3 rounds in a row at 95%+,
 * 7 local days in a row with a round (practice counts), and each lesson in `lessonsPassed`.
 * @param {import("../../contract/types.js").Progress} progress
 * @param {import("../../contract/types.js").RoundResult} result
 * @param {string} localDay The player's local day for `result`, "YYYY-MM-DD".
 * @param {(ms: number) => string} dayOf The player's local day for an earlier round's date.
 * @returns {import("../../contract/types.js").Milestone[]}
 * @throws {TypeError|RangeError} If the input is malformed (programmer error).
 */
export function newMilestones(progress, result, localDay, dayOf) {
  const lists = [progress?.rounds, progress?.milestones, progress?.lessonsPassed];
  if (!lists.every(Array.isArray))
    throw new TypeError("progress needs rounds, milestones, lessonsPassed");
  if (typeof dayOf !== "function") throw new TypeError("dayOf must be a function");
  checkRound(result);
  const past = progress.rounds.filter((r) => r.id !== result.id);
  past.forEach(checkRound);
  const rounds = [...past.map((r) => ({ ...r, day: dayOf(r.date) })), { ...result, day: localDay }]
    .sort((a, b) => a.date - b.date) // stable: same-date rounds keep their saved order
    .map((r) => ({ ...r, dayNo: dayNumber(r.day) }));
  const earned = [];
  const timed = rounds.filter((r) => r.mode !== "practice").map((r) => r.wpm);
  const top = Math.min(Math.max(0, ...timed), WPM_CAP);
  for (let w = WPM_BAND; w <= top; w += WPM_BAND) {
    earned.push({ id: `wpm-${w}`, kind: "wpm-band", threshold: w, label: `${w} words per minute` });
  }
  let run = 0;
  let streak = false;
  for (const r of rounds) {
    run = r.accuracy >= STREAK_ACCURACY ? run + 1 : 0;
    streak = streak || run >= STREAK_ROUNDS;
  }
  if (streak) {
    const pct = Math.round(STREAK_ACCURACY * 100);
    const label = `${STREAK_ROUNDS} rounds in a row at ${pct}% accuracy or better`;
    earned.push({
      id: `acc-streak-${STREAK_ROUNDS}`,
      kind: "accuracy-streak",
      threshold: STREAK_ROUNDS,
      label,
    });
  }
  const days = [...new Set(rounds.map((r) => r.dayNo))].sort((a, b) => a - b);
  if (hasRun(days, STREAK_DAYS)) {
    const label = `${STREAK_DAYS} days in a row`;
    earned.push({
      id: `day-streak-${STREAK_DAYS}`,
      kind: "day-streak",
      threshold: STREAK_DAYS,
      label,
    });
  }
  for (const l of progress.lessonsPassed) {
    const label = `Lesson ${l.lessonId} passed`;
    earned.push({ id: `lesson-${l.lessonId}`, kind: "lesson-passed", threshold: null, label });
  }
  const seen = new Set(progress.milestones.map((m) => m.id));
  return earned.filter((m) => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}
