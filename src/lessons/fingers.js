// Which finger types each key on a US keyboard (lessons design: Fingers), and the home-row key
// that finger rests on. The lesson keyboard colors keys by finger; the generator anchors each
// new-key pattern on its finger's home key. Pure data.

/** Finger by key, exactly as design.md lists it. Thumbs: space. */
const TABLE = Object.freeze({
  "left pinky": "qaz",
  "left ring": "wsx",
  "left middle": "edc",
  "left index": "rfvtgb",
  "right index": "yhnujm",
  "right middle": "ik,",
  "right ring": "ol.",
  "right pinky": "p;",
  thumbs: " ",
});

/** The home-row key each finger rests on. */
const HOME = Object.freeze({
  "left pinky": "a",
  "left ring": "s",
  "left middle": "d",
  "left index": "f",
  "right index": "j",
  "right middle": "k",
  "right ring": "l",
  "right pinky": ";",
});

const BY_KEY = new Map(
  Object.entries(TABLE).flatMap(([finger, keys]) => [...keys].map((k) => [k, finger])),
);

/** The finger for a key, such as "left index" or "thumbs"; null for a key not in the table. */
export const fingerOf = (key) => BY_KEY.get(key) ?? null;

/** The finger's name without the hand, for the keyboard's colors: "pinky" to "index", "thumb". */
export function fingerKind(key) {
  const f = fingerOf(key);
  if (f === null) return null;
  return f === "thumbs" ? "thumb" : f.split(" ")[1];
}

/**
 * The home key a new-key pattern is anchored on: the key's own finger's home key; a home key
 * itself is anchored on its hand's index home key (F or J), and F and J on each other.
 * Space and keys not in the table have none.
 */
export function anchorOf(key) {
  const f = fingerOf(key);
  if (f === null || f === "thumbs") return null;
  const home = HOME[f];
  if (home !== key) return home;
  const index = f.startsWith("left") ? "f" : "j";
  if (index !== key) return index;
  return key === "f" ? "j" : "f";
}

/** Every key in the table, for tests. */
export const FINGER_KEYS = Object.freeze([...BY_KEY.keys()]);
