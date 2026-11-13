// Req 1.3 and the PRD G15 rules for the whole UI: no innerHTML, no eval, nothing from fixtures or
// the mock, and a page that asks no third party for anything. Scans the source, comments aside.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const SRC = new URL("../", import.meta.url);
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

/** Every non-test .js file under src/. */
const files = readdirSync(SRC, { recursive: true })
  .filter((f) => f.endsWith(".js") && !f.endsWith(".test.js"))
  .map((f) => [f.replaceAll("\\", "/"), stripComments(readFileSync(new URL(f, SRC), "utf8"))]);

const FORBIDDEN = [
  /\.innerHTML\b/,
  /\.outerHTML\b/,
  /insertAdjacentHTML/,
  /document\.write/,
  /\beval\s*\(/,
  /new Function\s*\(/,
  /setTimeout\s*\(\s*["'`]/,
  /\.srcdoc\b/, // assigning it; dom.js names it only to ban it
];

test("the scan sees the UI files", () => {
  const names = files.map(([n]) => n);
  assert.ok(names.includes("ui/dom.js"));
  assert.ok(names.includes("main.js"));
});

test("the scan itself catches what it should", () => {
  const code = "node.innerHTML = x; eval('1'); document.write(y); new Function('a');";
  assert.ok(FORBIDDEN.filter((re) => re.test(stripComments(code))).length >= 4);
  assert.equal(
    FORBIDDEN.filter((re) => re.test(stripComments("// innerHTML is banned\nconst a = 1;"))).length,
    0,
  );
});

test("no source file uses innerHTML, eval or document.write", () => {
  for (const [name, code] of files) {
    for (const re of FORBIDDEN) assert.doesNotMatch(code, re, `${name}: ${re}`);
  }
});

test("nothing in src/ imports from fixtures/ or mock/ (mock data never ships)", () => {
  for (const [name, code] of files) {
    assert.doesNotMatch(code, /from\s+["'][^"']*\/(fixtures|mock)\//, name);
    assert.doesNotMatch(code, /import\(\s*["'][^"']*\/(fixtures|mock)\//, name);
  }
});

test("the engine and contract source import nothing from the UI", () => {
  for (const [name, code] of files.filter(([n]) => /^(engine|storage)\//.test(n))) {
    assert.doesNotMatch(code, /from\s+["'][^"']*\/ui\//, name);
  }
});

test("index.html: English, one app root, a polite live region, no remote or inline code", () => {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<div id="app">/);
  assert.match(html, /<div id="live"[^>]*aria-live="polite"/);
  assert.match(html, /<noscript>/);
  // Remote links for people and crawlers (a, canonical) are fine; remote code or styles are not.
  assert.doesNotMatch(html, /\ssrc="https?:/);
  assert.doesNotMatch(html, /<link(?![^>]*rel="canonical")[^>]*href="https?:/);
  // Every script has a src (no inline code), except JSON-LD, which is data the browser never runs.
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")/);
  assert.doesNotMatch(html, /\son[a-z]+=/i);
  assert.doesNotMatch(html, /googleapis|gstatic/i);
});
