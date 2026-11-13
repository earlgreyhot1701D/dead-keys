// The lesson keyboard (lessons Req 7.1; mock screen C; lessons-8b Req 6): the rows a lesson
// uses, each key outlined in its finger's color and marked with its finger's initial (so the
// finger never shows by color alone), the learned keys bright, the rest dimmed, bumps on F and J,
// and the key the line waits on filled; for a capital or a symbol, the Shift to hold too.
// Decoration: hidden from a screen reader, which hears the line read out (Req 7.5).
import { baseKey, fingerKind, fingerOf, shiftFor } from "../../lessons/fingers.js";
import { el } from "../dom.js";
import { BUMPS, ROWS } from "./keyboardLayout.js";

/** Every key with a finger, row by row; the number row first. */
export const LESSON_ROWS = Object.freeze(
  ROWS.map((row) => row.filter((k) => fingerOf(k) !== null)).filter((row) => row.length),
);
const LATE = new Set(["'", "/"]);
const SHIFTS = Object.freeze([
  ["ShiftLeft", "pinky"],
  ["ShiftRight", "pinky"],
]);
/** A finger's initial on its keys (lessons-8b Req 6.3). */
export const INITIAL = Object.freeze({
  pinky: "P",
  ring: "R",
  middle: "M",
  index: "I",
  thumb: "T",
});

/**
 * The rows a lesson draws: the number row only once the lesson has a key on it, so Lessons 0 to
 * 6 look as they always did; both Shift keys (on the bottom row) once it has a capital.
 * @param {Set<string>} lit The learned keys, as the keys they are typed on.
 * @param {boolean} shift
 */
export function rowsFor(lit, shift) {
  let rows = LESSON_ROWS.filter((row, i) => i > 0 || row.some((k) => lit.has(k)));
  // ' and / arrived with Block 8b: a letters lesson's keyboard stays as Block 8a drew it.
  if (!shift) rows = rows.map((row) => row.filter((k) => !LATE.has(k)));
  if (!shift) return rows;
  return rows.map((row) => (row.includes("z") ? ["ShiftLeft", ...row, "ShiftRight"] : row));
}

/** A key's classes: finger color, learned, the waiting key, a bump, the space bar, Shift. */
export function keyClass(key, learned, next) {
  const shift = key.startsWith("Shift");
  return [
    "ls-k",
    `f-${shift ? "pinky" : fingerKind(key)}`,
    learned.has(key) ? "is-learned" : "",
    next?.has?.(key) || key === next ? "is-next" : "",
    BUMPS.includes(key) ? "is-bump" : "",
    key === " " ? "is-space" : "",
    shift ? "is-shift" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

const capText = (k) => (k === " " ? "space" : k.startsWith("Shift") ? "shift" : k);

/**
 * Build the keyboard for a lesson's learned keys. `show(next)` fills the waiting key, and the
 * Shift to hold when the waiting character needs one.
 * @param {string[]} learnedKeys
 * @param {{ colors?: boolean }} [o] Finger colors (lessons-8b Req 7); initials always show.
 * @returns {{ node: HTMLElement, show: (next: string|null) => void }}
 */
export function createLessonKeyboard(learnedKeys, { colors = true } = {}) {
  const shift = learnedKeys.some((k) => /^[A-Z]$/.test(k));
  const learned = new Set(learnedKeys.map(baseKey));
  if (shift) for (const [s] of SHIFTS) learned.add(s);
  const caps = new Map();
  const drawn = rowsFor(learned, shift);
  const num = drawn[0].includes("1"); // the letter rows keep their 8a classes, 0 to 3
  const rows = drawn.map((row, i) =>
    el(
      "div",
      { class: `ls-row ${num && i === 0 ? "ls-row-num" : `ls-row-${num ? i - 1 : i}`}` },
      row.map((k) => {
        const kind = k.startsWith("Shift") ? "pinky" : fingerKind(k);
        const cap = el("span", { class: keyClass(k, learned, null) }, [
          capText(k),
          el("span", { class: "ls-fi" }, INITIAL[kind]),
        ]);
        caps.set(k, cap);
        return cap;
      }),
    ),
  );
  let shown = new Set();
  return {
    node: el("div", { class: `ls-kb${colors ? "" : " no-colors"}`, "aria-hidden": "true" }, rows),
    show(next) {
      const now = new Set(next === null ? [] : [baseKey(next), shiftFor(next)].filter(Boolean));
      for (const k of new Set([...shown, ...now])) {
        caps.get(k)?.setAttribute("class", keyClass(k, learned, now));
      }
      shown = now;
    },
  };
}

/** The legend under the keyboard (copy table), with each finger's swatch and initial. */
export const LEGEND = Object.freeze([
  ["pinky", "P PINKY"],
  ["ring", "R RING"],
  ["middle", "M MIDDLE"],
  ["index", "I INDEX"],
  ["thumb", "T THUMB (SPACE)"],
]);
export const NEXT_KEY = "■ NEXT KEY";

export const legend = () =>
  el("p", { class: "ls-legend" }, [
    ...LEGEND.map(([f, label]) =>
      el("span", {}, [el("span", { class: `ls-sw f-${f}`, "aria-hidden": "true" }), label]),
    ),
    el("span", { class: "ls-next-key" }, NEXT_KEY),
  ]);
