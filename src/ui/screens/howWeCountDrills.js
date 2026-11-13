// How we count's Drills section (drills Req 6), split from howWeCountText.js at the line cap.
// The copy table's words, with the base weight read from the code (DRILL_BASE). Pure.
import { DRILL_BASE, DRILL_MIN_WORDS } from "../../drills/weights.js";

/**
 * @param {{ DRILL_BASE?: number, DRILL_MIN_WORDS?: number }} [c] The page's config; a test may change DRILL_BASE.
 * @returns {{ id: string, heading: string, paragraphs: string[] }}
 */
export function drillsSection(c = {}) {
  const base = c.DRILL_BASE ?? DRILL_BASE;
  const min = c.DRILL_MIN_WORDS ?? DRILL_MIN_WORDS;
  return {
    id: "drills",
    heading: "Drills",
    paragraphs: [
      `A drill uses only words with at least one of your weak keys, when the pack has ${min} or more of them. Each letter adds its miss rate plus ${base} to the word's score, so a word full of keys you miss comes up more often.`,
      "With AI drills on, the AI gets only your weak keys and speed. Every drill says where its words came from.",
    ],
  };
}
