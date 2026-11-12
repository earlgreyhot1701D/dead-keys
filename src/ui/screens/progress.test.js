// The progress screen with the normal and ugly fixtures (fixtures are read here, in tests only).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { EMPTY_LINE, FEW_LINE, progressScreen } from "./progress.js";

const fixture = (p) =>
  JSON.parse(readFileSync(new URL(`../../../fixtures/${p}`, import.meta.url), "utf8")).value;

function draw(progress) {
  let out;
  withFakeDocument(() => {
    const went = [];
    const node = progressScreen.render({ state: { progress }, back: () => went.push("back") });
    out = { node, text: textOf(node), went };
  });
  return out;
}

test("zero rounds: the empty line, the few-data line, no bests, no crash", () => {
  const { text } = draw(fixture("ugly/progress.zero-rounds.json"));
  assert.ok(text.includes(EMPTY_LINE));
  assert.ok(text.includes(FEW_LINE));
  assert.ok(text.includes("None yet."));
  assert.ok(text.includes("Not enough yet:"));
});

test("a few rounds: bests show, 'not enough yet' still covers the thin keys", () => {
  const { text } = draw(fixture("normal/progress.basic.json"));
  assert.ok(!text.includes(EMPTY_LINE));
  assert.ok(text.includes("corners: 30 WPM"));
  assert.ok(text.includes("Not enough yet:"));
});

test("200 rounds and every key: at most three sentences, a summary line per band", () => {
  const { node, text } = draw(fixture("ugly/progress.200-rounds-all-keys.json"));
  assert.ok(!text.includes(EMPTY_LINE));
  const section = findAll(node, (n) => n.attrs?.["aria-labelledby"] === "pg-diag")[0];
  const items = findAll(section, (n) => n.tag === "li" || n.tagName === "LI");
  assert.ok(items.length <= 3, `${items.length} sentences`);
  assert.ok(text.includes("Heat map in words"));
});

test("Back goes back", () => {
  withFakeDocument(() => {
    const went = [];
    const node = progressScreen.render({
      state: { progress: fixture("ugly/progress.zero-rounds.json") },
      back: () => went.push("back"),
    });
    const btn = findAll(node, (n) => textOf(n) === "Back" && n.attrs?.type === "button")[0];
    btn.click?.();
    assert.deepEqual(went, ["back"]);
  });
});
