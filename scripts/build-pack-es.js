// Build packs/spanish.json (Block 15, spanish Req 1) from FrequencyWords' Spanish list, most
// frequent first: lowercase letters with á é í ó ú ñ ü, 3 to 9 letters, no duplicates, in the
// Spanish spelling list (which drops names and English words from subtitles), nothing on
// packs/blocklist-es.txt, the first 1,400 that pass; plus short ¿…? and ¡…! words written for
// the game, so the pack drills every dead key the PRD names. Deterministic. Sources and their
// licenses: packs/source/es_COPYRIGHT.txt.
//   node scripts/build-pack-es.js
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseBlocklist } from "./build-pack.js";

export const WORD_COUNT = 1400;
export const CHARSET = "abcdefghijklmnopqrstuvwxyzáéíóúñü¿?¡!";
export const ATTRIBUTION =
  "The Spanish word list comes from FrequencyWords (github.com/hermitdave/FrequencyWords), built from OpenSubtitles 2018, under CC BY-SA 4.0. The ¿…? and ¡…! words were written for Dead Keys.";
const WORD = /^[a-zñáéíóúü]{3,9}$/;

/** Short questions and exclamations, written for the game (original content). */
export const MARKED = Object.freeze([
  "¿qué?",
  "¿cómo?",
  "¿dónde?",
  "¿quién?",
  "¿cuándo?",
  "¿cuánto?",
  "¿sí?",
  "¿listo?",
  "¿verdad?",
  "¿bien?",
  "¡hola!",
  "¡vamos!",
  "¡claro!",
  "¡gracias!",
  "¡adiós!",
  "¡bravo!",
  "¡ojalá!",
  "¡ánimo!",
  "¡genial!",
  "¡mañana!",
  "¿bilingüe?", // ü: no ü word ranks in the top 1,400
]);

/**
 * The pack's words from the source lines, in source order.
 * @param {string[]} sourceLines Most frequent first.
 * @param {Set<string>} spelled Words the Spanish spelling list accepts.
 * @param {Set<string>} blocked
 */
export function pickSpanish(sourceLines, spelled, blocked, count = WORD_COUNT) {
  const seen = new Set();
  const out = [];
  for (const raw of sourceLines) {
    const w = raw.trim();
    if (!WORD.test(w) || !spelled.has(w) || blocked.has(w) || seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length === count) break;
  }
  if (out.length < count) throw new Error(`only ${out.length} words pass; ${count} needed`);
  return out;
}

/** The Pack (contract shape). */
export function makeSpanishPack(words) {
  const item = (text, i, source) => ({
    id: `spanish-w${String(i + 1).padStart(4, "0")}`,
    text,
    kind: "word",
    source,
  });
  return {
    id: "spanish",
    name: "Español",
    lang: "es",
    version: "1.0.0",
    license: "CC BY-SA 4.0",
    attribution: ATTRIBUTION,
    charset: CHARSET,
    pools: {
      words: [
        ...words.map((t, i) => item(t, i, "FrequencyWords (CC BY-SA 4.0)")),
        ...MARKED.map((t, i) => item(t, words.length + i, "Dead Keys (original)")),
      ],
    },
    lessons: [],
  };
}

function main() {
  const at = (p) => fileURLToPath(new URL(`../packs/${p}`, import.meta.url));
  const lines = (p) => readFileSync(at(p), "utf8").split(/\r?\n/);
  const words = pickSpanish(
    lines("source/es_frequencywords_top8000.txt"),
    new Set(lines("source/es_spelled.txt")),
    parseBlocklist(readFileSync(at("blocklist-es.txt"), "utf8")),
  );
  const pack = makeSpanishPack(words);
  writeFileSync(at("spanish.json"), `${JSON.stringify(pack)}\n`); // compact: it ships to players
  console.log(`packs/spanish.json: ${pack.pools.words.length} items`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
