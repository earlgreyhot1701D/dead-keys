// Job: the attract demo's typist (attract Req 2). Pure: a real round's state in, the next key
// out. It types the locked word, or locks the word nearest to danger, one key every BOT_KEY_MS,
// and never misses. It plays the real engine, so the demo is the game, not a movie of it.
import { tick } from "../engine/lifecycle.js";
import { createRound, key } from "../engine/round.js";

/** Idle time on the title screen before the demo starts (PRD: about 15 seconds). */
export const IDLE_MS = 15_000;
/** One key every this many ms: about 48 WPM, a good typist, not a superhuman one. */
export const BOT_KEY_MS = 250;
/** Each demo round runs this long, then the next starts on the other layout. */
export const DEMO_ROUND_MS = 40_000;
/** The demo alternates the two games (PRD: alternating mechanics). */
export const DEMO_MECHANICS = Object.freeze(["falling", "corners"]);

/** The key the bot presses next, or null when no word is on screen. */
export function botKey(state) {
  const locked = state.targets.find((t) => t.id === state.lockId);
  if (locked) return [...locked.text][locked.typed] ?? null;
  let next = null;
  for (const t of state.targets) if (!next || t.progress > next.progress) next = t;
  return next ? [...next.text][0] : null;
}

/** A fresh demo round on one layout. */
export function demoRound(mechanic, items, seed) {
  return createRound({ mode: mechanic, mechanic, items, seed, speed: 1 }).state;
}

/**
 * Move a demo round on by `dt`, pressing keys as they fall due.
 * @param {object} state
 * @param {number} dt Milliseconds.
 * @param {{ wait: number }} clock The bot's time to its next key (changed in place).
 * @returns {{ state: object, events: object[], done: boolean }} `done`: start the next round.
 */
export function demoStep(state, dt, clock) {
  let r = tick(state, dt);
  const events = [...r.events];
  clock.wait -= dt;
  if (clock.wait <= 0) {
    clock.wait = BOT_KEY_MS;
    const c = botKey(r.state);
    if (c) {
      r = key(r.state, c);
      events.push(...r.events);
    }
  }
  const s = r.state;
  return { state: s, events, done: s.ended || s.held || s.activeMs >= DEMO_ROUND_MS };
}
