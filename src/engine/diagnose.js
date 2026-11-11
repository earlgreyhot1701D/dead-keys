// Turn saved key stats into a Diagnosis: up to 3 plain sentences, weak keys, enough-data flag.
// Pure; never changes input. Ratios are compared by cross-multiplying whole numbers, so a group
// at exactly 3x the overall rate is "high" and no float rounding can tip it either way.
import { bandFor } from "./heatmap.js";
import {
  ENOUGH_DATA,
  GROUP_FLOOR,
  GROUP_MIN_ATTEMPTS,
  GROUP_RATIO,
  GROUPS,
  HIGH_RATIO,
  MIN_KEY_ATTEMPTS,
} from "./progressConfig.js";

const whole = (n) => Number.isInteger(n) && n >= 0;
const sum = (list, f) => list.reduce((n, x) => n + f(x), 0);

/** Throw unless every stat has one-character key, whole counts, misses <= attempts, no repeats. */
function check(keys) {
  if (!Array.isArray(keys)) throw new TypeError("keys must be an array");
  const seen = new Set();
  for (const k of keys) {
    const ok = typeof k?.key === "string" && [...k.key].length === 1;
    if (!ok || !whole(k.attempts) || !whole(k.misses) || k.misses > k.attempts) {
      throw new RangeError(`bad key stat for "${k?.key}"`);
    }
    if (seen.has(k.key)) throw new RangeError(`duplicate key "${k.key}"`);
    seen.add(k.key);
  }
}

/** Worse first: higher miss rate, then more attempts, then key. Exact, no division. */
const worse = (a, b) =>
  b.misses * a.attempts - a.misses * b.attempts ||
  b.attempts - a.attempts ||
  (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

/** One sentence from a fixed template; "about 1 in N keys", never a percentage. */
function sentence(phrase, group, severity) {
  const verb = phrase.endsWith("s") ? "miss" : "misses";
  const n = Math.round(group.attempts / group.misses);
  const how = n < 2 ? `${verb} most keys` : `${verb} about 1 in ${n} keys`;
  const times = severity === "high" ? "at least three times" : "at least twice";
  return `Your ${phrase} ${how}, ${times} your usual rate.`;
}

/**
 * Summarize the player's typing.
 * - `sufficientData` is true once total attempts reach ENOUGH_DATA; until then there are no sentences.
 * - A group is flagged at 20+ attempts, 2x the overall miss rate, and a miss rate of at least 5%.
 * - Sentences are worst first, at most 3; each lists the group's own shaky or missed keys.
 * - `weakKeys` are up to 6 keys with 10+ attempts and at least one miss, worst first, taken from
 *   all keys (not only flagged groups) so drills still have targets.
 * @param {{ key: string, attempts: number, misses: number }[]} keys Saved stats, one per key.
 * @returns {import("../../contract/types.js").Diagnosis}
 * @throws {TypeError|RangeError} If the stats are malformed (programmer error).
 */
export function diagnose(keys) {
  check(keys);
  const total = { attempts: sum(keys, (k) => k.attempts), misses: sum(keys, (k) => k.misses) };
  const weakKeys = keys
    .filter((k) => k.attempts >= MIN_KEY_ATTEMPTS && k.misses > 0)
    .sort(worse)
    .slice(0, 6)
    .map((k) => k.key);
  const sufficientData = total.attempts >= ENOUGH_DATA;
  if (!sufficientData) return { sentences: [], weakKeys, sufficientData };
  const sentences = GROUPS.map((g) => {
    const members = keys.filter((k) => g.has(k.key));
    return {
      g,
      members,
      attempts: sum(members, (k) => k.attempts),
      misses: sum(members, (k) => k.misses),
    };
  })
    .filter(
      (x) =>
        x.attempts >= GROUP_MIN_ATTEMPTS &&
        x.misses * total.attempts >= GROUP_RATIO * total.misses * x.attempts &&
        x.misses / x.attempts >= GROUP_FLOOR,
    )
    .sort(worse)
    .slice(0, 3)
    .map((x) => {
      const high = x.misses * total.attempts >= HIGH_RATIO * total.misses * x.attempts;
      const severity = high ? "high" : "medium";
      const hurting = x.members.filter((k) => ["missed", "shaky"].includes(bandFor(k)));
      return {
        text: sentence(x.g.phrase, x, severity),
        severity,
        keys: hurting.sort(worse).map((k) => k.key),
      };
    });
  return { sentences, weakKeys, sufficientData };
}
