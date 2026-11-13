// Lesson 0's keyboard question (lessons Req 6.1): the copy table's words, Yes goes on, No
// explains first and offers Go on, focus lands on the first button, Enter takes it.
import assert from "node:assert/strict";
import { test } from "node:test";
import { LESSON0 } from "../../lessons/copy.js";
import { el } from "../dom.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { showAsk } from "./lessonAsk.js";

function ask() {
  const coach = el("span", { id: "ls-coach-text" });
  const slot = el("div", {});
  const done = [];
  const kit = showAsk({ coach, slot, onDone: () => done.push(true) });
  const buttons = () => findAll(slot, (n) => n.tag === "button");
  return { coach, slot, done, kit, buttons };
}

test("the question with Yes and No; Yes goes on", () => {
  withFakeDocument((doc) => {
    const a = ask();
    // the picture in words for a screen reader (lessons-8b Req 9.1)
    assert.equal(textOf(a.coach), `Does your keyboard look like this? ${LESSON0.picture}`);
    assert.deepEqual(a.buttons().map(textOf), ["Yes", "No"]);
    assert.equal(doc.activeElement, a.buttons()[0]);
    for (const b of a.buttons()) assert.equal(b.getAttribute("aria-describedby"), "ls-coach-text");
    assert.match(a.buttons()[0].getAttribute("class"), /is-primary/);
    a.buttons()[0].click();
    assert.deepEqual(a.done, [true]);
  });
});

test("No: the US keyboard line and Go on, which goes on", () => {
  withFakeDocument((doc) => {
    const a = ask();
    a.buttons()[1].click();
    assert.equal(a.done.length, 0);
    assert.equal(
      textOf(a.coach),
      "Dead Keys teaches the US keyboard for now. Some keys may sit in other places on yours. You can still go on.",
    );
    assert.equal(textOf(a.coach), LESSON0.notUs);
    assert.deepEqual(a.buttons().map(textOf), ["Go on"]);
    assert.equal(doc.activeElement, a.buttons()[0]);
    a.buttons()[0].click();
    assert.deepEqual(a.done, [true]);
  });
});

test("Enter takes the first button, unless focus is on a button (it does its own job)", () => {
  withFakeDocument(() => {
    const a = ask();
    assert.equal(a.kit.onKey({ key: "Enter", target: { tagName: "BUTTON" } }), false);
    assert.equal(a.kit.onKey({ key: "f", target: { tagName: "BODY" } }), false);
    assert.equal(a.done.length, 0);
    assert.equal(a.kit.onKey({ key: "Enter", target: { tagName: "H1" } }), true);
    assert.deepEqual(a.done, [true]);
  });
});
