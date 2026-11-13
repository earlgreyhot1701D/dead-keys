// The "What's this?" glossary (PRD G2; lessons-8b Req 8): the four terms, words from the copy
// table, a button named for its term, and a dialog whose Close and Escape both close it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { el } from "../dom.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { buildGlossary, CLOSE, GLOSSARY, WHATS_THIS, whatsThis } from "./glossary.js";

const design = readFileSync(
  new URL("../../../.kiro/specs/lessons-8b/design.md", import.meta.url),
  "utf8",
);
const row = (where) => design.split("\n").find((l) => l.startsWith(`| ${where} |`));

test("the four PRD terms, each in the copy table word for word", () => {
  assert.deepEqual(Object.keys(GLOSSARY), ["home row", "WPM", "accuracy", "dead key"]);
  for (const [term, words] of Object.entries(GLOSSARY)) {
    assert.equal(row(`Glossary, ${term}`), `| Glossary, ${term} | \`${words}\` |`, term);
  }
  assert.equal(row("Glossary button"), `| Glossary button | \`${WHATS_THIS}\` |`);
  assert.equal(row("Glossary, close"), `| Glossary, close | \`${CLOSE}\` |`);
});

test("the button says What's this? and its name says which term", () => {
  withFakeDocument(() => {
    const b = whatsThis("WPM");
    assert.equal(b.tag, "button");
    assert.equal(textOf(b), "What's this?");
    assert.equal(b.attrs["aria-label"], "What's this: WPM");
  });
  assert.throws(() => whatsThis("dead keys"), RangeError);
});

test("the dialog: the term as its heading, the words, and Close closes it (Escape: e2e)", () => {
  withFakeDocument(() => {
    let closed = 0;
    const d = buildGlossary(el, "accuracy", () => closed++);
    assert.equal(d.tag, "dialog");
    assert.equal(textOf(findAll(d, (n) => n.tag === "h2")[0]), "accuracy");
    assert.match(textOf(d), /Backspace doesn't count as a key\./);
    findAll(d, (n) => n.tag === "button")[0].click();
    assert.equal(closed, 1);
  });
});
