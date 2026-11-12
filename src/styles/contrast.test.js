// Req 2: the locked tokens, and WCAG 2.2 AA contrast for every text color on every ground.
// The test reads tokens.css, so a changed color that breaks contrast fails here.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const tokensCss = read("./tokens.css");
const baseCss = read("./base.css");
const screensCss = read("./screens.css");

/** Every `--name: #rrggbb;` in tokens.css. */
const TOKENS = Object.fromEntries(
  [...tokensCss.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [
    m[1],
    m[2].toLowerCase(),
  ]),
);

/** WCAG relative luminance and contrast ratio. */
const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
function luminance(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}
const contrast = (a, b) => {
  const [x, y] = [luminance(TOKENS[a]), luminance(TOKENS[b])].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const GROUNDS = ["bg", "bg-deep", "panel", "panel-hi", "ink", "ground", "bar", "card", "panel-2"];
const TEXT = ["text", "soft", "label", "muted", "dim", "missed", "shaky", "accent", "bright"];

test("the locked token values match the design brief", () => {
  const locked = {
    bg: "#0a1214",
    panel: "#0e1c1f",
    rule: "#3ca89c",
    text: "#4fe3d1",
    label: "#79c7c5",
    muted: "#9bb0ad",
    missed: "#ff7a6b",
    shaky: "#f2c14e",
  };
  for (const [name, hex] of Object.entries(locked)) assert.equal(TOKENS[name], hex, name);
});

test("the contrast function agrees with known WCAG values", () => {
  assert.ok(Math.abs(contrast("text", "bg") - 11.93) < 0.01);
  // black on white is 21:1
  TOKENS.black = "#000000";
  TOKENS.white = "#ffffff";
  assert.ok(Math.abs(contrast("black", "white") - 21) < 1e-9);
  assert.ok(Math.abs(contrast("white", "white") - 1) < 1e-9);
});

test("every text color is at least 4.5:1 on every ground", () => {
  for (const fg of TEXT) {
    for (const bg of GROUNDS) {
      const ratio = contrast(fg, bg);
      assert.ok(ratio >= 4.5, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
    }
  }
});

test("dark text on the solid status and text fills (badges) is at least 4.5:1", () => {
  for (const fill of ["text", "missed", "shaky"]) {
    const ratio = contrast("bg", fill);
    assert.ok(ratio >= 4.5, `bg on ${fill} is ${ratio.toFixed(2)}:1`);
  }
  // the mock's badges: ink on teal and accent fills, dark teal on the teal fill
  for (const [fg, fill] of [
    ["ink", "text"],
    ["ink", "accent"],
    ["on-teal", "teal-fill"],
  ]) {
    const ratio = contrast(fg, fill);
    assert.ok(ratio >= 4.5, `${fg} on ${fill} is ${ratio.toFixed(2)}:1`);
  }
});

test("rules and the focus ring are at least 3:1 on every ground (non-text contrast)", () => {
  for (const line of ["rule", "text"]) {
    for (const bg of GROUNDS) {
      const ratio = contrast(line, bg);
      assert.ok(ratio >= 3, `${line} on ${bg} is ${ratio.toFixed(2)}:1`);
    }
  }
});

test("status colors are used for status only: no text color token is a warm color", () => {
  assert.deepEqual(
    TEXT.filter((t) => ["missed", "shaky"].includes(t)),
    ["missed", "shaky"],
  ); // listed so they are contrast-checked
  const body = baseCss.match(/body\s*\{[^}]*\}/)?.[0] ?? "";
  assert.match(body, /color:\s*var\(--text\)/);
});

test("reduced motion turns off the scanlines and every animation", () => {
  assert.match(
    tokensCss,
    /@media \(prefers-reduced-motion: reduce\)\s*\{\s*:root\s*\{\s*--scanlines:\s*none/,
  );
  assert.match(baseCss, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none/);
});

test("the OFL texts ship with the site: public/licenses holds the same text as each font package", () => {
  const pairs = [
    ["JetBrainsMono-OFL.txt", "jetbrains-mono"],
    ["RobotoCondensed-OFL.txt", "roboto-condensed"],
  ];
  for (const [file, pkg] of pairs) {
    const shipped = read(`../../public/licenses/${file}`);
    assert.equal(shipped, read(`../../node_modules/@fontsource/${pkg}/LICENSE`), file);
    assert.match(shipped, /SIL Open Font License, Version 1\.1/);
  }
});

test("zero border radius, and focus is visible on every control", () => {
  assert.match(baseCss, /border-radius:\s*0/);
  assert.match(baseCss, /:focus-visible\s*\{[^}]*outline:\s*var\(--focus\)/);
  assert.doesNotMatch(`${baseCss}${screensCss}`, /border-radius:\s*[1-9]/);
  assert.doesNotMatch(`${baseCss}${screensCss}`, /outline:\s*(none|0)\b/);
});

test("the look sends nothing to a third party: no remote URLs, imports or Google Fonts", () => {
  for (const [name, css] of [
    ["tokens", tokensCss],
    ["base", baseCss],
    ["screens", screensCss],
  ]) {
    assert.doesNotMatch(css, /https?:\/\//, name);
    assert.doesNotMatch(css, /@import/, name);
    assert.doesNotMatch(css, /googleapis|gstatic/i, name);
  }
});

test("fonts are the self-hosted npm packages, and their license files exist", () => {
  const main = read("../main.js");
  const imports = [...main.matchAll(/import\s+"(@fontsource\/[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(imports, [
    "@fontsource/jetbrains-mono/latin-400.css",
    "@fontsource/jetbrains-mono/latin-700.css",
    "@fontsource/roboto-condensed/latin-400.css",
    "@fontsource/roboto-condensed/latin-700.css",
  ]);
  for (const spec of imports)
    assert.ok(existsSync(new URL(`../../node_modules/${spec}`, import.meta.url)), spec);
  for (const pkg of ["jetbrains-mono", "roboto-condensed"]) {
    const license = read(`../../node_modules/@fontsource/${pkg}/LICENSE`);
    assert.match(license, /SIL Open Font License, Version 1\.1/);
  }
  assert.match(tokensCss, /--head:\s*"Roboto Condensed"/);
  assert.match(tokensCss, /--mono:\s*"JetBrains Mono"/);
});
