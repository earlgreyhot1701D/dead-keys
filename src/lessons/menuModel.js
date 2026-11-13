// What the Lessons menu shows (lessons Req 5; mock screen D through the map), as pure functions
// of saved progress: each lesson's state, each group's count, and the learned-keys map. Pure.
import { BUILT, LADDER, lessonById } from "./ladder.js";
import { recommend } from "./recommend.js";

/** The groups in order, with the copy table's headings. */
export const GROUPS = Object.freeze([
  ["home", "HOME ROW"],
  ["top", "TOP ROW"],
  ["bottom", "BOTTOM ROW"],
  ["beyond", "BEYOND LETTERS"],
]);

/** Row states (copy table). */
export const STATE = Object.freeze({
  passed: "✓ PASSED",
  testedOut: "✓ TESTED OUT",
  next: "▶ NEXT",
  open: "OPEN",
  later: "LATER",
});
/** The card's right-hand label for each state (copy table; Later lessons have none). */
export const CARD_STATE = Object.freeze({
  passed: "PASSED",
  testedOut: "TESTED OUT",
  next: "NEXT UP",
  open: "OPEN",
  later: "",
});

/** The keys column, as the lessons mock writes each lesson's keys. */
export const KEY_LABELS = Object.freeze({
  L00: "F J",
  L01: "a s d f",
  L02: "j k l ;",
  L03: "g h ␣",
  L04: "r t y u",
  L05: "q w e i o p",
  L06: "z x c v b n m",
  L07: "⇧",
  L08: `' ? ! : " -`,
  L09: "1 2 3 4 5",
  L10: "6 7 8 9 0",
  L11: "$ % & ( ) /",
  L12: "dates, money",
  L13: "th he in er",
});

/**
 * Every lesson's state: passed, tested out, next (the recommended lesson), open or later.
 * @param {import("../../contract/types.js").Progress} progress
 * @returns {{ states: Record<string, keyof STATE>, recommended: string|null }}
 */
export function lessonStates(progress) {
  const how = new Map(progress.lessonsPassed.map((l) => [l.lessonId, l.how]));
  const recommended = recommend(progress)?.lessonId ?? null;
  const states = {};
  for (const l of LADDER) {
    if (!l.built) states[l.id] = "later";
    else if (how.has(l.id)) states[l.id] = how.get(l.id) === "testout" ? "testedOut" : "passed";
    else states[l.id] = l.id === recommended ? "next" : "open";
  }
  return { states, recommended };
}

/** "3 OF 4 PASSED" for a built group (tested out counts); "LATER" for Beyond letters. */
export function groupCount(group, states) {
  const built = BUILT.filter((l) => l.group === group);
  if (!built.length) return "LATER";
  const done = built.filter((l) => ["passed", "testedOut"].includes(states[l.id])).length;
  return `${done} OF ${built.length} PASSED`;
}

const letters = (l) => l.keys.filter((k) => k !== " " && [...k].length === 1);

/**
 * The learned-keys map: lit keys (every passed or tested-out lesson's), the recommended
 * lesson's new letter keys (outlined), and the count of lit keys.
 */
export function mapKeys(states, recommended) {
  const lit = new Set(
    BUILT.filter((l) => ["passed", "testedOut"].includes(states[l.id])).flatMap(letters),
  );
  const next = recommended ? letters(lessonById(recommended)) : [];
  return { lit, next, learned: lit.size };
}

/** The map legend (copy table). */
export const legendText = (learned, next) => ({
  learned: `LEARNED ${learned}`,
  next: next.length ? `NEXT: ${next.map((k) => k.toUpperCase()).join(" ")}` : null,
  toCome: "TO COME",
});

/** The card's key caps: the lesson's new keys, upper case, space as SPACE, Shift as ⇧. */
export const capLabels = (id) =>
  lessonById(id).keys.map((k) => (k === " " ? "SPACE" : k === "Shift" ? "⇧" : k.toUpperCase()));
