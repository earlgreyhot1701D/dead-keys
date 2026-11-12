// axe cannot judge text over a gradient, so check the keycap patterns here: the key's letter and
// glyph must keep 4.5:1 against the brightest part of its own pattern (the pattern color at full
// strength laid over the key's panel color). Reads the real CSS, so a change to it is checked.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const tokens = read("./tokens.css");
const css = read("./keyboard.css");

const token = (name) => {
  const m = tokens.match(new RegExp(`--${name}:\\s*#([0-9a-f]{6})`, "i"));
  assert.ok(m, `token --${name}`);
  return [0, 2, 4].map((i) => Number.parseInt(m[1].slice(i, i + 2), 16));
};
const lum = ([r, g, b]) => {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const over = ([r, g, b], a, base) => [r, g, b].map((v, i) => v * a + base[i] * (1 - a));

/** The CSS block for a selector, as text. */
const block = (sel) => {
  const m = css.match(new RegExp(`${sel.replace(".", "\\.")}\\s*\\{([^}]*)\\}`));
  assert.ok(m, sel);
  return m[1];
};
const overlays = (text) =>
  [...text.matchAll(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/g)].map((m) => ({
    rgb: [Number(m[1]), Number(m[2]), Number(m[3])],
    a: Number(m[4]),
  }));

const PANEL = token("panel");
const TEXT = { soft: token("soft"), muted: token("muted") };

for (const [band, text] of [
  ["missed", "soft"],
  ["shaky", "soft"],
  ["uneven", "soft"],
  ["steady", "soft"],
  ["noData", "muted"],
]) {
  test(`band-${band}: the letter keeps 4.5:1 on its pattern`, () => {
    for (const { rgb, a } of overlays(block(`.band-${band}`))) {
      const worst = over(rgb, a, PANEL);
      const r = ratio(TEXT[text], worst);
      assert.ok(r >= 4.5, `${band}: ${r.toFixed(2)}:1 on the pattern`);
    }
  });
}

test("the five bands have different borders or patterns in the CSS itself", () => {
  const looks = ["missed", "shaky", "uneven", "steady", "noData"].map((b) =>
    block(`.band-${b}`).replace(/\s+/g, " ").trim(),
  );
  assert.equal(new Set(looks).size, 5);
});
