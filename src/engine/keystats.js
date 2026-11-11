// Merge one finished round's key deltas into the saved per-key stats. Pure; never changes input.

const whole = (n) => Number.isInteger(n) && n >= 0;

/**
 * Add each key's attempts and misses from `result.keyDeltas`, and set `lastSeen` to the round's
 * date for the keys in it. Other keys are copied unchanged. Existing keys keep their place; new
 * keys come after them in key order, so the same input always gives the same output.
 * Totals and `lastSeen` (the later of the saved date and the round's) come out the same however
 * rounds are grouped or ordered.
 * @param {import("../../contract/types.js").KeyStat[]} keys Saved stats, one per key.
 * @param {import("../../contract/types.js").RoundResult} result A finished round.
 * @returns {import("../../contract/types.js").KeyStat[]}
 * @throws {TypeError|RangeError} If the stats or the round are malformed (programmer error).
 */
export function mergeRound(keys, result) {
  const deltas = result?.keyDeltas;
  if (!Array.isArray(keys)) throw new TypeError("keys must be an array");
  if (typeof deltas !== "object" || deltas === null || Array.isArray(deltas)) {
    throw new TypeError("result.keyDeltas must be an object");
  }
  if (!whole(result.date)) throw new RangeError(`bad round date ${result.date}`);
  const merged = new Map();
  for (const k of keys) {
    if (merged.has(k.key)) throw new RangeError(`duplicate key "${k.key}" in saved stats`);
    merged.set(k.key, { ...k });
  }
  for (const key of Object.keys(deltas).sort()) {
    const d = deltas[key];
    if (!whole(d?.attempts) || !whole(d?.misses) || d.misses > d.attempts) {
      throw new RangeError(`bad key delta for "${key}"`);
    }
    const old = merged.get(key);
    merged.set(key, {
      key,
      attempts: (old?.attempts ?? 0) + d.attempts,
      misses: (old?.misses ?? 0) + d.misses,
      lastSeen: Math.max(old?.lastSeen ?? 0, result.date),
    });
  }
  return [...merged.values()];
}
