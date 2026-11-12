// Build packs/general.json (Block 7, Req 1) from the top-english-wordlists source, most frequent
// first: lowercase a to z only, 3 to 8 letters, no duplicates, nothing on packs/blocklist.txt,
// the first 1,500 that pass. Deterministic: same source and blocklist, same pack.
//   node scripts/build-pack.js
// The source is a copy of top_english_words_lower_10000.txt from
// github.com/david47k/top-english-wordlists (CC BY 3.0), kept in packs/source/ so the build
// needs no network.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const WORD_COUNT = 1500;
export const MIN_LEN = 3;
export const MAX_LEN = 8;
export const CHARSET = "abcdefghijklmnopqrstuvwxyz";
/** PRD G6 attribution, the same sentence the About screen shows. */
export const ATTRIBUTION =
  "The English word list comes from top-english-wordlists (github.com/david47k/top-english-wordlists), built from Google Books Ngrams, 1950 to 2012, under CC BY 3.0.";

const WORD = new RegExp(`^[a-z]{${MIN_LEN},${MAX_LEN}}$`);

/** Blocklist text to a set: one word per line, # comments and blank lines ignored. */
export function parseBlocklist(text) {
  return new Set(
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#")),
  );
}

/**
 * The pack's words from the source lines, in source order.
 * @param {string[]} sourceLines Most frequent first.
 * @param {Set<string>} blocked
 * @param {number} [count]
 * @returns {string[]}
 */
export function pickWords(sourceLines, blocked, count = WORD_COUNT) {
  const seen = new Set();
  const out = [];
  for (const raw of sourceLines) {
    const w = raw.trim();
    if (!WORD.test(w) || blocked.has(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length === count) break;
  }
  if (out.length < count) throw new Error(`only ${out.length} words pass; ${count} needed`);
  return out;
}

/** The Pack (contract shape) for a list of words. */
export function makePack(words) {
  return {
    id: "general",
    name: "General",
    lang: "en",
    version: "1.0.0",
    license: "CC BY 3.0",
    attribution: ATTRIBUTION,
    charset: CHARSET,
    pools: {
      words: words.map((text, i) => ({
        id: `general-w${String(i + 1).padStart(4, "0")}`,
        text,
        kind: "word",
        source: "top-english-wordlists (CC BY 3.0)",
      })),
    },
    lessons: [],
  };
}

function main() {
  const at = (p) => fileURLToPath(new URL(`../packs/${p}`, import.meta.url));
  const source = readFileSync(at("source/top_english_words_lower_10000.txt"), "utf8").split(
    /\r?\n/,
  );
  const blocked = parseBlocklist(readFileSync(at("blocklist.txt"), "utf8"));
  const pack = makePack(pickWords(source, blocked));
  writeFileSync(at("general.json"), `${JSON.stringify(pack)}\n`); // compact: it ships to players
  console.log(`packs/general.json: ${pack.pools.words.length} words, ${blocked.size} blocked`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
