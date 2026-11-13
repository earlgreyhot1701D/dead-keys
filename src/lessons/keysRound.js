// Job: the words for "Play these keys" (Shara, Nov 12): after a lesson, a Practice round whose
// falling words use only the keys learned so far. Pure; the round screen takes them as items.
import { wordsFor } from "./generate.js";

/** Fewer words than this makes a thin round, so the button is left off (Lesson 0 has none). */
export const KEYS_MIN = 6;

/**
 * The round items for a lesson's learned keys, or null when there are too few words.
 * @param {string} id "L01" to "L06".
 * @returns {{ id: string, text: string, kind: "word", source: string }[] | null}
 */
export function keysItems(id) {
  const words = wordsFor(id);
  if (words.length < KEYS_MIN) return null;
  return words.map((text, i) => ({ id: `${id}-k${i + 1}`, text, kind: "word", source: "lesson" }));
}
