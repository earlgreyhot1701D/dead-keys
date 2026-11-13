// Shell Req 1.2: Escape goes back one screen outside gameplay. The back-stack and the Escape rule
// are pure, so they are tested here; drawing and focus are covered by the browser flows.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { createNav, escapeAction, isControl, tabTitle } from "./nav.js";

test("it starts on the first screen, which has nothing to go back to", () => {
  const nav = createNav("title");
  assert.equal(nav.current(), "title");
  assert.equal(nav.back(), false);
  assert.deepEqual(nav.stack, ["title"]);
});

test("going forward then back steps through the screens one at a time", () => {
  const nav = createNav("title");
  nav.go("menu");
  nav.go("settings");
  assert.deepEqual(nav.stack, ["title", "menu", "settings"]);
  assert.equal(nav.back(), true);
  assert.equal(nav.current(), "menu");
  assert.equal(nav.back(), true);
  assert.equal(nav.current(), "title");
  assert.equal(nav.back(), false);
});

test("going to a screen already on the stack returns to it, so the stack does not grow", () => {
  const nav = createNav("title");
  for (const id of ["menu", "settings", "menu", "settings", "menu"]) nav.go(id);
  assert.deepEqual(nav.stack, ["title", "menu"]);
  nav.go("menu");
  assert.deepEqual(nav.stack, ["title", "menu"]);
});

test("random navigation: never empty, no repeats, the current screen is last, back removes one", () => {
  const ids = ["title", "menu", "settings", "progress", "privacy", "about", "howWeCount"];
  const step = fc.oneof(
    fc.constantFrom(...ids).map((id) => ["go", id]),
    fc.constant(["back"]),
  );
  fc.assert(
    fc.property(fc.array(step, { maxLength: 80 }), (steps) => {
      const nav = createNav("title");
      for (const [name, id] of steps) {
        const before = nav.stack;
        if (name === "go") nav.go(id);
        else {
          const moved = nav.back();
          assert.equal(moved, before.length > 1);
          assert.equal(nav.stack.length, before.length - (moved ? 1 : 0));
        }
        const stack = nav.stack;
        assert.ok(stack.length >= 1 && stack.length <= 12);
        assert.equal(new Set(stack).size, stack.length);
        assert.equal(nav.current(), stack.at(-1));
        if (name === "go") assert.equal(nav.current(), id);
      }
    }),
  );
});

test("the stack is capped, keeping the newest screens", () => {
  const nav = createNav("a");
  for (let i = 0; i < 30; i++) nav.go(`s${i}`);
  assert.equal(nav.stack.length, 12);
  assert.equal(nav.current(), "s29");
});

test("the stack it hands out is a copy", () => {
  const nav = createNav("title");
  nav.stack.push("hack");
  assert.deepEqual(nav.stack, ["title"]);
});

test("Escape goes back, unless a screen or a dialog already used it", () => {
  assert.equal(
    escapeAction({ key: "Escape", defaultPrevented: false }, { dialogOpen: false }),
    "back",
  );
  assert.equal(
    escapeAction({ key: "Escape", defaultPrevented: true }, { dialogOpen: false }),
    "ignore",
  );
  assert.equal(
    escapeAction({ key: "Escape", defaultPrevented: false }, { dialogOpen: true }),
    "ignore",
  );
  for (const key of ["Enter", "a", "Tab", "Backspace", " ", "escape", "Esc"]) {
    assert.equal(
      escapeAction({ key, defaultPrevented: false }, { dialogOpen: false }),
      "ignore",
      key,
    );
  }
});

test("replace swaps the current screen, so back skips it (the first-run privacy card)", () => {
  const nav = createNav("title");
  nav.go("privacy");
  nav.replace("menu");
  assert.deepEqual(nav.stack, ["title", "menu"]);
  assert.equal(nav.back(), true);
  assert.equal(nav.current(), "title");
});

test("replace on the first screen adds rather than loses it, and a repeat returns to it", () => {
  const nav = createNav("title");
  nav.replace("menu");
  assert.deepEqual(nav.stack, ["title", "menu"]);
  nav.go("settings");
  nav.replace("menu");
  assert.deepEqual(nav.stack, ["title", "menu"]);
});

test("isControl: buttons, links and fields use keys themselves; headings and the page do not", () => {
  for (const tagName of ["BUTTON", "button", "A", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]) {
    assert.equal(isControl({ tagName }), true, tagName);
  }
  assert.equal(isControl({ tagName: "DIV", isContentEditable: true }), true);
  for (const t of [
    { tagName: "H1" },
    { tagName: "BODY" },
    { tagName: "DIV" },
    null,
    undefined,
    {},
  ]) {
    assert.equal(isControl(t), false, JSON.stringify(t));
  }
});

test("each screen names the browser tab (WCAG 2.4.2, a11y audit Nov 13)", () => {
  assert.equal(tabTitle({ title: "Settings" }), "Settings · Dead Keys");
  assert.equal(tabTitle({ title: "Dead Keys" }), "Dead Keys"); // the title screen
  assert.equal(tabTitle(undefined), "Dead Keys");
});
