// Shell Req 5.3: the on-page confirm. Built and opened against the fake document.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createEl } from "../dom.js";
import { findAll, makeFakeDoc, textOf } from "../fakeDom.js";
import { buildConfirm, confirmLines, NEWER_SAVE_WARNING, openConfirm } from "./confirmDialog.js";

const opts = (over = {}) => ({
  title: "Clear all progress?",
  lines: ["This removes your saved progress from this browser.", "It can't be undone."],
  confirmLabel: "Clear everything",
  onConfirm: () => {},
  onCancel: () => {},
  ...over,
});
const setup = () => {
  const doc = makeFakeDoc();
  return { doc, mk: createEl(doc) };
};
const buttons = (n) => findAll(n, (x) => x.tag === "button");

test("the newer-save warning is the approved copy, word for word", () => {
  const design = readFileSync(
    new URL("../../../.kiro/specs/shell/design.md", import.meta.url),
    "utf8",
  );
  const row = design
    .split("\n")
    .find(
      (l) =>
        l.startsWith("| Clear confirm, newer save") || l.startsWith("| Clear confirm, extra line"),
    );
  const text = row
    .split("|")
    .slice(1, -1)
    .map((c) => c.trim())[1];
  assert.equal(NEWER_SAVE_WARNING, text);
  assert.equal(
    NEWER_SAVE_WARNING,
    "This also deletes progress saved by a newer version of Dead Keys.",
  );
});

test("the warning is added only when a newer save is present, and the input is not changed", () => {
  const lines = ["a", "b"];
  assert.deepEqual(confirmLines(lines, false), ["a", "b"]);
  assert.deepEqual(confirmLines(lines, true), ["a", "b", NEWER_SAVE_WARNING]);
  assert.deepEqual(lines, ["a", "b"]);
  assert.notEqual(confirmLines(lines, false), lines);
});

test("the dialog has a title, the lines in order, and Cancel and Confirm buttons", () => {
  const { mk } = setup();
  const d = buildConfirm(mk, opts());
  assert.equal(d.tag, "dialog");
  assert.equal(textOf(findAll(d, (n) => n.tag === "h2")[0]), "Clear all progress?");
  assert.deepEqual(findAll(d, (n) => n.tag === "p").map(textOf), [
    "This removes your saved progress from this browser.",
    "It can't be undone.",
  ]);
  assert.deepEqual(buttons(d).map(textOf), ["Cancel", "Clear everything"]);
  for (const b of buttons(d)) assert.equal(b.attrs.type, "button");
});

test("it is labelled and described, so a screen reader reads the title and the lines", () => {
  const { mk } = setup();
  const d = buildConfirm(mk, opts({ id: "clear" }));
  const title = findAll(d, (n) => n.attrs?.id === "clear-title");
  const text = findAll(d, (n) => n.attrs?.id === "clear-text");
  assert.equal(d.attrs["aria-labelledby"], "clear-title");
  assert.equal(d.attrs["aria-describedby"], "clear-text");
  assert.equal(title.length, 1);
  assert.equal(text.length, 1);
});

test("Cancel has focus when it opens: the safe choice for a destructive question", () => {
  const { mk } = setup();
  const [cancel, confirm] = buttons(buildConfirm(mk, opts()));
  assert.equal("autofocus" in cancel.attrs, true);
  assert.equal("autofocus" in confirm.attrs, false);
});

test("the buttons call the right handlers; the browser's cancel event is the same as Cancel", () => {
  const { mk } = setup();
  const calls = [];
  const d = buildConfirm(
    mk,
    opts({ onConfirm: () => calls.push("confirm"), onCancel: () => calls.push("cancel") }),
  );
  const [cancel, confirm] = buttons(d);
  cancel.click();
  confirm.click();
  let prevented = false;
  d.listeners.cancel({ preventDefault: () => (prevented = true) }); // Escape, as the browser reports it
  assert.deepEqual(calls, ["cancel", "confirm", "cancel"]);
  assert.equal(prevented, true); // we close it ourselves, so focus can go back
});

test("Escape inside the dialog does not reach the router's go-back", () => {
  const { mk } = setup();
  const d = buildConfirm(mk, opts());
  let stopped = 0;
  d.listeners.keydown({ key: "Escape", stopPropagation: () => stopped++ });
  d.listeners.keydown({ key: "Tab", stopPropagation: () => stopped++ });
  assert.equal(stopped, 1);
});

test("opening puts it on the page as a modal; Confirm closes it, returns focus, then confirms", () => {
  const { doc, mk } = setup();
  const opener = mk("button", {}, "Clear");
  doc.body.append(opener);
  opener.focus();
  const calls = [];
  const handle = openConfirm(doc, mk, opts({ onConfirm: () => calls.push("confirmed") }));
  const dialog = findAll(doc.body, (n) => n.tag === "dialog")[0];
  assert.ok(handle && dialog);
  assert.equal(dialog.modal, true);
  buttons(dialog)[1].click();
  assert.equal(findAll(doc.body, (n) => n.tag === "dialog").length, 0);
  assert.equal(doc.activeElement, opener);
  assert.deepEqual(calls, ["confirmed"]);
});

test("Cancel and the browser's cancel both close it and give focus back", () => {
  for (const how of ["button", "event"]) {
    const { doc, mk } = setup();
    const opener = mk("button", {}, "Clear");
    doc.body.append(opener);
    opener.focus();
    const calls = [];
    openConfirm(doc, mk, opts({ onCancel: () => calls.push("cancelled") }));
    const dialog = findAll(doc.body, (n) => n.tag === "dialog")[0];
    if (how === "button") buttons(dialog)[0].click();
    else dialog.listeners.cancel({ preventDefault() {} });
    assert.equal(findAll(doc.body, (n) => n.tag === "dialog").length, 0, how);
    assert.equal(doc.activeElement, opener, how);
    assert.deepEqual(calls, ["cancelled"], how);
  }
});

test("only one confirm can be open at a time", () => {
  const { doc, mk } = setup();
  assert.ok(openConfirm(doc, mk, opts()));
  assert.equal(openConfirm(doc, mk, opts()), null);
  assert.equal(findAll(doc.body, (n) => n.tag === "dialog").length, 1);
});

test("close() can be called by the caller, and twice is harmless", () => {
  const { doc, mk } = setup();
  const handle = openConfirm(doc, mk, opts());
  handle.close();
  assert.doesNotThrow(() => handle.close());
  assert.equal(findAll(doc.body, (n) => n.tag === "dialog").length, 0);
});

test("the question and lines are text, never markup", () => {
  const { mk } = setup();
  const d = buildConfirm(mk, opts({ title: "<b>x</b>", lines: ["<img src=x onerror=alert(1)>"] }));
  assert.equal(textOf(findAll(d, (n) => n.tag === "h2")[0]), "<b>x</b>");
  assert.equal(findAll(d, (n) => n.tag === "img").length, 0);
});
