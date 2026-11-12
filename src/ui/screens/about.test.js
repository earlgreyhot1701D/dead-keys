// About and How we count screens: the PRD's About list, safe links, and a way back.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { ABOUT_PARAGRAPHS, aboutScreen, FONT_LICENSES, LINKS } from "./about.js";
import { howWeCountScreen, SOURCE_URL } from "./howWeCount.js";

const links = (node) => findAll(node, (n) => n.tag === "a");
const draw = (screen) => {
  const log = [];
  let node;
  withFakeDocument(() => {
    node = screen.render({ back: () => log.push("back") });
  });
  return { node, log };
};

test("About carries the PRD list", () => {
  const { node } = draw(aboutScreen);
  const text = textOf(node);
  for (const part of [
    "clewlabs.org",
    "@clewlabs",
    "dev.to/earlgreyhot1701d",
    "LinkedIn",
    "GitHub",
    "Buy Me a Coffee",
    "MIT license",
    "Built with Kiro for Kiroween 2026",
    "MasterType (1981)",
    "Type Attack (1982)",
    "Office Keys",
    "top-english-wordlists",
    "CC BY 3.0",
    "A dead key types nothing until you press the next one.",
    "JetBrains Mono",
    "Roboto Condensed",
  ]) {
    assert.ok(text.includes(part), part);
  }
  assert.ok(ABOUT_PARAGRAPHS.every((p) => !/[<>]/.test(p)));
});

test("every outside link is https and opens safely; font licenses stay on our site", () => {
  const { node } = draw(aboutScreen);
  const all = links(node);
  assert.equal(all.length, LINKS.length + FONT_LICENSES.length);
  for (const a of all) {
    const href = a.attrs.href;
    assert.ok(href, "a link with no address");
    if (href.startsWith("/licenses/")) {
      assert.equal(a.attrs.target, undefined);
    } else {
      assert.match(href, /^https:\/\//);
      assert.equal(a.attrs.target, "_blank");
      assert.equal(a.attrs.rel, "noopener noreferrer");
    }
  }
  assert.deepEqual(
    FONT_LICENSES.map((l) => l.href),
    ["/licenses/JetBrainsMono-OFL.txt", "/licenses/RobotoCondensed-OFL.txt"],
  );
});

test("How we count links to the source and has every section", () => {
  const { node } = draw(howWeCountScreen);
  const a = links(node)[0];
  assert.equal(a.attrs.href, SOURCE_URL);
  assert.equal(a.attrs.rel, "noopener noreferrer");
  assert.equal(findAll(node, (n) => n.tag === "h2").length, 8);
});

test("the Office Keys line is the approved copy, word for word", () => {
  const table = readFileSync(
    new URL("../../../.kiro/specs/shell/design.md", import.meta.url),
    "utf8",
  );
  const row = table.split("\n").find((l) => l.startsWith("| About, Office Keys line"));
  const want = row.split("|")[2].trim();
  assert.equal(
    want,
    "Dead Keys also grew from Office Keys, my first Lovable build (August 2025), a typing practice app. This game carries over its ideas, not its code.",
  );
  assert.ok(ABOUT_PARAGRAPHS.includes(want));
});

test("both screens go back", () => {
  for (const screen of [aboutScreen, howWeCountScreen]) {
    const { node, log } = draw(screen);
    findAll(node, (n) => n.tag === "button" && textOf(n) === "Back")[0].click();
    assert.deepEqual(log, ["back"]);
  }
});
