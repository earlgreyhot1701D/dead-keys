// The title screen: any key starts, the privacy card comes first the first time, the still frame is
// decoration only, and the phone notice shows when asked.
import assert from "node:assert/strict";
import { test } from "node:test";
import { PHONE_NOTICE } from "../components/phoneNotice.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import {
  FOOTER_LINE,
  FOOTER_NOT_SAVING,
  INTERCEPT,
  PRESS,
  SUBLINE,
  startKey,
  TAGLINE,
  titleScreen,
} from "./title.js";

/** A ctx that records where the screen goes. */
function ctxFor({ privacySeen = false, phone = false } = {}) {
  const went = [];
  return { went, state: { settings: { privacySeen } }, phone, go: (id) => went.push(id) };
}

test("any ordinary key starts the game", () => {
  for (const key of [
    "a",
    "A",
    " ",
    "Enter",
    "ArrowDown",
    "ArrowLeft",
    "1",
    ";",
    "Backspace",
    "Delete",
    "Home",
    "PageDown",
    "ñ",
    "¿",
    "Dead",
  ]) {
    assert.equal(startKey({ key }), true, key);
  }
});

test("keys used to move around the page, and browser shortcuts, do not start it", () => {
  for (const key of [
    "Tab",
    "Shift",
    "Control",
    "Alt",
    "Meta",
    "CapsLock",
    "Escape",
    "F1",
    "F5",
    "F11",
    "F12",
    "ContextMenu",
    "PrintScreen",
  ]) {
    assert.equal(startKey({ key }), false, key);
  }
  for (const mod of ["ctrlKey", "altKey", "metaKey"]) {
    assert.equal(startKey({ key: "a", [mod]: true }), false, mod);
  }
  for (const bad of [{}, { key: "" }, { key: 5 }, null, undefined])
    assert.equal(startKey(bad), false, String(bad));
});

test("the first key goes to the privacy card; once it has been seen, to the menu", () => {
  const first = ctxFor();
  assert.equal(titleScreen.onKey(first, { key: "a" }), true);
  assert.deepEqual(first.went, ["privacy"]);
  const later = ctxFor({ privacySeen: true });
  assert.equal(titleScreen.onKey(later, { key: " " }), true);
  assert.deepEqual(later.went, ["menu"]);
});

test("a key that does not start the game is left alone (so Tab and Escape still work)", () => {
  const ctx = ctxFor();
  for (const key of ["Tab", "Escape", "Shift"])
    assert.equal(titleScreen.onKey(ctx, { key }), false);
  assert.deepEqual(ctx.went, []);
});

test("Enter and Space on a focused button press that button; they do not start the game", () => {
  const ctx = ctxFor();
  const button = { tagName: "BUTTON" };
  for (const key of ["Enter", " "]) {
    assert.equal(titleScreen.onKey(ctx, { key, target: button }), false, JSON.stringify(key));
  }
  assert.deepEqual(ctx.went, []);
  // Any other key still starts, even with a button focused ("press any key")
  assert.equal(titleScreen.onKey(ctx, { key: "a", target: button }), true);
  // and Enter with nothing in particular focused (the heading) starts too
  assert.equal(titleScreen.onKey(ctx, { key: "Enter", target: { tagName: "H1" } }), true);
  assert.deepEqual(ctx.went, ["privacy", "privacy"]);
});

test("it has the wordmark, the tagline, the still frame and a Start button", () => {
  withFakeDocument(() => {
    const node = titleScreen.render(ctxFor());
    assert.equal(findAll(node, (n) => n.tag === "main").length, 1);
    assert.equal(textOf(findAll(node, (n) => n.tag === "h1")[0]), "Dead Keys");
    assert.equal(TAGLINE, "a typing game, back from the dead.");
    assert.ok(
      findAll(node, (n) => n.attrs?.class === "tagline").some((n) => textOf(n) === TAGLINE),
    );
    assert.match(textOf(node), /Press any key to start\./);
    assert.deepEqual(findAll(node, (n) => n.tag === "button").map(textOf), ["Start"]);
  });
});

test("the Start button does what the key does", () => {
  withFakeDocument(() => {
    const first = ctxFor();
    findAll(titleScreen.render(first), (n) => n.tag === "button")[0].click();
    assert.deepEqual(first.went, ["privacy"]);
    const later = ctxFor({ privacySeen: true });
    findAll(titleScreen.render(later), (n) => n.tag === "button")[0].click();
    assert.deepEqual(later.went, ["menu"]);
  });
});

test("the still frame is decoration: hidden from a screen reader and nothing in it takes focus", () => {
  withFakeDocument(() => {
    const node = titleScreen.render(ctxFor());
    const frame = findAll(node, (n) => n.attrs?.class === "title-scene")[0];
    assert.equal(frame.attrs["aria-hidden"], "true");
    assert.deepEqual(
      findAll(frame, (n) => ["button", "a", "input", "select", "textarea"].includes(n.tag)),
      [],
    );
    assert.equal(findAll(frame, (n) => n.attrs?.tabindex !== undefined).length, 0);
    assert.match(textOf(frame), /harbor|bor/); // the locked word, as in the mock
    assert.equal(findAll(frame, (n) => n.attrs?.class === "locked-box").length, 1);
    // Shara's Nov 12 calls: none of the labels that read as data, or as a live demo
    for (const gone of ["SHIELD", "CAPACITOR", "LANT_", "Pause demo", "Demo playing", "ATTRACT"]) {
      assert.doesNotMatch(textOf(node), new RegExp(gone), gone);
    }
  });
});

test("the mock's lines are the approved copy, and only true tiles show", () => {
  withFakeDocument(() => {
    const text = textOf(titleScreen.render(ctxFor()));
    for (const line of [SUBLINE, INTERCEPT, FOOTER_LINE, PRESS, "[ANY KEY] START", "[TAB] MOVE"]) {
      assert.ok(text.includes(line), line);
    }
    assert.equal(SUBLINE, "1980s typing games // rebuilt as a real trainer");
    assert.equal(INTERCEPT, "PARANORMAL INTERCEPT // PID 0xDEAD");
    assert.equal(
      FOOTER_LINE,
      "Keyboard required. No account. Your progress stays in this browser.",
    );
    // the stat tile row is gone (Shara, Nov 12)
    for (const gone of [
      "Accounts needed",
      "LESSONS",
      "GAME MODES",
      "60-SEC",
      "[ESC] PAUSE",
      "KEYBOARD READY",
    ]) {
      assert.ok(!text.includes(gone), gone);
    }
  });
});

test("the phone notice shows only when asked for", () => {
  withFakeDocument(() => {
    assert.equal(
      findAll(
        titleScreen.render(ctxFor({ phone: false })),
        (n) => "data-phone-notice" in (n.attrs ?? {}),
      ).length,
      0,
    );
    const shown = findAll(
      titleScreen.render(ctxFor({ phone: true })),
      (n) => "data-phone-notice" in (n.attrs ?? {}),
    );
    assert.equal(shown.length, 1);
    assert.equal(textOf(shown[0]), PHONE_NOTICE);
  });
});

test("the screen's id and announced title", () => {
  assert.equal(titleScreen.id, "title");
  assert.equal(titleScreen.title, "Dead Keys");
});

test("the footer never claims a save while this browser is not saving", () => {
  withFakeDocument(() => {
    const off = textOf(
      titleScreen.render({ ...ctxFor(), state: { persist: false, settings: {} } }),
    );
    assert.ok(off.includes(FOOTER_NOT_SAVING));
    assert.ok(!off.includes(FOOTER_LINE));
    assert.equal(
      FOOTER_NOT_SAVING,
      "Keyboard required. No account. Progress isn't being saved right now.",
    );
  });
});
