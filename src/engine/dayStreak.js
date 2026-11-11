// The saved day streak: days in a row with at least one round (split from milestones.js at the
// line cap). Pure; days are "YYYY-MM-DD" strings passed in, so no clock and no time zone here.

const whole = (n) => Number.isInteger(n) && n >= 0;

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

/**
 * Move the saved day streak forward for a round played on `localDay`. The same day keeps the
 * count, the next day adds 1, a gap resets it to 1, and an earlier day (a clock or time zone
 * change) changes nothing. Practice counts, so call it for every round.
 * @param {{ lastDay: string|null, count: number }} dayStreak
 * @param {string} localDay The player's local day, "YYYY-MM-DD".
 * @returns {{ lastDay: string|null, count: number }} The same object when nothing changes.
 * @throws {TypeError|RangeError} If either argument is malformed (programmer error).
 */
export function updateDayStreak(dayStreak, localDay) {
  const today = dayNumber(localDay);
  const ok =
    whole(dayStreak?.count) &&
    (dayStreak.lastDay === null || typeof dayStreak.lastDay === "string");
  if (!ok) throw new TypeError("dayStreak needs a lastDay (string or null) and a count");
  if (dayStreak.lastDay === null) return { lastDay: localDay, count: 1 };
  const gap = today - dayNumber(dayStreak.lastDay);
  if (gap <= 0) return dayStreak;
  return { lastDay: localDay, count: gap === 1 ? dayStreak.count + 1 : 1 };
}
