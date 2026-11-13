// Job: check a word pack before it ships (spanish Req 3; PRD G2 "community pack format plus
// validator"). Pure: a parsed pack in, a list of problems out, each with where and what. First
// the frozen contract (shape, charset), then what the game itself needs from a pack.
import { validate } from "../../contract/validate.js";

/** The fewest words a pack needs: enough for a full wave with no repeats on screen. */
export const MIN_WORDS = 20;
/** The longest item the play field can show on one card. */
export const MAX_TEXT = 14;
const LANG = /^[a-z]{2,3}(-[A-Z]{2})?$/;

/**
 * @param {unknown} pack A parsed pack file.
 * @returns {{ path: string, message: string }[]} Empty when the pack is good.
 */
export function checkPack(pack) {
  const contract = validate("Pack", pack);
  if (contract.status !== "valid") return contract.errors;
  const out = [];
  const bad = (path, message) => out.push({ path, message });
  if (!LANG.test(pack.lang))
    bad("lang", `"${pack.lang}" is not a language code like "es" or "pt-BR"`);
  if (new Set(pack.charset).size !== [...pack.charset].length)
    bad("charset", "has a character twice");
  const words = pack.pools.words;
  if (!Array.isArray(words)) bad("pools.words", "is required: the games spawn from it");
  else if (words.length < MIN_WORDS)
    bad("pools.words", `${words.length} items, min is ${MIN_WORDS}`);
  const ids = new Set();
  for (const [name, items] of Object.entries(pack.pools)) {
    const texts = new Set();
    for (const [i, it] of items.entries()) {
      const at = `pools.${name}[${i}]`;
      if (ids.has(it.id)) bad(`${at}.id`, `"${it.id}" is used twice`);
      ids.add(it.id);
      if (texts.has(it.text)) bad(`${at}.text`, `"${it.text}" is in this pool twice`);
      texts.add(it.text);
      if ([...it.text].length > MAX_TEXT) bad(`${at}.text`, `longer than ${MAX_TEXT} characters`);
      if (it.text !== it.text.trim()) bad(`${at}.text`, "starts or ends with a space");
      if (it.kind === "word" && /\s/.test(it.text)) bad(`${at}.text`, "a word has no spaces");
    }
  }
  const allOriginal = Object.values(pack.pools).every((items) =>
    items.every((it) => /original/i.test(it.source)),
  );
  if (!allOriginal && pack.attribution.trim() === "")
    bad("attribution", "is required when any item comes from someone else's work");
  return out;
}
