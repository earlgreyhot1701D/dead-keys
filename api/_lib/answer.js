// The model's answer, cleaned before anything leaves the route (ai-drills Req 2.5, as changed by
// Shara on Nov 13 after the golden set). A normal end only. Then the answer is treated as a bag of
// words, never as instructions: each word is lowercased and kept only if it is made of pack-charset
// letters, 2 to 12 long, a real word (in SCOWL's en_US list, the list the pack build already trusts;
// Block 16, after the model wrote "zizz") and not on packs/blocklist.txt. Numbers, punctuation, list markers and
// anything else are dropped word by word, not answer by answer. The kept words are packed into
// lines of at most 80 characters, at most 8 lines, and validated as a DrillResponse. Nothing the
// model wrote can reach the player except a-z words that passed all of this.
import { readFileSync } from "node:fs";
import { validate } from "../../contract/validate.js";

/** The only stop reason that means the answer is complete (not cut off, not filtered). */
export const NORMAL_END = "end_turn";
export const MAX_LINES = 8;
export const MAX_LINE = 80;
export const WORD_MIN = 2;
export const WORD_MAX = 12;

/** The same blocklist the general pack is built against (one word a line, # comments). */
const BLOCKED = new Set(
  readFileSync(new URL("../../packs/blocklist.txt", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim().toLowerCase())
    .filter((l) => l && !l.startsWith("#")),
);

/** Real words: SCOWL's en_US speller list, lowercase entries only (no names, no 's forms). */
const REAL = new Set(
  readFileSync(new URL("../../packs/source/scowl_en_US.txt", import.meta.url), "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[a-z]+$/.test(l)),
);

/**
 * The words worth keeping, in first-seen order, each once: charset letters only, 2 to 12 long,
 * a real word, not blocked.
 * @param {string} text The model's raw text.
 * @param {string} charset The pack charset.
 * @returns {{ kept: string[], dropped: number }}
 */
export function cleanWords(text, charset) {
  const kept = [];
  let dropped = 0;
  for (const raw of String(text ?? "")
    .toLowerCase()
    .split(/\s+/)) {
    if (!raw) continue;
    const ok =
      raw.length >= WORD_MIN &&
      raw.length <= WORD_MAX &&
      [...raw].every((ch) => charset.includes(ch) && ch !== " ") &&
      REAL.has(raw) &&
      !BLOCKED.has(raw);
    if (!ok) dropped += 1;
    else if (!kept.includes(raw)) kept.push(raw); // a repeat counts once
  }
  return { kept, dropped };
}

/** Pack words into lines of at most MAX_LINE characters, at most MAX_LINES lines. */
export function packLines(words) {
  const lines = [];
  let line = "";
  for (const w of words) {
    if (line && line.length + 1 + w.length > MAX_LINE) {
      lines.push(line);
      if (lines.length === MAX_LINES) return lines;
      line = w;
    } else line = line ? `${line} ${w}` : w;
  }
  if (line && lines.length < MAX_LINES) lines.push(line);
  return lines;
}

/**
 * @param {{ text: string, stopReason: string|null }} answer From bedrock.js.
 * @param {string} charset The pack charset; a space is added for the gaps between words.
 * @returns {{ ok: true, lines: string[], dropped: number } | { ok: false, code: "stop"|"empty"|"invalid" }}
 */
export function checkAnswer(answer, charset) {
  if (answer?.stopReason !== NORMAL_END) return { ok: false, code: "stop" };
  const { kept, dropped } = cleanWords(answer.text, charset);
  const lines = packLines(kept);
  if (lines.length === 0) return { ok: false, code: "empty" };
  const r = validate("DrillResponse", { lines, source: "ai" }, { charset: `${charset} ` });
  return r.status === "valid" ? { ok: true, lines, dropped } : { ok: false, code: "invalid" };
}
