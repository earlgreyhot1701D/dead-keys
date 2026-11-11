// Checks every fixture against the contract and prints one line each.
// Read-only, no network. Exit 0 only if every fixture matches its expectation.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseAndValidate, validate } from "../contract/validate.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures");
const SHAPES = [
  "Pack",
  "Item",
  "KeyStat",
  "Keystroke",
  "RoundResult",
  "Progress",
  "GhostRun",
  "Diagnosis",
  "DrillRequest",
  "DrillResponse",
  "Milestone",
];
const EXPECTS = ["valid", "invalid", "needs-migration"];

/** @typedef {{ name: string, shape?: string, expected: string, actual: string, pass: boolean, detail: string[] }} FixtureResult */

const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

/** Problems with the wrapper itself (design.md, fixture file format). */
function wrapperProblems(w, dir) {
  const bad = [];
  if (!SHAPES.includes(w.shape)) bad.push(`shape "${w.shape}" is not one of the 11 shapes`);
  if (!EXPECTS.includes(w.expect))
    bad.push(`expect "${w.expect}" is not valid, invalid or needs-migration`);
  if (dir === "normal" && w.expect !== "valid") bad.push("normal fixtures must expect valid");
  if (w.expect === "invalid" && !(typeof w.reason === "string" && w.reason))
    bad.push("invalid fixtures need a reason");
  if (
    "expectError" in w &&
    !(w.expect === "invalid" && w.expectError && typeof w.expectError === "string")
  )
    bad.push("expectError must be a non-empty phrase, and only on invalid fixtures");
  if ("value" in w === "raw" in w) bad.push("needs exactly one of value or raw");
  if ("raw" in w && typeof w.raw !== "string") bad.push("raw must be a string");
  return bad;
}

/** Charset from the named pack fixture in fixtures/normal/, or throws. */
function charsetOf(packName) {
  const pack = JSON.parse(readFileSync(join(ROOT, "normal", `${packName}.json`), "utf8"));
  const charset = pack?.value?.charset;
  if (typeof charset !== "string") throw new Error(`pack fixture "${packName}" has no charset`);
  return charset;
}

/** Check one fixture file. Never throws. */
function checkOne(dir, file) {
  const name = `${dir}/${file.replace(/\.json$/, "")}`;
  let w;
  let shape;
  const fail = (expected, actual, detail = []) => ({
    name,
    shape,
    expected,
    actual,
    pass: false,
    detail,
  });
  try {
    w = JSON.parse(readFileSync(join(ROOT, dir, file), "utf8"));
  } catch {
    return fail("?", "invalid: not JSON");
  }
  if (!isObj(w)) return fail("?", "bad wrapper", ["fixture file must be a JSON object"]);
  shape = w.shape;
  const bad = wrapperProblems(w, dir);
  if (bad.length) return fail(String(w.expect), "bad wrapper", bad);
  try {
    const ctx = w.pack ? { charset: charsetOf(w.pack) } : {};
    const r = "raw" in w ? parseAndValidate(w.shape, w.raw, ctx) : validate(w.shape, w.value, ctx);
    const detail = r.errors.map((e) => `${e.path || "(root)"}: ${e.message}`);
    // expectError stops an invalid fixture passing for the wrong reason.
    const wrongReason = w.expectError && !detail.some((d) => d.includes(w.expectError));
    if (wrongReason) detail.push(`no error contains "${w.expectError}"`);
    const pass = r.status === w.expect && !wrongReason;
    return { name, shape, expected: w.expect, actual: r.status, pass, detail };
  } catch (e) {
    return fail(w.expect, "error", [e.message]);
  }
}

/** Files in a fixtures folder. A missing folder counts as empty. */
function jsonFiles(dir) {
  try {
    return readdirSync(join(ROOT, dir))
      .filter((f) => f.endsWith(".json"))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Run every fixture in fixtures/normal and fixtures/ugly.
 * @returns {{ ok: boolean, results: FixtureResult[] }}
 */
export function checkAll() {
  const results = [];
  for (const dir of ["normal", "ugly"]) {
    const files = jsonFiles(dir);
    // A deleted or emptied folder must not read as "all pass".
    if (files.length === 0) {
      results.push({
        name: `${dir}/(folder)`,
        expected: "fixtures",
        actual: "missing or empty",
        pass: false,
        detail: [],
      });
    }
    for (const file of files) results.push(checkOne(dir, file));
  }
  // Req 5.1: at least one passing normal fixture per shape, read from each wrapper's shape field.
  const have = new Set(
    results.filter((r) => r.pass && r.name.startsWith("normal/")).map((r) => r.shape),
  );
  const missing = SHAPES.filter((s) => !have.has(s));
  results.push({
    name: "normal/coverage",
    expected: "11 shapes",
    actual: missing.length ? `missing ${missing.join(", ")}` : "11 shapes",
    pass: missing.length === 0,
    detail: [],
  });
  return { ok: results.every((r) => r.pass), results };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ok, results } = checkAll();
  for (const r of results) {
    console.log(
      `${r.pass ? "PASS" : "FAIL"}  ${r.name}  expected: ${r.expected}  actual: ${r.actual}`,
    );
    if (!r.pass) for (const d of r.detail) console.log(`        ${d}`);
  }
  const failed = results.filter((r) => !r.pass).length;
  console.log(
    ok ? `\nAll ${results.length} checks pass.` : `\n${failed} of ${results.length} checks FAIL.`,
  );
  process.exitCode = ok ? 0 : 1;
}
