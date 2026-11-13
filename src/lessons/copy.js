// Every word the Lesson screen and Lesson done card say (lessons design: copy table, binding).
// Kept in one place so the tests can hold each line to the table.
import { lessonById } from "./ladder.js";

const two = (n) => String(n).padStart(2, "0");

/** "LESSON 03 // FULL HOME ROW", or "TEST OUT // LESSON 03". */
export const pillText = (id, kind) => {
  const l = lessonById(id);
  return kind === "testout"
    ? `TEST OUT // LESSON ${two(l.n)}`
    : `LESSON ${two(l.n)} // ${l.name.toUpperCase()}`;
};

export const STEP_NAMES = Object.freeze({
  lesson: ["1. WARM-UP", "2. NEW KEYS", "3. MIX", "4. CHECK"],
  lesson0: ["1. YOUR KEYBOARD", "2. HOME KEYS", "3. FINGERS", "4. EYES UP"],
  testout: ["CHECK"],
});
/** "[✓] 1. WARM-UP" done, "[▶] 2. NEW KEYS" now, "3. MIX" to come. */
export const stepText = (name, state) =>
  state === "done" ? `[✓] ${name}` : state === "now" ? `[▶] ${name}` : name;

export const COACH = Object.freeze({
  warmup: "Warm up on keys you know.",
  mix: "New and old keys together, then real words.",
  check: "One check. 95% accuracy passes, at any speed.",
  new: Object.freeze({
    L01: "Left hand on the home row: pinky on A, ring on S, middle on D, index on F.",
    L02: "Right hand on the home row: index on J, middle on K, ring on L, pinky on ;.",
    L03: "Index fingers reach in: left for G, right for H. Thumbs press Space.",
    L04: "Index fingers reach up: left for R and T, right for Y and U.",
    L05: "Reach up from home: Q, W, E with your left hand; I, O, P with your right.",
    L06: "Reach down: Z, X, C, V, B with your left hand; N, M, comma and period with your right.",
  }),
});
/** The coach line for a part of a lesson. */
export const coachFor = (id, part) => (part === "new" ? COACH.new[id] : COACH[part]);

/** Split a coach line so its key letters can be drawn bold teal: [text, isKey][]. */
export function coachParts(line) {
  return line
    .split(/(\b[A-Z]\b|; ?(?=\.$))/)
    .filter(Boolean)
    .map((s) => [s, /^[A-Z]$|^;/.test(s)]);
}

export const lineCount = (n, m) => `LINE ${n} OF ${m}`;
/** The wrong-key hint, naming the letter the line waits on (space as SPACE, no quotes). */
export const fixHint = (key) =>
  `TYPE ${key === " " ? "SPACE" : `"${key}"`} TO FIX. Backspace clears the red key.`;
export const ACCURACY = "ACCURACY";
export const KEYS = "KEYS";
export const FOOTER_LEFT = "NO LIVES. NO TIMER. LESSONS PASS ON ACCURACY, NOT SPEED.";
export const FOOTER_RIGHT = Object.freeze(["[ESC] PAUSE", "FINGER COLORS: ON"]);

export const PAUSE = Object.freeze({
  title: "Paused",
  body: "Your lesson is waiting. If you leave now, it is not saved.",
  resume: "Resume",
  leave: "Leave lesson",
});

/** The live region (copy table). */
export const SAY = Object.freeze({
  line: (n, m, text) => `Line ${n} of ${m}: ${text}`,
  wrong: (key) => `Wrong key. Type ${key === " " ? "SPACE" : key}.`,
  passed: (n, a) => `Lesson ${n} passed. Check accuracy ${a}%.`,
  notYet: (a) => `Not yet. Check accuracy ${a}%. 95% passes.`,
  testedOut: (n) => `Tested out of lesson ${n}.`,
});

/** The Lesson done card (copy table). */
export const DONE = Object.freeze({
  passed: "Passed.",
  notYet: "Not yet.",
  testedOut: "Tested out.",
  checkAcc: "CHECK ACCURACY",
  passLine: "95% passes",
  lesson0Sub: "finishing passes Lesson 0",
  speed: "SPEED",
  speedSub: "any speed is fine",
  keep: "KEEP PRACTICING",
  keepSub: "your most-missed keys here",
  none: "—",
  noneSub: "no misses in this lesson",
  notYetLine: "Close. Try it again; going slower helps.",
  testOutNotYetLine: "The full lesson will get you there.",
  dip: "Speed often dips while your fingers relearn. It comes back faster.",
  again: "Again",
  all: "All lessons",
  footNext: Object.freeze(["[ENTER] NEXT LESSON", "[ESC] ALL LESSONS"]),
  footAgain: Object.freeze(["[ENTER] AGAIN", "[ESC] ALL LESSONS"]),
  saved: "SAVED IN THIS BROWSER",
  notSaving: "NOT SAVING", // the results screen's wording when saving is off
});
/** "Next: Lesson 04". */
export const nextLabel = (n) => `Next: Lesson ${two(n)}`;
/** "LESSON 03", the card's top label. */
export const cardLabel = (n) => `LESSON ${two(n)}`;
