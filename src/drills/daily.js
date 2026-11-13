// Job: the daily drill's rules (PRD G5: seed = the local date as YYYYMMDD, 2 minutes, general
// pack). Pure: dates and round states in, numbers and lines out. The same seed gives the same
// words in the same order to everyone today; nothing is fetched and nothing is shared.

/** The daily drill's time limit, active play only (pausing stops the clock). */
export const DAILY_MS = 120_000;
/** One live-region warning before time runs out. */
export const WARN_MS = 30_000;

/** The daily drill's live lines (daily copy table). */
export const DAILY_SAY = Object.freeze({
  start: "Daily drill: two minutes. Same words for everyone today.",
  warn: "30 seconds left.",
  end: "Time's up.",
});

/** 20261113 for Nov 13 2026, in the player's own time zone. */
export const dailySeed = (d = new Date()) =>
  d.getFullYear() * 10_000 + (d.getMonth() + 1) * 100 + d.getDate();

/** Milliseconds left in a daily round, never below 0. */
export const timeLeft = (state) => Math.max(0, DAILY_MS - (state.activeMs ?? 0));

/**
 * Watch one daily round's clock. Call it after every frame: it says the warning once, then ends
 * the round once, the moment active play reaches the limit.
 * @returns {(state: object) => { say: string|null, end: boolean }}
 */
export function createWatch() {
  let warned = false;
  let done = false;
  return (state) => {
    if (done || state.ended) return { say: null, end: false };
    const left = timeLeft(state);
    if (left === 0) {
      done = true;
      return { say: DAILY_SAY.end, end: true };
    }
    if (!warned && left <= WARN_MS) {
      warned = true;
      return { say: DAILY_SAY.warn, end: false };
    }
    return { say: null, end: false };
  };
}

/**
 * The best daily drill speed from today, or null.
 * @param {{ mode: string, date: number, wpm: number }[]} rounds
 * @param {Date} now
 */
export function todayBest(rounds, now = new Date()) {
  const today = dailySeed(now);
  let best = null;
  for (const r of rounds ?? []) {
    if (r?.mode !== "daily" || dailySeed(new Date(r.date)) !== today) continue;
    if (Number.isFinite(r.wpm) && (best === null || r.wpm > best)) best = r.wpm;
  }
  return best === null ? null : Math.round(best);
}
