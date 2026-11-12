// axe cannot judge text over a pattern, so check the keycaps here: each band's letter must keep
// 4.5:1 against its own fill and against the brightest part of its pattern (the pattern color at
// full strength laid over the fill). Reads the real CSS, so a change to it is checked.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("./heatBands.css", import.meta.url), "utf8");

const hex = (h) => [1, 3, 5].map((i) => Number.parseInt(h.slice(i, i + 2), 16));
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
const prop = (text, name) => {
  const m = text.match(new RegExp(`(?:^|;|\\s)${name}:\\s*(#[0-9a-f]{6})`, "i"));
  assert.ok(m, name);
  return hex(m[1]);
};
const overlays = (text) =>
  [...text.matchAll(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/g)].map((m) => ({
    rgb: [Number(m[1]), Number(m[2]), Number(m[3])],
    a: Number(m[4]),
  }));

const BANDS = ["missed", "shaky", "uneven", "steady", "noData"];

for (const band of BANDS) {
  test(`band-${band}: the letter keeps 4.5:1 on its fill and on its pattern`, () => {
    const b = block(`.band-${band}`);
    const fill = prop(b, "background-color");
    const text = prop(b, "color");
    assert.ok(ratio(text, fill) >= 4.5, `${band} on its fill: ${ratio(text, fill).toFixed(2)}:1`);
    for (const { rgb, a } of overlays(b)) {
      const r = ratio(text, over(rgb, a, fill));
      assert.ok(r >= 4.5, `${band}: ${r.toFixed(2)}:1 on the pattern`);
    }
  });
}

test("the check can fail: the mock's 55% shaky dots would be under 4.5:1", () => {
  const r = ratio(hex("#fef3c7"), over([242, 193, 78], 0.55, hex("#261f0d")));
  assert.ok(r < 4.5, r.toFixed(2));
});

test("the five bands have different borders or patterns in the CSS itself", () => {
  const looks = BANDS.map((b) => block(`.band-${b}`).replace(/\s+/g, " ").trim());
  assert.equal(new Set(looks).size, 5);
  const borders = BANDS.map((b) => block(`.band-${b}`).match(/border:\s*([^;]+);/)[1]);
  assert.equal(new Set(borders).size, 5, "each band has its own border");
});
