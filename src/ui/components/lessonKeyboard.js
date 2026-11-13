// The lesson keyboard (lessons Req 7.1; mock screen C): the letter rows and the space bar, each
// key outlined in its finger's color, the lesson's learned keys bright and bold, the rest dimmed,
// bumps on F and J, and the key the line waits on filled. Decoration: hidden from a screen
// reader, which hears the line read out instead (Req 7.5). Rows come from keyboardLayout.js.
import { fingerKind, fingerOf } from "../../lessons/fingers.js";
import { el } from "../dom.js";
import { BUMPS, ROWS } from "./keyboardLayout.js";

/** The rows a letters lesson uses: the keys in the finger table, row by row. */
export const LESSON_ROWS = Object.freeze(
  ROWS.map((row) => row.filter((k) => fingerOf(k) !== null)).filter((row) => row.length),
);

/** A key's classes: finger color, learned, the waiting key, a bump, the space bar. */
export function keyClass(key, learned, next) {
  return [
    "ls-k",
    `f-${fingerKind(key)}`,
    learned.has(key) ? "is-learned" : "",
    key === next ? "is-next" : "",
    BUMPS.includes(key) ? "is-bump" : "",
    key === " " ? "is-space" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Build the keyboard for a lesson's learned keys. `show(next)` fills the waiting key.
 * @param {string[]} learnedKeys
 * @returns {{ node: HTMLElement, show: (next: string|null) => void }}
 */
export function createLessonKeyboard(learnedKeys) {
  const learned = new Set(learnedKeys);
  const caps = new Map();
  const rows = LESSON_ROWS.map((row, i) =>
    el(
      "div",
      { class: `ls-row ls-row-${i}` },
      row.map((k) => {
        const cap = el("span", { class: keyClass(k, learned, null) }, k === " " ? "space" : k);
        caps.set(k, cap);
        return cap;
      }),
    ),
  );
  let shown = null;
  return {
    node: el("div", { class: "ls-kb", "aria-hidden": "true" }, rows),
    show(next) {
      if (next === shown) return;
      for (const k of [shown, next]) caps.get(k)?.setAttribute("class", keyClass(k, learned, next));
      shown = next;
    },
  };
}

/** The legend under the keyboard (copy table), with each finger's swatch. */
export const LEGEND = Object.freeze([
  ["pinky", "PINKY"],
  ["ring", "RING"],
  ["middle", "MIDDLE"],
  ["index", "INDEX"],
  ["thumb", "THUMB (SPACE)"],
]);
export const NEXT_KEY = "■ NEXT KEY";

export const legend = () =>
  el("p", { class: "ls-legend" }, [
    ...LEGEND.map(([f, label]) =>
      el("span", {}, [el("span", { class: `ls-sw f-${f}`, "aria-hidden": "true" }), label]),
    ),
    el("span", { class: "ls-next-key" }, NEXT_KEY),
  ]);
