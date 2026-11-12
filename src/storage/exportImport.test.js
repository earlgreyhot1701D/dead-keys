// Req 6: export and import. Round trip, junk, and the 2 MB limit.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { exportText, importText, MAX_IMPORT_BYTES } from "./exportImport.js";
import { freshProgress } from "./migrate.js";
import { vet } from "./vet.js";

const NOW = 1_800_000_000_000;
const wrapper = (path) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${path}`, import.meta.url), "utf8"));
const fixture = (path) => wrapper(path).value;
const basic = () => structuredClone(fixture("normal/progress.basic.json"));
const full = () => structuredClone(fixture("ugly/progress.200-rounds-all-keys.json"));
const bytes = (s) => new TextEncoder().encode(s).length;

/** A valid progress padded with a settings string so its export is exactly `size` bytes. */
function paddedTo(size) {
  const p = basic();
  p.settings = { pad: "" };
  const base = bytes(JSON.stringify(p));
  p.settings.pad = "x".repeat(size - base);
  return p;
}

test("export then import gives back an equal progress, for the real shapes of save", () => {
  for (const p of [
    basic(),
    full(),
    freshProgress(NOW),
    fixture("ugly/progress.zero-rounds.json"),
  ]) {
    assert.deepEqual(importText(exportText(p), NOW), { ok: true, progress: p });
  }
});

test("export then import round-trips random settings and any number of rounds", () => {
  const settings = fc
    .dictionary(fc.string({ maxLength: 8 }), fc.jsonValue({ maxDepth: 3 }), { maxKeys: 6 })
    .filter((s) => vet({ settings: s }).length === 0)
    // Real settings are plain JSON; fast-check makes null-prototype objects and -0.
    .map((s) => JSON.parse(JSON.stringify(s)));
  fc.assert(
    fc.property(settings, fc.integer({ min: 0, max: 200 }), (s, n) => {
      const p = full();
      p.rounds = p.rounds.slice(0, n);
      p.settings = s;
      const back = importText(exportText(p), NOW);
      assert.equal(back.ok, true);
      assert.deepEqual(back.progress, p);
    }),
  );
});

test("export is one line of JSON, and the text is under the import limit even for a full save", () => {
  const text = exportText(full());
  assert.equal(text.includes("\n"), false);
  assert.ok(bytes(text) < MAX_IMPORT_BYTES);
  assert.deepEqual(JSON.parse(text), full());
});

test("export refuses progress that is invalid, or too big to restore", () => {
  const noStreak = basic();
  delete noStreak.dayStreak;
  const badDay = basic();
  badDay.dayStreak = { lastDay: "2026-02-30", count: 1 };
  for (const bad of [noStreak, badDay, null, undefined, 5, "text", [], {}]) {
    assert.throws(() => exportText(bad), RangeError);
  }
  assert.throws(() => exportText(paddedTo(MAX_IMPORT_BYTES + 1)), RangeError);
  assert.doesNotThrow(() => exportText(paddedTo(MAX_IMPORT_BYTES)));
});

test("export never changes its input", () => {
  const p = Object.freeze(structuredClone(basic()));
  exportText(p);
});

test("import accepts text of exactly 2 MB and refuses one byte more", () => {
  const atLimit = JSON.stringify(paddedTo(MAX_IMPORT_BYTES));
  assert.equal(bytes(atLimit), MAX_IMPORT_BYTES);
  assert.equal(importText(atLimit, NOW).ok, true);
  const over = JSON.stringify(paddedTo(MAX_IMPORT_BYTES + 1));
  assert.equal(bytes(over), MAX_IMPORT_BYTES + 1);
  const r = importText(over, NOW);
  assert.equal(r.ok, false);
  assert.match(r.reason, /too big/);
});

test("the size is measured in UTF-8 bytes, not characters", () => {
  const euros = "€".repeat(700_000); // 700,000 characters, 2,100,000 bytes
  assert.ok(euros.length < MAX_IMPORT_BYTES && bytes(euros) > MAX_IMPORT_BYTES);
  assert.match(importText(euros, NOW).reason, /too big/);
});

test("an oversize text is refused before it is parsed", () => {
  const real = JSON.parse;
  let parsed = 0;
  JSON.parse = (...args) => {
    parsed++;
    return real(...args);
  };
  try {
    assert.equal(importText("x".repeat(MAX_IMPORT_BYTES + 1), NOW).ok, false);
    assert.equal(importText("€".repeat(700_000), NOW).ok, false);
    assert.equal(parsed, 0);
    importText("{}", NOW);
    assert.equal(parsed, 1); // the spy does count real parses
  } finally {
    JSON.parse = real;
  }
});

test("an older backup is upgraded; a newer one is refused with advice to refresh", () => {
  const old = importText(JSON.stringify(fixture("ugly/progress.old-schema.json")), NOW);
  assert.equal(old.ok, true);
  assert.equal(validate("Progress", old.progress).status, "valid");
  assert.equal(old.progress.createdAt, NOW);
  const newer = importText(JSON.stringify({ ...basic(), schemaVersion: 2 }), NOW);
  assert.equal(newer.ok, false);
  assert.match(newer.reason, /newer version of Dead Keys\. Refresh/);
});

test("files that are not a good backup are refused with a plain reason, and nothing leaks in", () => {
  const noStreak = basic();
  delete noStreak.dayStreak;
  const badDay = basic();
  badDay.dayStreak = { lastDay: "2026-02-30", count: 1 };
  const proto = '{"schemaVersion":1,"settings":{"__proto__":{"x":1}}}';
  const cases = [
    JSON.stringify(noStreak),
    JSON.stringify(badDay),
    proto,
    wrapper("ugly/progress.corrupted-json.json").raw,
    "",
    "   ",
    "null",
    "42",
    "[]",
    "{}",
    '{"schemaVersion":"1"}',
    "<html>not a backup</html>",
  ];
  for (const text of cases) {
    const r = importText(text, NOW);
    assert.equal(r.ok, false, text);
    assert.equal(typeof r.reason, "string");
    assert.doesNotMatch(r.reason, /[{}[\]]|__proto__|schemaVersion|dayStreak|\(root\)/, text);
  }
});

test("things that are not text are refused", () => {
  for (const x of [null, undefined, 5, {}, [], true, new Uint8Array(4)]) {
    assert.deepEqual(importText(x, NOW), { ok: false, reason: "That isn't a backup file." });
  }
});

test("a leading byte order mark is allowed", () => {
  assert.equal(importText(`\uFEFF${exportText(basic())}`, NOW).ok, true);
});

test("random text never crashes import, and anything accepted is usable", () => {
  const texts = fc.oneof(
    fc.string(),
    fc.string({ unit: "binary" }),
    fc.jsonValue().map((v) => JSON.stringify(v)),
    fc
      .integer({ min: 0, max: exportText(basic()).length })
      .map((n) => exportText(basic()).slice(0, n)),
  );
  fc.assert(
    fc.property(texts, (text) => {
      const r = importText(text, NOW);
      if (r.ok) {
        assert.equal(validate("Progress", r.progress).status, "valid");
        assert.deepEqual(vet(r.progress), []);
      } else assert.equal(typeof r.reason, "string");
    }),
  );
});

test("a bad clock is a programmer error", () => {
  for (const now of [-1, 1.5, Number.NaN, "5", null, undefined]) {
    assert.throws(() => importText("{}", now), TypeError);
  }
});

test("every reason matches the shell design's copy table, word for word", () => {
  const doc = readFileSync(new URL("../../.kiro/specs/shell/design.md", import.meta.url), "utf8");
  const want = Object.fromEntries(
    doc
      .split("\n")
      .filter((l) => l.startsWith("| Reason:"))
      .map((l) => {
        const [label, text] = l
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        return [label.replace("Reason: ", ""), text];
      }),
  );
  assert.deepEqual(Object.keys(want), [
    "not text",
    "over 2 MB",
    "not JSON",
    "newer version",
    "anything else",
  ]);
  assert.equal(importText(null, NOW).reason, want["not text"]);
  assert.equal(importText("x".repeat(MAX_IMPORT_BYTES + 1), NOW).reason, want["over 2 MB"]);
  assert.equal(importText("not json", NOW).reason, want["not JSON"]);
  const newer = JSON.stringify({ ...basic(), schemaVersion: 2 });
  assert.equal(importText(newer, NOW).reason, want["newer version"]);
  assert.equal(importText("{}", NOW).reason, want["anything else"]);
});
