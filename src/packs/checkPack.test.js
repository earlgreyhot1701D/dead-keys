// The pack validator (spanish Req 3): a good pack passes; each problem a pack author could make is
// named with where it is; the CLI checks files, reports unreadable ones, and finds every pack.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkFile, packFiles } from "../../scripts/check-pack.js";
import { checkPack, MIN_WORDS } from "./checkPack.js";

const word = (i, text = `w${String.fromCharCode(97 + (i % 26))}${i}`) => ({
  id: `p-${i}`,
  text: text.replace(/\d/g, (d) => "abcdefghij"[d]),
  kind: "word",
  source: "original",
});
const good = () => ({
  id: "mine",
  name: "Mine",
  lang: "pt-BR",
  version: "1.0.0",
  license: "CC0",
  attribution: "",
  charset: "abcdefghijklmnopqrstuvwxyz",
  pools: { words: Array.from({ length: MIN_WORDS }, (_, i) => word(i)) },
  lessons: [],
});
const paths = (p) => checkPack(p).map((e) => `${e.path}: ${e.message}`);

test("a good pack passes", () => {
  assert.deepEqual(checkPack(good()), []);
});

test("the contract comes first: a missing field or a character outside the charset", () => {
  const p = good();
  delete p.license;
  assert.ok(paths(p).some((m) => m.startsWith("license")));
  const q = good();
  q.pools.words[0].text = "café";
  assert.ok(paths(q).some((m) => m.includes("not in the pack charset")));
});

test("what the game needs: a words pool big enough, unique ids and words, short words", () => {
  const few = good();
  few.pools.words = few.pools.words.slice(0, 5);
  assert.ok(paths(few).some((m) => m.startsWith("pools.words: 5 items")));
  const none = good();
  none.pools = { other: good().pools.words };
  assert.ok(paths(none).some((m) => m.startsWith("pools.words: is required")));
  const dup = good();
  dup.pools.words[1] = { ...dup.pools.words[0] };
  const msgs = paths(dup);
  assert.ok(msgs.some((m) => m.includes("is used twice")));
  assert.ok(msgs.some((m) => m.includes("in this pool twice")));
  const long = good();
  long.pools.words[0].text = "abcdefghijklmnop";
  assert.ok(paths(long).some((m) => m.includes("longer than 14")));
});

test("language code, charset repeats, and attribution when anything is borrowed", () => {
  const p = good();
  p.lang = "Spanish";
  p.charset = "aab";
  p.pools.words = p.pools.words.map((w, i) => ({ ...w, text: i % 2 ? "ab" : "ba", id: `x${i}` }));
  const msgs = paths(p);
  assert.ok(msgs.some((m) => m.startsWith("lang")));
  assert.ok(msgs.some((m) => m.startsWith("charset: has a character twice")));
  const b = good();
  b.pools.words[0].source = "Some list (CC BY 4.0)";
  assert.ok(paths(b).some((m) => m.startsWith("attribution")));
});

test("the CLI: OK for the shipped packs, FAIL with the problem for a bad file, exit codes", () => {
  const out = execFileSync("node", ["scripts/check-pack.js"], { encoding: "utf8" });
  assert.match(out, /OK .*general\.json: 1500 items/);
  assert.match(out, /OK .*spanish\.json: 1421 items/);
  assert.ok(
    packFiles().every((f) => !f.endsWith("lessonWords.json")),
    "only real packs",
  );
  const dir = mkdtempSync(join(tmpdir(), "pack-"));
  const broken = join(dir, "broken.json");
  writeFileSync(broken, "{ not json");
  assert.match(checkFile(broken).problems[0].message, /can't read it as JSON/);
  assert.throws(
    () => execFileSync("node", ["scripts/check-pack.js", broken], { encoding: "utf8" }),
    (err) => err.status === 1 && /FAIL/.test(err.stdout),
  );
});
