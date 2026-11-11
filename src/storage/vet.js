// Checks the schema subset can't express (requirements.md, Req 3). Never throws and never changes
// its input: whatever JSON it is given, it returns a list of problems (empty means fine).
import { loadSchemas } from "../../contract/schemas.js";
import { updateDayStreak } from "../engine/dayStreak.js";

/** Stop collecting after this many problems, so hostile input cannot build a huge list. */
const MAX_ERRORS = 50;
const BANNED_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const oneChar = (k) => typeof k === "string" && [...k].length === 1;

/** The modes a best can belong to: the contract's modes, minus practice (it is untimed). */
const bestModes = () =>
  new Set(
    loadSchemas()
      .get("roundResult.json")
      .properties.mode.enum.filter((m) => m !== "practice"),
  );

/** Turn a linked path back into text such as "rounds[0].keyDeltas". */
function pathOf(link) {
  const parts = [];
  for (let l = link; l; l = l.up) parts.push(l.seg);
  return parts.reverse().join("").replace(/^\./, "");
}

/** True for a real calendar date written as YYYY-MM-DD (leap years included). */
function isDay(s) {
  if (typeof s !== "string") return false;
  try {
    updateDayStreak({ lastDay: null, count: 0 }, s); // throws RangeError on a bad date
    return true;
  } catch {
    return false;
  }
}

/**
 * Check a Progress against Req 3. Run it after the contract check; it also works on any value.
 * 1. every `keyDeltas` and `keys` key is exactly one character;
 * 2. every `bests` key is a real mode and not `practice`;
 * 3. `dayStreak.lastDay` is null or a real calendar date;
 * 4. no object key anywhere is `__proto__`, `constructor` or `prototype`.
 * @param {unknown} progress
 * @returns {{ path: string, message: string }[]} At most 50 problems.
 */
export function vet(progress) {
  const errors = [];
  const bad = (path, message) => {
    if (errors.length < MAX_ERRORS) errors.push({ path, message });
  };
  if (!isObj(progress)) return [{ path: "", message: "progress is not an object" }];

  if (Array.isArray(progress.rounds)) {
    progress.rounds.forEach((r, i) => {
      if (!isObj(r?.keyDeltas)) return;
      for (const k of Object.keys(r.keyDeltas)) {
        if (!oneChar(k))
          bad(`rounds[${i}].keyDeltas`, `key ${JSON.stringify(k)} is not one character`);
      }
    });
  }
  if (Array.isArray(progress.keys)) {
    progress.keys.forEach((s, i) => {
      if (isObj(s) && !oneChar(s.key))
        bad(`keys[${i}].key`, `key ${JSON.stringify(s.key)} is not one character`);
    });
  }
  if (isObj(progress.bests)) {
    const modes = bestModes();
    for (const m of Object.keys(progress.bests)) {
      if (!modes.has(m)) bad("bests", `${JSON.stringify(m)} is not a mode that can have a best`);
    }
  }
  const last = progress.dayStreak?.lastDay;
  if (isObj(progress.dayStreak) && last !== null && last !== undefined && !isDay(last)) {
    bad("dayStreak.lastDay", `${JSON.stringify(last)} is not a real date as YYYY-MM-DD`);
  }

  // Rule 4, over the whole tree. Iterative on purpose: very deep JSON must not overflow the stack.
  // Paths are linked, not built as strings, so a deep tree stays cheap; text is made on a problem.
  const stack = [[progress, null]];
  while (stack.length > 0 && errors.length < MAX_ERRORS) {
    const [node, link] = stack.pop();
    if (Array.isArray(node)) {
      node.forEach((v, i) => {
        if (typeof v === "object" && v !== null) stack.push([v, { seg: `[${i}]`, up: link }]);
      });
    } else if (isObj(node)) {
      for (const k of Object.keys(node)) {
        if (BANNED_KEYS.has(k)) bad(pathOf(link), `key ${JSON.stringify(k)} is not allowed`);
        const v = node[k];
        if (typeof v === "object" && v !== null) stack.push([v, { seg: `.${k}`, up: link }]);
      }
    }
  }
  return errors;
}
