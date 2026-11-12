// The notice slot: focus never drops to the page body, and a startup notice is drawn once, a
// moment after the live region exists.
import assert from "node:assert/strict";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "./fakeDom.js";
import { BOOT_DELAY_MS, createNoticeSlot } from "./noticeSlot.js";

/** A slot on the fake page. Call inside withFakeDocument, so the notice's buttons share `doc`. */
function setup(doc, notice) {
  const app = {
    state: { notice },
    dismissNotice() {
      app.state = { notice: null };
    },
  };
  const slot = doc.createElement("div");
  slot.contains = (n) => findAll(slot, (x) => x === n).length > 0;
  doc.body.append(slot);
  const timers = [];
  const log = [];
  const s = createNoticeSlot({
    app,
    doc,
    slot,
    focusTitle: () => log.push("focusTitle"),
    go: (id) => log.push(["go", id]),
    later: (fn, ms) => timers.push({ fn, ms }),
  });
  return { app, slot, s, timers, log };
}
const buttons = (slot) => findAll(slot, (n) => n.tag === "button");

test("a startup notice is drawn after a short delay, once", () => {
  withFakeDocument((doc) => {
    const { slot, s, timers } = setup(doc, "corrupt");
    s.boot();
    assert.equal(slot.children.length, 0, "not in the same moment as the region");
    assert.equal(timers.length, 1);
    assert.equal(timers[0].ms, BOOT_DELAY_MS);
    timers[0].fn();
    assert.match(textOf(slot), /couldn't read your saved progress/);
    s.update(); // nothing changed, so nothing is redrawn (and nothing is spoken again)
    assert.equal(slot.children.length, 1);
  });
});

test("no startup notice, no timer", () => {
  withFakeDocument((doc) => {
    const { s, timers } = setup(doc, null);
    s.boot();
    assert.equal(timers.length, 0);
  });
});

test("Got it removes the notice and moves focus to the heading, not the page body", () => {
  withFakeDocument((doc) => {
    const { app, slot, s, log } = setup(doc, "corrupt");
    s.update();
    const gotIt = buttons(slot).find((b) => textOf(b) === "Got it");
    gotIt.focus();
    gotIt.click(); // dismissNotice changes the state; the router calls update on every change
    assert.equal(app.state.notice, null);
    s.update();
    assert.equal(slot.children.length, 0);
    assert.deepEqual(log, ["focusTitle"]);
  });
});

test("a notice that goes away while focus is elsewhere leaves focus alone", () => {
  withFakeDocument((doc) => {
    const { app, slot, s, log } = setup(doc, "corrupt");
    s.update();
    app.state = { notice: null };
    s.update();
    assert.equal(slot.children.length, 0);
    assert.deepEqual(log, []);
  });
});
