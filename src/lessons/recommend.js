// The recommended next lesson (lessons Req 8.1, 8.2) and its Why line (the copy table). Pure.
// Among built lessons not passed (or tested out), the earliest whose new keys include one of the
// player's top 3 weak keys; otherwise the earliest not passed; a brand-new player gets Lesson 0;
// when every built lesson is passed, none.
import { heatmap } from "../engine/heatmap.js";
import { BUILT } from "./ladder.js";

/** How many weak keys the recommendation looks at (Req 8.1). */
export const TOP_WEAK = 3;
/** Bands that count as weak: every band with enough data except "steady". */
const WEAK_BANDS = Object.freeze(["missed", "shaky", "uneven"]);

/**
 * The player's top weak keys from the heat map: enough data only, worst miss rate first, then
 * more attempts, then key order.
 * @param {{ key: string, attempts: number, misses: number }[]} keys
 * @returns {string[]}
 */
export function topWeakKeys(keys, n = TOP_WEAK) {
  const attempts = new Map(keys.map((k) => [k.key, k.attempts]));
  return heatmap(keys)
    .filter((h) => WEAK_BANDS.includes(h.band))
    .sort(
      (a, b) =>
        b.missRate - a.missRate ||
        attempts.get(b.key) - attempts.get(a.key) ||
        (a.key < b.key ? -1 : 1),
    )
    .slice(0, n)
    .map((h) => h.key);
}

/**
 * @param {import("../../contract/types.js").Progress} progress
 * @returns {{ lessonId: string, why: { kind: "weak", keys: string[] } | { kind: "order" } | { kind: "new" } } | null}
 */
export function recommend(progress) {
  const passed = new Set(progress.lessonsPassed.map((l) => l.lessonId));
  if (passed.size === 0 && progress.rounds.length === 0) {
    return { lessonId: "L00", why: { kind: "new" } };
  }
  const open = BUILT.filter((l) => !passed.has(l.id));
  if (open.length === 0) return null;
  const weak = topWeakKeys(progress.keys);
  // Lesson 0 is never picked for a weak key: it teaches where F and J are, not typing them.
  for (const l of open.filter((x) => x.id !== "L00")) {
    const keys = weak.filter((k) => l.keys.includes(k)).slice(0, 2);
    if (keys.length) return { lessonId: l.id, why: { kind: "weak", keys } };
  }
  return { lessonId: open[0].id, why: { kind: "order" } };
}

/**
 * The Why line, as the copy table writes it.
 * @param {{ kind: string, keys?: string[] }} why
 */
export function whyLine(why) {
  if (why.kind === "new") return "[WHY] New to typing? Start here.";
  if (why.kind === "order") return "[WHY] Next in order.";
  const [a, b] = why.keys;
  return b ? `[WHY] You miss "${a}" and "${b}" most.` : `[WHY] You miss "${a}" most.`;
}
