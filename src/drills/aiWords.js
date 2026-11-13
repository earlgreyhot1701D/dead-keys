// The words of an AI drill (ai-drills Req 3.2; design decision 2): every word in the model's
// lines, split on spaces, lowercase, deduplicated, each made only of pack-charset letters. Words,
// not lines, become the drill, because drills are falling words. Pure.

/**
 * @param {string[]} lines A validated DrillResponse's lines.
 * @param {string} charset The pack charset (letters only; a space is never a word character).
 * @returns {string[]} In first-seen order.
 */
export function aiWords(lines, charset) {
  const ok = new Set([...charset].filter((c) => c !== " "));
  const seen = new Set();
  for (const line of lines ?? []) {
    for (const raw of String(line).split(" ")) {
      const w = raw.toLowerCase();
      if (w && !seen.has(w) && [...w].every((c) => ok.has(c))) seen.add(w);
    }
  }
  return [...seen];
}

/**
 * The words as round items, the shape createRound takes (ids are local to this drill).
 * @param {string[]} words
 * @returns {{ id: string, text: string, kind: "word", source: "ai" }[]}
 */
export const aiItems = (words) =>
  words.map((text, i) => ({ id: `ai-${i + 1}`, text, kind: "word", source: "ai" }));
