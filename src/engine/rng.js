// Seeded random numbers (mulberry32). State is a plain number, so a round can be copied.

/**
 * Step the generator. Pure: the same state always gives the same value and next state.
 * @param {number} state A whole number from 0 to 2^32 - 1.
 * @returns {{ value: number, state: number }} value is at least 0 and less than 1.
 */
function next(state) {
  const s = (state + 0x6d2b79f5) >>> 0;
  let t = Math.imul(s ^ (s >>> 15), s | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: s };
}

/**
 * Start a generator. Same seed, same sequence. Use `next(state)` to draw a number.
 * @param {number} seed A finite number; it is cut to a whole 32-bit value.
 * @returns {{ state: number, next: (state: number) => { value: number, state: number } }}
 */
export function createRng(seed) {
  if (typeof seed !== "number" || !Number.isFinite(seed)) {
    throw new TypeError("createRng needs a finite number as a seed");
  }
  return { state: seed >>> 0, next };
}
