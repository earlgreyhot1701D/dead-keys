// Item weights for a built-in drill (PRD G5 "Weighted sampling"; drills Req 1). Pure: no DOM, no
// storage. A word's weight is the sum, over its characters, of that key's miss rate plus
// DRILL_BASE, so words full of keys the player misses come up more often.
import { MIN_KEY_ATTEMPTS } from "../engine/progressConfig.js";

/** Added to every character's miss rate, so unseen and steady keys still count (PRD G5). */
export const DRILL_BASE = 0.05;

/**
 * Miss rate per key, matched exactly as the heat map matches (the stat's `key` is the expected
 * character, case and all). Keys under MIN_KEY_ATTEMPTS attempts are left out: they count as 0.
 * @param {{ key: string, attempts: number, misses: number }[]} keyStats
 * @returns {Map<string, number>}
 */
export function missRates(keyStats) {
  const rates = new Map();
  for (const s of keyStats ?? []) {
    const ok = Number.isInteger(s?.attempts) && Number.isInteger(s?.misses);
    if (!ok || s.attempts < MIN_KEY_ATTEMPTS || s.misses < 0 || s.misses > s.attempts) continue;
    rates.set(s.key, s.misses / s.attempts);
  }
  return rates;
}

/**
 * One weight per item, in order: the sum over its characters of (miss rate + DRILL_BASE).
 * Every weight is finite and above 0 for any item with text.
 * @param {{ text: string }[]} items
 * @param {{ key: string, attempts: number, misses: number }[]} keyStats Saved key stats.
 * @returns {number[]}
 * @throws {TypeError} If an item has no text (the pack validator never lets one through).
 */
export function itemWeights(items, keyStats) {
  const rates = missRates(keyStats);
  return items.map((item) => {
    if (typeof item?.text !== "string" || item.text.length === 0) {
      throw new TypeError("every drill item needs text");
    }
    let w = 0;
    for (const ch of item.text) w += (rates.get(ch) ?? 0) + DRILL_BASE;
    return w;
  });
}
