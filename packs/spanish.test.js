// The Spanish word pack (spanish Req 1): passes the contract and the pack validator, every item in
// the charset, every dead key the PRD names (á é í ó ú ñ ü ¿ ¡) drilled, nothing from the
// blocklist, no duplicates, and the file is exactly what the build makes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validate } from "../contract/validate.js";
import { parseBlocklist } from "../scripts/build-pack.js";
import {
  ATTRIBUTION,
  CHARSET,
  MARKED,
  makeSpanishPack,
  pickSpanish,
  WORD_COUNT,
} from "../scripts/build-pack-es.js";
import { checkPack } from "../src/packs/checkPack.js";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const pack = JSON.parse(read("./spanish.json"));
const texts = pack.pools.words.map((w) => w.text);
const blocked = parseBlocklist(read("./blocklist-es.txt"));

test("the pack passes the contract and the pack validator", () => {
  assert.equal(validate("Pack", pack).status, "valid");
  assert.deepEqual(checkPack(pack), []);
});

test("id, language, license and attribution", () => {
  assert.deepEqual([pack.id, pack.name, pack.lang], ["spanish", "Español", "es"]);
  assert.equal(pack.license, "CC BY-SA 4.0");
  assert.equal(pack.attribution, ATTRIBUTION);
  assert.equal(pack.charset, CHARSET);
});

test("1,400 frequency words plus the written ¿…? and ¡…! words, no duplicates", () => {
  assert.equal(texts.length, WORD_COUNT + MARKED.length);
  assert.equal(new Set(texts).size, texts.length);
  for (const m of MARKED) assert.ok(texts.includes(m), m);
});

test("every dead key the PRD names is in the pack", () => {
  for (const c of "áéíóúñü¿¡")
    assert.ok(
      texts.some((t) => t.includes(c)),
      c,
    );
  assert.ok(texts.filter((t) => /[áéíóúñü]/.test(t)).length >= 200, "plenty of accented words");
});

test("nothing from the blocklist; every frequency word is 3 to 9 letters", () => {
  assert.deepEqual(
    texts.filter((t) => blocked.has(t)),
    [],
  );
  for (const t of texts.slice(0, WORD_COUNT)) assert.match(t, /^[a-zñáéíóúü]{3,9}$/, t);
});

test("the file is what the build makes from its sources", () => {
  const lines = (p) => read(p).split(/\r?\n/);
  const words = pickSpanish(
    lines("./source/es_frequencywords_top8000.txt"),
    new Set(lines("./source/es_spelled.txt")),
    blocked,
  );
  assert.deepEqual(makeSpanishPack(words), pack);
});
