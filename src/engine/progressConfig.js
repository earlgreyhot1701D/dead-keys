// Every Block 3 threshold, band and key group, named, in one place (US QWERTY, PRD G7).

/** Attempts a key needs before it gets a band. Below this it is "no data". */
export const MIN_KEY_ATTEMPTS = 10;

/**
 * The heat bands, worst to best, then "no data". A key lands in the first band whose `min` its
 * miss rate reaches. Glyphs mean color is never the only signal; labels say where the key is
 * heading, not where it failed. Internal names stay for code and the "How we count" page.
 */
export const BANDS = Object.freeze([
  Object.freeze({ name: "missed", min: 0.15, glyph: "!", label: "Focus here" }),
  Object.freeze({ name: "shaky", min: 0.08, glyph: "~", label: "Practicing" }),
  Object.freeze({ name: "uneven", min: 0.03, glyph: "?", label: "Almost there" }),
  Object.freeze({ name: "steady", min: 0, glyph: "✓", label: "Steady" }),
  Object.freeze({ name: "noData", min: null, glyph: "·", label: "Not enough yet" }),
]);

/** A group needs this many attempts, in total, before it can be flagged. */
export const GROUP_MIN_ATTEMPTS = 20;
/** A group is flagged at this many times the player's overall miss rate... */
export const GROUP_RATIO = 2;
/** ...and is "high" severity at this many (medium below it). */
export const HIGH_RATIO = 3;
/** ...and only if the group itself misses at least this share of its keys. */
export const GROUP_FLOOR = 0.05;
/** Most diagnosis sentences and most weak keys (the contract's Diagnosis maxItems). */
export const MAX_SENTENCES = 3;
export const MAX_WEAK_KEYS = 6;

/** Total attempts before the diagnosis says anything (about one minute of calibration). */
export const ENOUGH_DATA = 100;

/** A personal best needs at least this accuracy, so speed never beats accuracy. */
export const BEST_ACCURACY = 0.9;
/** Milestone: this many rounds in a row at STREAK_ACCURACY or better. */
export const STREAK_ROUNDS = 3;
export const STREAK_ACCURACY = 0.95;
/** Milestone: this many local days in a row with at least one round. */
export const STREAK_DAYS = 7;
/** Milestone: a WPM band every this many words per minute (10, 20, 30 ...). */
export const WPM_BAND = 10;

// Shifted symbols and the key they share on a US keyboard. A shifted key counts toward its
// base key's row and hand, as well as the shift group (design decision 2).
const SHIFTED = Object.freeze({
  "!": "1",
  "@": "2",
  "#": "3",
  $: "4",
  "%": "5",
  "^": "6",
  "&": "7",
  "*": "8",
  "(": "9",
  ")": "0",
  "~": "`",
  _: "-",
  "+": "=",
  "{": "[",
  "}": "]",
  "|": "\\",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "?": "/",
});

/** The key as it sits unshifted: A -> a, ! -> 1, : -> ;. */
const baseOf = (k) => SHIFTED[k] ?? k.toLowerCase();
const isLetter = (k) => /^\p{L}$/u.test(k);
const isCapital = (k) => isLetter(k) && k !== k.toLowerCase();
const onRow = (keys) => {
  const set = new Set(keys);
  return (k) => set.has(baseOf(k));
};

/**
 * Key groups for the diagnosis. `has(key)` takes one character. A key can sit in more than one
 * group (a row and a hand). Space is in none. Keys with no base on these rows, such as the
 * apostrophe or an accented letter, are only in the groups their kind allows (symbols, shift).
 * `phrase` is how the group is named in a sentence.
 */
export const GROUPS = Object.freeze([
  Object.freeze({ id: "topRow", phrase: "top row", has: onRow("qwertyuiop") }),
  Object.freeze({ id: "homeRow", phrase: "home row", has: onRow("asdfghjkl;") }),
  Object.freeze({ id: "bottomRow", phrase: "bottom row", has: onRow("zxcvbnm,./") }),
  Object.freeze({ id: "leftHand", phrase: "left hand", has: onRow("qwertasdfgzxcvb12345") }),
  Object.freeze({ id: "rightHand", phrase: "right hand", has: onRow("yuiophjklnm67890;,./") }),
  Object.freeze({
    id: "shift",
    phrase: "shift keys",
    has: (k) => isCapital(k) || Object.hasOwn(SHIFTED, k),
  }),
  Object.freeze({ id: "digits", phrase: "digits", has: (k) => /^[0-9]$/.test(k) }),
  Object.freeze({
    id: "symbols",
    phrase: "symbols",
    has: (k) => !isLetter(k) && !/^[0-9]$/.test(k) && k !== " ",
  }),
]);
