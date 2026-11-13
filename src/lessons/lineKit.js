// Job: the shared pieces a lesson line is built from: a seeded random function, picking, and
// filling one line with items one space apart, never past MAX_LINE (lessons Req 2.3).
import { createRng } from "../engine/rng.js";

export const MAX_LINE = 28;

/** A random-number function from a seed: each call gives the next value, 0 to below 1. */
export function randomFrom(seed) {
  const rng = createRng(seed);
  let state = rng.state;
  return () => {
    const r = rng.next(state);
    state = r.state;
    return r.value;
  };
}
export const pick = (rand, list) => list[Math.floor(rand() * list.length)];
export const size = (rand) => 2 + Math.floor(rand() * 3); // 2 to 4 keys

/**
 * Fill one line with items, one space apart, never past MAX_LINE. With `spare`, the last 2 to 4
 * places get a short pattern, so a pattern line ends at exactly MAX_LINE.
 */
export function fill(item, spare = null) {
  let line = "";
  for (let i = 0, misses = 0; misses < 40; i++) {
    const room = MAX_LINE - line.length - (line ? 1 : 0);
    if (room < 2) break;
    const next = spare && room <= 4 ? spare(room) : item(i);
    if (next.length <= room) line = line ? `${line} ${next}` : next;
    else misses++;
  }
  return line;
}
