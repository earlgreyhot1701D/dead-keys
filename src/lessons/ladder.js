// The lesson ladder (PRD G7; lessons Req 1): Lessons 0 to 13, each with its id, number, name,
// group, new keys and whether it is built. 0 to 6 (the letters) are built in Block 8a; 7 to 13
// show "Later". The ladder lives in code, not in the pack (design decision 1). Pure data.

/**
 * @typedef {object} Lesson
 * @property {string} id "L00" to "L13".
 * @property {number} n 0 to 13.
 * @property {string} name As PRD G7 writes it.
 * @property {"home"|"top"|"bottom"|"beyond"} group
 * @property {string[]} keys The new keys: single characters (space is " "), or for Lessons 7 and
 *   13 the PRD's "Shift" and letter pairs. Lesson 12 has none.
 * @property {string|null} note The rest of PRD G7's "new keys" text, when it is not keys.
 * @property {boolean} built
 */

const L = (n, name, group, keys, note = null) =>
  Object.freeze({
    id: `L${String(n).padStart(2, "0")}`,
    n,
    name,
    group,
    keys: Object.freeze(keys),
    note,
    built: n <= 6,
  });

/** @type {readonly Lesson[]} */
export const LADDER = Object.freeze([
  // Lesson 0's keys are F and J, as the lessons mock writes them; Lesson 1 warms up on them.
  L(
    0,
    "Meet your keyboard",
    "home",
    ["f", "j"],
    "Layout check by picture, F and J bumps, finger colors, posture, eyes on screen",
  ),
  L(1, "Home row, left hand", "home", ["a", "s", "d", "f"]),
  L(2, "Home row, right hand", "home", ["j", "k", "l", ";"]),
  L(3, "Full home row", "home", ["g", "h", " "]),
  L(4, "Top row, index fingers", "top", ["r", "t", "y", "u"]),
  L(5, "Top row, full", "top", ["q", "w", "e", "i", "o", "p"]),
  L(6, "Bottom row", "bottom", ["z", "x", "c", "v", "b", "n", "m", ",", "."]),
  L(7, "Capitals", "beyond", ["Shift"], "Shift with the opposite hand"),
  L(8, "Punctuation", "beyond", ["'", "?", "!", ":", '"', "-"]),
  L(9, "Numbers, left", "beyond", ["1", "2", "3", "4", "5"]),
  L(10, "Numbers, right", "beyond", ["6", "7", "8", "9", "0"]),
  L(11, "Symbols", "beyond", ["$", "%", "&", "(", ")", "/", "@", "#"]),
  L(12, "Real-world strings", "beyond", [], "Addresses, dates, money, codes"),
  L(13, "Common pairs", "beyond", ["th", "he", "in", "er", "an", "re", "on"], "(rollover)"),
]);

const BY_ID = new Map(LADDER.map((l) => [l.id, l]));

/**
 * A lesson by id.
 * @param {string} id
 * @returns {Lesson}
 * @throws {RangeError} For an id that is not on the ladder.
 */
export function lessonById(id) {
  const l = BY_ID.get(id);
  if (!l) throw new RangeError(`"${id}" is not a lesson`);
  return l;
}

/**
 * The keys a lesson may use (Req 1.2): its new keys and every earlier lesson's, single
 * characters only, with space from Lesson 1 on. Sorted, space first.
 * @param {string} id
 * @returns {string[]}
 */
export function learnedKeys(id) {
  const { n } = lessonById(id);
  const keys = new Set(n >= 1 ? [" "] : []);
  for (const l of LADDER) {
    if (l.n > n) break;
    for (const k of l.keys) if ([...k].length === 1) keys.add(k);
  }
  return [...keys].sort();
}

/** The keys learned before a lesson: the previous lesson's learned keys (none before 0). */
export const keysBefore = (id) => {
  const { n } = lessonById(id);
  return n === 0 ? [] : learnedKeys(LADDER[n - 1].id);
};

/** The built lessons, 0 to 6. */
export const BUILT = Object.freeze(LADDER.filter((l) => l.built));
