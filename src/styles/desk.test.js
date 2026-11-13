// The desk look (lessons design: Desk look): the tokens are the design's values, scoped to .desk
// so the play screens keep the arcade look, and every text pair is checked against WCAG AA
// (4.5:1 text, 3:1 key outlines and underlines). A pair that fails is not given a new color:
// it is listed in KNOWN_FAILS for Shara, and the test fails if that list ever changes.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const deskCss = read("./desk.css");
const hexes = (css) =>
  Object.fromEntries(
    [...css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [
      m[1],
      m[2].toLowerCase(),
    ]),
  );
const T = { ...hexes(read("./tokens.css")), ...hexes(deskCss) };

const channel = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const n = Number.parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
};
const ratio = (a, b) => {
  const [x, y] = [lum(T[a]), lum(T[b])].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const FINGERS = ["f-pinky", "f-ring", "f-middle", "f-index", "f-thumb"];
/** [foreground, ground, minimum, where the mock uses it]. */
const PAIRS = [
  ...["paper-ink", "paper-soft", "paper-label", "paper-todo", "paper-wrong", "paper-wait"].map(
    (fg) => [fg, "paper", 4.5, "text on the paper line and cards"],
  ),
  ["paper", "paper-ink", 4.5, "the paper card's primary button"],
  ...["text", "soft", "label", "muted", "accent", "paper"].map((fg) => [
    fg,
    "desk",
    4.5,
    "text on the desk",
  ]),
  ...FINGERS.map((fg) => [fg, "card", 4.5, "a key's letter in its finger color"]),
  ...FINGERS.map((fg) => [fg, "desk", 3, "a key's outline on the desk"]),
  ["paper-done", "paper", 3, "the typed part's underline"],
];
const name = ([fg, bg, min]) => `${fg} on ${bg} (${min}:1)`;

/** Pairs allowed to fail. None since Nov 12: paper-todo went from 2.65:1 to 4.80:1 (Shara). */
const KNOWN_FAILS = [];

test("the desk tokens are the design's values", () => {
  const design = read("../../.kiro/specs/lessons/design.md");
  const line = design.split("\n").find((l) => l.startsWith("Values from `mock/lessons.html`"));
  const listed = [...line.matchAll(/`--([a-z0-9-]+) (#[0-9a-f]{6})`/g)].map((m) => [m[1], m[2]]);
  assert.equal(listed.length, 16);
  for (const [k, v] of listed) assert.equal(hexes(deskCss)[k], v, k);
});

test("every desk token is scoped to .desk, so the play screens cannot change", () => {
  const rootBlocks = deskCss.match(/:root\s*\{/g);
  assert.equal(rootBlocks, null);
  const block = deskCss.match(/^\.desk\s*\{[^}]*\}/m)?.[0] ?? "";
  for (const k of Object.keys(hexes(deskCss))) assert.ok(block.includes(`--${k}:`), k);
  assert.match(deskCss, /\.desk \.scan\s*\{\s*display:\s*none/, "no scanlines on lesson screens");
});

test("contrast: every pair passes WCAG AA, except the ones listed for Shara", () => {
  const fails = PAIRS.filter(([fg, bg, min]) => ratio(fg, bg) < min).map(name);
  for (const p of PAIRS) console.log(`${ratio(p[0], p[1]).toFixed(2)}:1  ${name(p)}  ${p[3]}`);
  assert.deepEqual(fails, KNOWN_FAILS);
});

test("the wrong key and the waiting letter never rely on color alone", () => {
  assert.match(deskCss, /\.ch-wrong\s*\{[^}]*text-decoration:\s*line-through/);
  assert.match(deskCss, /\.ch-wait\s*\{[^}]*text-decoration:\s*underline/);
  assert.match(deskCss, /\.ch-done\s*\{[^}]*border-bottom/);
});
