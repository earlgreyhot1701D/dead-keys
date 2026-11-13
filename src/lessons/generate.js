// A lesson's parts and lines (lessons Req 2, Req 4.2; design decisions 3 and 4), from its keys
// and the seeded RNG: the same seed gives the same lesson. Pure. A pattern is a group of 2 to 4
// keys; groups are one space apart; a line ends on a group and is never longer than MAX_LINE.
import general from "../../packs/general.json" with { type: "json" };
import lessonWords from "../../packs/lessonWords.json" with { type: "json" };
import { createRng } from "../engine/rng.js";
import { anchorOf } from "./fingers.js";
import { keysBefore, learnedKeys, lessonById } from "./ladder.js";

export const MAX_LINE = 28;
/** The Check's lines together are at least this long (Req 2.4). */
export const CHECK_MIN = 50;
/** With at least this many words, the Check is real words only. */
export const CHECK_WORDS = 6;
/** Lesson 0's typing lines, from the copy table (Req 6.2). Part 1 is the keyboard question. */
export const LESSON0_LINES = Object.freeze([
  "fff jjj fjf jfj",
  "ddd kkk dfd kjk",
  "fj dk fd jk fjdk",
]);
const LESSON0_PARTS = ["keyboard", "home", "fingers", "eyes"];

/** A random-number function from a seed: each call gives the next value, 0 to below 1. */
function randomFrom(seed) {
  const rng = createRng(seed);
  let state = rng.state;
  return () => {
    const r = rng.next(state);
    state = r.state;
    return r.value;
  };
}
const pick = (rand, list) => list[Math.floor(rand() * list.length)];
const size = (rand) => 2 + Math.floor(rand() * 3); // 2 to 4 keys

/**
 * Fill one line with items, one space apart, never past MAX_LINE. With `spare`, the last 2 to 4
 * places get a short pattern, so a pattern line ends at exactly MAX_LINE.
 */
function fill(item, spare = null) {
  let line = "";
  for (let i = 0, misses = 0; misses < 40; i++) {
    const room = MAX_LINE - line.length - (line ? 1 : 0);
    if (room < 2) break;
    const next = spare && room <= 4 ? spare(room) : item(i);
    if (next.length <= room) line = line ? `${line} ${next}` : next;
    else misses++;
  }
  return line;
}

/** The letters a lesson works with: its learned keys without space. */
const letters = (keys) => keys.filter((k) => k !== " ");

/** The words a lesson can use (Req 2.5): the lesson words up to 3, the general pack's from 4. */
export function wordsFor(id) {
  const { n } = lessonById(id);
  const keys = new Set(learnedKeys(id));
  const pool =
    n <= 3
      ? Object.entries(lessonWords).flatMap(([lid, w]) => (lessonById(lid).n <= n ? w : []))
      : general.pools.words.map((w) => w.text);
  return pool.filter((w) => [...w].every((ch) => keys.has(ch)));
}

function makers(id, rand) {
  const lesson = lessonById(id);
  const fresh = letters(lesson.keys);
  const all = letters(learnedKeys(id));
  const old = letters(keysBefore(id));
  const words = wordsFor(id);
  const group = (keys, n = size(rand)) =>
    Array.from({ length: n }, () => pick(rand, keys)).join("");
  // New and old keys mixed, new keys at least half the time (design decision 3).
  const mixed = (n = size(rand)) =>
    Array.from({ length: n }, () => pick(rand, rand() < 0.5 ? fresh : all)).join("");
  let turn = 0;
  // A new key alternating with its home key: "fgf", "gfg" (design decision 3).
  const anchored = () => {
    const k = fresh[turn++ % fresh.length];
    const pair = rand() < 0.5 ? [k, anchorOf(k)] : [anchorOf(k), k];
    return Array.from({ length: size(rand) }, (_, i) => pair[i % 2]).join("");
  };
  return {
    warmup: () =>
      fill(
        () => group(old),
        (room) => group(old, Math.min(room, 4)),
      ),
    newKeys: () => fill(anchored, (room) => anchored().slice(0, room)),
    mix: () =>
      fill(
        () => mixed(),
        (room) => mixed(Math.min(room, 4)),
      ),
    words: () => fill(() => pick(rand, words)),
    // Real words only when there are enough (Shara, Nov 12: patterns like "sury" read as
    // misspellings); a short word, else a short pattern, closes the line.
    check: () =>
      words.length >= CHECK_WORDS
        ? fill(
            () => pick(rand, words),
            (room) =>
              pick(
                rand,
                words.filter((w) => w.length <= room),
              ) ?? mixed(Math.min(room, 4)),
          )
        : fill(
            (i) => (i % 2 === 0 ? pick(rand, words) : mixed()),
            (room) => mixed(Math.min(room, 4)),
          ),
  };
}

/**
 * The four parts of a lesson (Req 2.4), or Lesson 0's (Req 6).
 * @param {string} id "L00" to "L06".
 * @param {number} seed
 * @returns {{ id: string, kind: "lesson", parts: { name: string, lines: string[] }[] }}
 * @throws {RangeError} For a lesson that is not built.
 */
export function generateLesson(id, seed) {
  if (!lessonById(id).built) throw new RangeError(`${id} is not built yet`);
  if (id === "L00") {
    const lines = [[], ...LESSON0_LINES.map((l) => [l])];
    const parts = LESSON0_PARTS.map((name, i) => ({ name, lines: lines[i] }));
    return { id, kind: "lesson", parts };
  }
  const m = makers(id, randomFrom(seed));
  return {
    id,
    kind: "lesson",
    parts: [
      { name: "warmup", lines: [m.warmup()] },
      { name: "new", lines: [m.newKeys(), m.newKeys()] },
      { name: "mix", lines: [m.mix(), m.words()] },
      { name: "check", lines: [m.check(), m.check()] },
    ],
  };
}

/**
 * A test out (Req 4.2): the Check part only, generated for that lesson.
 * @param {string} id "L01" to "L06" (Lesson 0 has no test out).
 * @param {number} seed
 * @returns {{ id: string, kind: "testout", parts: { name: "check", lines: string[] }[] }}
 */
export function generateTestOut(id, seed) {
  if (id === "L00" || !lessonById(id).built) throw new RangeError(`${id} has no test out`);
  const m = makers(id, randomFrom(seed));
  return { id, kind: "testout", parts: [{ name: "check", lines: [m.check(), m.check()] }] };
}
