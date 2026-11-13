// Weighted picking for drills (drills Req 2; design: one random number, as today). Split from
// targets.js and round.js at the line cap. Pure.

/**
 * Copy a round's items, each with its drill weight when weights are given (one per item, same
 * order, each finite and above 0). Without weights the copies are exactly the items.
 * @param {{ id: string, text: string }[]} items
 * @param {number[]} [weights]
 * @returns {{ id: string, text: string, weight?: number }[]}
 * @throws {TypeError|RangeError} On weights that don't match the items (programmer error).
 */
export function withWeights(items, weights) {
  if (weights === undefined) return items.map((i) => ({ ...i }));
  if (!Array.isArray(weights) || weights.length !== items.length) {
    throw new TypeError("weights must be an array with one weight per item");
  }
  if (!weights.every((w) => Number.isFinite(w) && w > 0)) {
    throw new RangeError("every weight must be a finite number above 0");
  }
  return items.map((i, k) => ({ ...i, weight: weights[k] }));
}

/**
 * Pick one item from `pool` with one random value from 0 to below 1. Items with no weight are
 * picked uniformly, exactly as before Block 9; weighted items by walking the pool until the
 * running sum of weights passes value x total.
 * @param {{ weight?: number }[]} pool Not empty.
 * @param {number} value
 */
export function pickFrom(pool, value) {
  if (pool[0].weight === undefined) return pool[Math.floor(value * pool.length)];
  const total = pool.reduce((sum, it) => sum + it.weight, 0);
  let left = value * total;
  for (const it of pool) {
    left -= it.weight;
    if (left < 0) return it;
  }
  return pool[pool.length - 1]; // value x total rounded up to the total
}
