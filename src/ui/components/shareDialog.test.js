// The Share card window (share Req 2): its words come from the copy table, Share shows only
// where it works, the card is a labeled image, one window at a time, and closing returns focus.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createEl } from "../dom.js";
import { findAll, makeFakeDoc, textOf } from "../fakeDom.js";
import { buildShare, openShare, SHARE_COPY } from "./shareDialog.js";

const card = { data: { wpm: 42 }, text: "line", alt: "Dead Keys round card: 42 WPM" };
const noop = () => {};
const api = (nav = {}) => ({ nav, File: class {}, doc: null });
const buttons = (n) => findAll(n, (x) => x.tag === "button").map(textOf);

test("buildShare: title, note, live line, and the buttons in order", () => {
  const doc = makeFakeDoc();
  const mk = createEl(doc);
  const opts = {
    frame: mk("div"),
    status: mk("p"),
    onDownload: noop,
    onCopy: noop,
    onShare: noop,
    onClose: noop,
  };
  const n = buildShare(mk, { ...opts, showShare: false });
  assert.equal(n.tag, "dialog");
  assert.ok(textOf(n).includes(SHARE_COPY.title) && textOf(n).includes(SHARE_COPY.note));
  assert.deepEqual(buttons(n), ["Download PNG", "Copy text", "Close"]);
  assert.deepEqual(buttons(buildShare(mk, { ...opts, showShare: true })), [
    "Download PNG",
    "Copy text",
    "Share",
    "Close",
  ]);
});

test("openShare: a labeled card image, Download focused, one at a time, focus returns on close", async () => {
  const doc = makeFakeDoc();
  const mk = createEl(doc);
  const opener = doc.createElement("button");
  opener.focus();
  const w = await openShare(doc, mk, card, api());
  const dialog = doc.body.children[0];
  assert.ok("open" in dialog.attrs);
  const img = findAll(dialog, (x) => x.tag === "canvas")[0];
  assert.deepEqual([img.width, img.height, img.attrs.role], [1200, 630, "img"]);
  assert.equal(img.attrs["aria-label"], card.alt);
  const download = findAll(dialog, (x) => x.tag === "button")[0];
  assert.equal(download.attrs.autofocus, "");
  assert.equal(await openShare(doc, mk, card, api()), null); // a second window never opens
  w.close();
  assert.equal(doc.body.children.length, 0);
  assert.equal(doc.activeElement, opener);
});

test("Escape closes the window and stays out of the router", async () => {
  const doc = makeFakeDoc();
  const mk = createEl(doc);
  await openShare(doc, mk, card, api());
  const dialog = doc.body.children[0];
  let stopped = false;
  dialog.listeners.keydown({
    key: "Escape",
    stopPropagation: () => {
      stopped = true;
    },
  });
  assert.ok(stopped);
  dialog.listeners.cancel({ preventDefault: noop });
  assert.equal(doc.body.children.length, 0);
});

test("Copy text says what happened in the window's own live line", async () => {
  const doc = makeFakeDoc();
  const mk = createEl(doc);
  await openShare(doc, mk, card, api({}));
  const dialog = doc.body.children[0];
  const copy = findAll(dialog, (x) => x.tag === "button" && textOf(x) === SHARE_COPY.copy)[0];
  await copy.listeners.click();
  const status = findAll(dialog, (x) => x.attrs?.role === "status")[0];
  assert.equal(textOf(status), SHARE_COPY.copyFailed);
});
