// How we count's Drills section (drills Req 6), split from howWeCountText.js at the line cap.
// The copy table's words, with the base weight read from the code (DRILL_BASE). Pure.
import { DRILL_BASE } from "../../drills/weights.js";

/**
 * @param {{ DRILL_BASE?: number }} [c] The page's config; a test may change DRILL_BASE.
 * @returns {{ id: string, heading: string, paragraphs: string[] }}
 */
export function drillsSection(c = {}) {
  const base = c.DRILL_BASE ?? DRILL_BASE;
  return {
    id: "drills",
    heading: "Drills",
    paragraphs: [
      `A drill favors words with your weak keys: each letter adds its miss rate plus ${base} to the word's score, so a word full of keys you miss comes up more often.`,
      "Every drill says where its words came from.",
    ],
  };
}
