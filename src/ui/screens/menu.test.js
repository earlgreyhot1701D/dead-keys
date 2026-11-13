// The main menu: the eight PRD items in order, unbuilt ones marked, arrow keys move focus.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { MENU_ITEMS, menuScreen, nextIndex } from "./menu.js";

const BUILT = new Set(["progress", "settings"]);
function ctxFor({ built = BUILT, phone = false } = {}) {
  const log = { went: [], said: [] };
  return {
    log,
    phone,
    has: (id) => built.has(id),
    go: (id) => log.went.push(id),
    announce: (t) => log.said.push(t),
  };
}
// The menu's own items: the buttons in the nav (the right column has the daily Start button).
const items = (node) =>
  findAll(findAll(node, (n) => n.tag === "nav")[0], (n) => n.tag === "button");

test("the menu is the eight PRD items, in order", () => {
  assert.deepEqual(
    MENU_ITEMS.map((i) => i.label),
    ["Play", "Lessons", "Practice", "Daily drill", "Progress", "How we count", "Settings", "About"],
  );
  assert.deepEqual(
    MENU_ITEMS.map((i) => i.screen),
    ["play", "lessons", "practice", "daily", "progress", "howWeCount", "settings", "about"],
  );
  assert.ok(Object.isFrozen(MENU_ITEMS));
});

test("it renders a labelled list of eight buttons under a heading", () => {
  withFakeDocument(() => {
    const node = menuScreen.render(ctxFor());
    assert.equal(textOf(findAll(node, (n) => n.tag === "h1")[0]), "Main menu");
    assert.equal(findAll(node, (n) => n.tag === "nav")[0].attrs["aria-label"], "Main menu");
    assert.equal(items(node).length, 8);
    for (const b of items(node)) assert.equal(b.attrs.type, "button");
  });
});

test("a screen that is not built says so in words, and is marked unavailable, still focusable", () => {
  withFakeDocument(() => {
    for (const b of items(menuScreen.render(ctxFor()))) {
      const screen = b.attrs["data-focus-id"];
      if (BUILT.has(screen)) {
        assert.equal(b.attrs["aria-disabled"], undefined, screen);
        assert.doesNotMatch(textOf(b), /Not built yet/);
      } else {
        assert.equal(b.attrs["aria-disabled"], "true", screen);
        assert.match(textOf(b), /Not built yet/);
        assert.equal(b.attrs.disabled, undefined); // a disabled button could not be focused
        assert.equal(b.disabled, undefined);
      }
    }
  });
});

test("a built item opens its screen; an unbuilt one only says it is not built yet", () => {
  withFakeDocument(() => {
    const ctx = ctxFor();
    for (const b of items(menuScreen.render(ctx))) b.click();
    assert.deepEqual(ctx.log.went, ["progress", "settings"]);
    assert.equal(ctx.log.said.length, 6);
    assert.deepEqual(ctx.log.said.slice(0, 2), ["Play: not built yet", "Lessons: not built yet"]);
  });
});

test("when everything is built, no item is marked", () => {
  withFakeDocument(() => {
    const all = new Set(MENU_ITEMS.map((i) => i.screen));
    const node = menuScreen.render(ctxFor({ built: all }));
    const nav = findAll(node, (n) => n.tag === "nav")[0];
    assert.equal(findAll(nav, (n) => n.attrs?.["aria-disabled"]).length, 0);
    assert.doesNotMatch(textOf(nav), /Not built yet/);
  });
});

test("the hint only names keys that work: the approved line, in the mock's three cells", () => {
  withFakeDocument(() => {
    const hint = findAll(menuScreen.render(ctxFor()), (n) =>
      n.attrs?.class?.includes("selector-hint"),
    )[0];
    assert.equal(
      hint.children.map(textOf).join(" "),
      "Arrow keys move. Enter opens. Escape goes back.",
    );
  });
});

test("the right column: the recommended lesson, the daily drill, nothing made up", () => {
  withFakeDocument(() => {
    const text = textOf(menuScreen.render(ctxFor()));
    assert.match(text, /Recommended next lesson\[L\d\d\]|Recommended next lessonAll letter/);
    assert.doesNotMatch(text, /Recommended next lessonNot built yet/);
    assert.match(text, /DAILY DRILLTODAYLIMIT: 02:00/);
    assert.doesNotMatch(text, /DAILY DRILL.*Not built yet/);
    for (const gone of [
      "+4 THIS WEEK",
      "LAST: 34",
      "BEST: 7",
      "SESSION",
      "ROOT_OP",
      "KEY_0",
      "PACK:",
    ]) {
      assert.ok(!text.includes(gone), gone);
    }
    assert.match(text, /CRT-SCAN (ON|OFF)/);
  });
});

test("the phone notice shows only when asked for", () => {
  withFakeDocument(() => {
    const count = (phone) =>
      findAll(menuScreen.render(ctxFor({ phone })), (n) => "data-phone-notice" in (n.attrs ?? {}))
        .length;
    assert.equal(count(false), 0);
    assert.equal(count(true), 1);
  });
});

test("arrow keys wrap, Home and End jump, and from nowhere Down is first and Up is last", () => {
  assert.equal(nextIndex(8, 0, "ArrowDown"), 1);
  assert.equal(nextIndex(8, 7, "ArrowDown"), 0);
  assert.equal(nextIndex(8, 0, "ArrowUp"), 7);
  assert.equal(nextIndex(8, 3, "ArrowUp"), 2);
  assert.equal(nextIndex(8, 5, "Home"), 0);
  assert.equal(nextIndex(8, 2, "End"), 7);
  assert.equal(nextIndex(8, -1, "ArrowDown"), 0);
  assert.equal(nextIndex(8, -1, "ArrowUp"), 7);
  for (const key of ["Enter", "a", "ArrowLeft", "Tab", "Escape", " "])
    assert.equal(nextIndex(8, 2, key), null, key);
  assert.equal(nextIndex(0, -1, "ArrowDown"), null);
});

test("random keys never leave the list", () => {
  const keys = fc.constantFrom("ArrowDown", "ArrowUp", "Home", "End", "x");
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 12 }),
      fc.array(keys, { maxLength: 40 }),
      (count, presses) => {
        let at = -1;
        for (const k of presses) {
          const n = nextIndex(count, at, k);
          if (n !== null) {
            assert.ok(Number.isInteger(n) && n >= 0 && n < count);
            at = n;
          }
        }
      },
    ),
  );
});

test("onKey moves focus between the buttons and says it used the key", () => {
  const focused = [];
  const buttons = Array.from({ length: 3 }, (_, i) => ({ focus: () => focused.push(i) }));
  let active = buttons[1];
  const ctx = {
    root: {
      querySelectorAll: () => buttons,
      ownerDocument: {
        get activeElement() {
          return active;
        },
      },
    },
  };
  assert.equal(menuScreen.onKey(ctx, { key: "ArrowDown" }), true);
  assert.equal(menuScreen.onKey(ctx, { key: "ArrowUp" }), true);
  assert.deepEqual(focused, [2, 0]);
  active = null; // focus is on the heading, not on a button
  assert.equal(menuScreen.onKey(ctx, { key: "ArrowDown" }), true);
  assert.equal(focused.at(-1), 0);
  assert.equal(menuScreen.onKey(ctx, { key: "Enter" }), false); // Enter is the button's own
});

test("arrows, Home and End are left alone when focus is on a control outside the menu", () => {
  const focused = [];
  const ctx = {
    root: {
      querySelectorAll: () => [{ focus: () => focused.push(0) }],
      ownerDocument: { activeElement: null },
    },
  };
  const noticeButton = { tagName: "BUTTON", closest: () => null };
  for (const key of ["ArrowDown", "ArrowUp", "Home", "End"]) {
    assert.equal(menuScreen.onKey(ctx, { key, target: noticeButton }), false, key);
  }
  const menuButton = { tagName: "BUTTON", closest: (sel) => (sel === ".menu-list" ? {} : null) };
  assert.equal(menuScreen.onKey(ctx, { key: "Home", target: menuButton }), true);
  assert.deepEqual(focused, [0]);
});

test("About also sits top right in the header, where people look for it (Shara, Nov 13)", () => {
  withFakeDocument(() => {
    const ctx = ctxFor();
    const header = findAll(menuScreen.render(ctx), (n) => n.tag === "header")[0];
    const about = findAll(header, (n) => n.tag === "button" && textOf(n) === "About")[0];
    about.click();
    assert.deepEqual(ctx.log.went, ["about"]);
  });
});
