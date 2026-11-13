// Job: make the lines for Lessons 7 to 13 (lessons-8b Reqs 2 to 5), seeded and pure. Same
// shape as the letters lessons' makers: warmup, newKeys, mix, words and check, one line each.
// Every character is one of the lesson's learned keys; each line fits MAX_LINE (lineKit.js).
import general from "../../packs/general.json" with { type: "json" };
import { anchorOf } from "./fingers.js";
import { learnedKeys, lessonById } from "./ladder.js";
import { fill, pick, size } from "./lineKit.js";

/** Lesson 13's pairs (PRD G7). */
export const PAIRS = Object.freeze(["th", "he", "in", "er", "an", "re", "on"]);
const STREETS = ["St.", "Ave.", "Rd.", "Ln."];
/** Two-letter words: the general pack starts at three letters, and a line may end with 2 free. */
const TWO = ["an", "in", "on", "to", "at", "it", "is", "of", "or", "we", "go", "so", "no", "up"];
const CONTRACTIONS = ["it's", "don't", "can't", "I'm", "you're", "we'll", "that's", "isn't"];
const WORDS = general.pools.words.map((w) => w.text);
const SHORT = WORDS.filter((w) => w.length <= 5);
const pairCount = (w) => PAIRS.reduce((n, p) => n + w.split(p).length - 1, 0);
/** Lesson 13's words: two or more pairs, listed once per pair so more pairs come up more often. */
const PAIR_WORDS = WORDS.filter((w) => pairCount(w) >= 2).flatMap((w) =>
  Array(pairCount(w)).fill(w),
);

const cap = (w) => w[0].toUpperCase() + w.slice(1);
const int = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));

/** Lesson by lesson: a new-key pattern and a "use" (the keys where they really go). */
function kit(n, rand, fresh, digits) {
  const word = () => pick(rand, SHORT);
  // In Lessons 9 and 10 the new digits come up at least half the time (letters lessons'
  // design decision 3); later lessons use every digit.
  const newDigits = n === 9 || n === 10 ? fresh : digits;
  const digit = () => pick(rand, rand() < 0.5 ? newDigits : digits);
  const nonZero = digits.filter((d) => d !== "0");
  // A number never starts with 0 unless it is one digit long.
  const num = (len = size(rand)) =>
    Array.from({ length: len }, (_, i) =>
      i === 0 && len > 1 ? pick(rand, nonZero) : digit(),
    ).join("");
  // A new key between its finger's home key: "f4f", "a!a", ";?;".
  const anchored = () => {
    const k = pick(rand, fresh);
    return `${anchorOf(k)}${k}${anchorOf(k)}`;
  };
  const kits = {
    7: {
      pattern: () => {
        const x = pick(rand, [..."asdfjklghrtyuqweiopzxcvbnm"]);
        return `${x.toUpperCase()}${x}`;
      },
      use: () => cap(word()),
    },
    8: {
      pattern: anchored,
      use: () =>
        pick(rand, [
          () => pick(rand, CONTRACTIONS),
          () => `${word()}?`,
          () => `${word()}!`,
          () => `${word()}:`,
          () => `"${word()}"`,
          () =>
            `${pick(
              rand,
              SHORT.filter((w) => w.length <= 3),
            )}-${word()}`,
        ])(),
    },
    9: { pattern: anchored, use: () => (rand() < 0.5 ? num() : `${num(2)} ${word()}`) },
    11: {
      pattern: anchored,
      use: () =>
        pick(rand, [
          () => `$${num()}`,
          () => `${num(2)}%`,
          () => `${cap(word())} & ${cap(word())}`,
          () => `(${word()})`,
          () => `${word()}/${word()}`,
          () => `@${word()}`,
          () => `#${num(1)}`,
        ])(),
    },
    12: {
      // Made-up strings only (Req 4.1): no real address or person.
      pattern: () =>
        rand() < 0.5
          ? `${int(rand, 1, 12)}/${int(rand, 1, 28)}/${int(rand, 1990, 2030)}`
          : `$${int(rand, 1, 99)}.${String(int(rand, 0, 99)).padStart(2, "0")}`,
      use: () =>
        rand() < 0.5
          ? `${int(rand, 10, 9999)} ${cap(word())} ${pick(rand, STREETS)}`
          : `${cap(pick(rand, [..."abcdefghjkmnprstuvwxyz"]))}${cap(pick(rand, [..."abcdefghjkmnprstuvwxyz"]))}-${int(rand, 1000, 9999)}`,
    },
    13: {
      pattern: () => {
        const p = pick(rand, PAIRS);
        const w = SHORT.filter((x) => x.startsWith(p));
        return rand() < 0.5 || !w.length ? `${p}${p}` : pick(rand, w);
      },
      use: () => pick(rand, PAIR_WORDS),
    },
  };
  return kits[n === 10 ? 9 : n];
}

/**
 * The line makers for Lessons 7 to 13.
 * @param {string} id "L07" to "L13".
 * @param {() => number} rand
 */
export function beyondMakers(id, rand) {
  const { n, keys } = lessonById(id);
  const digits = learnedKeys(id).filter((k) => /\d/.test(k));
  const fresh = n === 7 || n >= 12 ? [] : keys.filter((k) => k.length === 1);
  const { pattern, use } = kit(n, rand, fresh, digits);
  const word = () => pick(rand, WORDS);
  return {
    warmup: () => fill(word),
    newKeys: () => fill(pattern),
    mix: () => fill((i) => (i % 2 === 0 ? pattern() : use())),
    words: () => fill(use),
    // The Check leads with the lesson's own keys, then mixes in plain words; a short word closes
    // the line, so two lines reach CHECK_MIN.
    check: () =>
      fill(
        (i) => (i % 2 === 0 ? use() : word()),
        (room) =>
          pick(
            rand,
            [...TWO, ...WORDS].filter((w) => w.length <= room),
          ),
      ),
  };
}
