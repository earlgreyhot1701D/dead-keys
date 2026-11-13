// Which key presses type a character (rounds and lessons), including AltGr and Option.
import assert from "node:assert/strict";
import { test } from "node:test";
import { isTyping } from "./isTyping.js";

test("only single characters without a shortcut key are typing", () => {
  for (const k of ["a", "Z", " ", ";", "ñ", "¿"]) assert.ok(isTyping({ key: k }), k);
  for (const k of ["Shift", "Tab", "Backspace", "Enter", "Escape", "ArrowUp", ""])
    assert.ok(!isTyping({ key: k }), k);
  assert.ok(!isTyping({ key: "a", ctrlKey: true }));
  assert.ok(!isTyping({ key: "a", metaKey: true }));
  assert.ok(!isTyping({ key: "a", altKey: true })); // Windows Alt+letter is a menu shortcut
  // AltGr (Windows: Ctrl+Alt) and Mac Option type Spanish characters (a11y audit, Nov 13)
  for (const k of ["ñ", "¿", "¡", "ü", "é"]) {
    assert.ok(isTyping({ key: k, altKey: true, ctrlKey: true }), `AltGr ${k}`);
    assert.ok(isTyping({ key: k, altKey: true }), `Option ${k}`);
  }
  const altGr = {
    key: "@",
    altKey: true,
    ctrlKey: true,
    getModifierState: (m) => m === "AltGraph",
  };
  assert.ok(isTyping(altGr), "AltGraph on: any one character");
  assert.ok(!isTyping({ key: "ñ", metaKey: true }), "Meta is always a shortcut");
  assert.ok(!isTyping({ key: "a", altKey: true, ctrlKey: true }), "Ctrl+Alt+a stays a shortcut");
  assert.ok(!isTyping(undefined));
});
