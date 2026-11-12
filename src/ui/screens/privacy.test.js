// The privacy card (shell Req 4): the PRD's text word for word, remembered once dismissed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { PRIVACY_PARAGRAPHS, privacyScreen } from "./privacy.js";

/** The card's paragraphs, read from the PRD (G9) so the screen and the PRD cannot drift. */
function prdParagraphs() {
  const prd = readFileSync(new URL("../../../docs/prd.md", import.meta.url), "utf8");
  const after = prd.slice(prd.indexOf("**First-launch privacy card"));
  const quoted = after
    .split("\n")
    .slice(1)
    .filter((l, i, all) => i === 0 || all[i - 1].startsWith(">") || l.startsWith(">"));
  const paras = [];
  let cur = [];
  for (const line of quoted) {
    if (!line.startsWith(">")) break;
    const text = line.replace(/^>\s?/, "").trim();
    if (text === "") {
      if (cur.length) paras.push(cur.join(" "));
      cur = [];
    } else cur.push(text);
  }
  if (cur.length) paras.push(cur.join(" "));
  return paras;
}

function ctxFor(privacySeen) {
  const log = [];
  return {
    log,
    state: { settings: { privacySeen } },
    go: (id) => log.push(["go", id]),
    replace: (id) => log.push(["replace", id]),
    back: () => log.push(["back"]),
    app: { dismissPrivacy: () => log.push(["dismiss"]) },
  };
}

test("the text is the PRD's first-launch card, word for word", () => {
  const want = prdParagraphs();
  assert.equal(want.length, 2);
  assert.deepEqual([...PRIVACY_PARAGRAPHS], want);
});

test("it says the two things that leave the browser, and that typing is never part of it", () => {
  const all = PRIVACY_PARAGRAPHS.join(" ");
  assert.match(all, /saved only in this browser/);
  assert.match(all, /Two things leave your browser/);
  assert.match(all, /Your typing is never part of it\./);
});

test("it shows a heading, the paragraphs as text, and one button", () => {
  withFakeDocument(() => {
    const node = privacyScreen.render(ctxFor(false));
    assert.equal(textOf(findAll(node, (n) => n.tag === "h1")[0]), "Privacy");
    assert.deepEqual(findAll(node, (n) => n.tag === "p").map(textOf), [...PRIVACY_PARAGRAPHS]);
    assert.equal(findAll(node, (n) => n.tag === "button").length, 1);
  });
});

test("the first time, Continue remembers it was seen and opens the menu", () => {
  withFakeDocument(() => {
    const ctx = ctxFor(false);
    const [b] = findAll(privacyScreen.render(ctx), (n) => n.tag === "button");
    assert.equal(textOf(b), "Continue");
    b.click();
    assert.deepEqual(ctx.log, [["dismiss"], ["replace", "menu"]]);
  });
});

test("from Settings, once seen, the button just goes back and remembers nothing new", () => {
  withFakeDocument(() => {
    const ctx = ctxFor(true);
    const [b] = findAll(privacyScreen.render(ctx), (n) => n.tag === "button");
    assert.equal(textOf(b), "Back");
    b.click();
    assert.deepEqual(ctx.log, [["back"]]);
  });
});

test("the screen's id and announced title", () => {
  assert.equal(privacyScreen.id, "privacy");
  assert.equal(privacyScreen.title, "Privacy");
});
