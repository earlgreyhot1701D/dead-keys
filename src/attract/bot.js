// Job: the attract demo's typist (attract Req 2). Pure: a real round's state in, the next key
// out. It types the locked word, or locks the word nearest to danger, one key every BOT_KEY_MS,
// and never misses. Its words stay out from behind the title panel (keepClear). It plays the real engine, so the demo is the game, not a movie of it.
import { tick } from "../engine/lifecycle.js";
import { createRound, key } from "../engine/round.js";

/** Idle time on the title screen before the demo starts. PRD said about 15 s; Shara cut it to 3 s
 *  (Nov 13), because the moving game explains itself better than any line of text. */
export const IDLE_MS = 3_000;
/** One key every this many ms: about 48 WPM, a good typist, not a superhuman one. */
export const BOT_KEY_MS = 250;
/** Each demo round runs this long, then the next starts on the other layout. */
export const DEMO_ROUND_MS = 25_000;
/** The demo skips the warm-up and runs a bit fast, so the screen fills at once (Shara, Nov 13:
 *  the slow warm-up made the demo look empty). */
export const DEMO_SPEED = 1.5;
/** Falling-words lanes the title panel covers, fully or at a card's edge (measured at 1440x900:
 *  the panel spans x 380 to 1060). The demo keeps its words in the outer lanes 0 and 5. */
export const DEMO_HIDDEN_SLOTS = Object.freeze([1, 2, 3, 4]);
const SIDE_SLOTS = [0, 5];
/** The demo plays Falling words only. The PRD said alternate the two games, but Four corners
 *  moves every word toward the center, behind the title panel (Shara, Nov 13). */
export const DEMO_MECHANICS = Object.freeze(["falling"]);

/** The key the bot presses next, or null when no word is on screen. */
export function botKey(state) {
  const locked = state.targets.find((t) => t.id === state.lockId);
  if (locked) return [...locked.text][locked.typed] ?? null;
  let next = null;
  for (const t of state.targets) if (!next || t.progress > next.progress) next = t;
  return next ? [...next.text][0] : null;
}

/** A fresh demo round on one layout: no warm-up, DEMO_SPEED. */
export function demoRound(mechanic, items, seed) {
  const { state } = createRound({ mode: mechanic, mechanic, items, seed, speed: DEMO_SPEED });
  return { ...state, warmup: 0 };
}

/**
 * Falling words only: a word that spawned behind the title panel moves to a free side lane, or
 * leaves if none is free. Only untouched words move, so nothing the bot is typing jumps.
 */
export function keepClear(state) {
  if (state.mechanic !== "falling") return state;
  const hidden = (t) =>
    DEMO_HIDDEN_SLOTS.includes(t.slot) && t.typed === 0 && t.id !== state.lockId;
  if (!state.targets.some(hidden)) return state;
  const taken = new Set(state.targets.filter((t) => !hidden(t)).map((t) => t.slot));
  const targets = [];
  for (const t of state.targets) {
    if (!hidden(t)) {
      targets.push(t);
      continue;
    }
    const slot = SIDE_SLOTS.find((x) => !taken.has(x));
    if (slot === undefined) continue; // no room on the sides: the word leaves
    taken.add(slot);
    targets.push({ ...t, slot });
  }
  return { ...state, targets };
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
  r = { ...r, state: keepClear(r.state) };
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
  const s = keepClear(r.state); // a key that clears a word can spawn the next one
  return { state: s, events, done: s.ended || s.held || s.activeMs >= DEMO_ROUND_MS };
}
