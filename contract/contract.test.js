// PASS line for Block 1: every fixture matches its expectation, and no out-of-charset
// character gets through a DrillResponse (PRD G12).
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { checkAll } from "../scripts/check-fixtures.js";
import { loadSchemas } from "./schemas.js";
import { validate } from "./validate.js";

test("schemas.js lists exactly the files in contract/schemas/", () => {
  // schemas.js imports each file by name (no node:fs), so a new file must be added there too.
  const onDisk = readdirSync(new URL("./schemas/", import.meta.url))
    .filter((f) => f.endsWith(".json"))
    .sort();
  assert.deepEqual([...loadSchemas().keys()].sort(), onDisk);
});

test("every fixture matches its expectation", () => {
  const { ok, results } = checkAll();
  const failed = results.filter((r) => !r.pass).map((r) => `${r.name}: ${r.actual}`);
  assert.ok(results.length > 0, "no fixtures were checked");
  assert.ok(ok, `fixtures failed:\n${failed.join("\n")}`);
});

const packUrl = new URL("../fixtures/normal/pack.mini.json", import.meta.url);
const charset = JSON.parse(readFileSync(packUrl, "utf8")).value.charset;
const inCharset = fc.constantFrom(...charset);
const goodChars = fc.array(inCharset, { maxLength: 30 }).map((a) => a.join(""));
// Any code point outside the charset, except lone surrogates (not real text).
const badChar = fc
  .integer({ min: 0, max: 0x10ffff })
  .filter((c) => !(c >= 0xd800 && c <= 0xdfff) && !charset.includes(String.fromCodePoint(c)))
  .map((c) => String.fromCodePoint(c));

test("a DrillResponse line with a character outside the charset is rejected", () => {
  fc.assert(
    fc.property(goodChars, badChar, goodChars, (before, bad, after) => {
      // At most 61 characters, so a rejection can only come from the charset rule.
      const line = before + bad + after;
      const r = validate("DrillResponse", { lines: [line], source: "ai" }, { charset });
      assert.equal(r.status, "invalid");
      assert.ok(r.errors.some((e) => e.message.includes("not in the pack charset")));
      // Control: the same line without the bad character is accepted.
      const clean = before + after;
      if (clean.length > 0) {
        assert.equal(
          validate("DrillResponse", { lines: [clean], source: "ai" }, { charset }).status,
          "valid",
        );
      }
    }),
  );
});
