// The ghost's HUD box (ghost Req 2): its speed, your lead each frame, and "You passed your
// ghost." said once, only after being behind and once the ghost has typed a few letters.
import assert from "node:assert/strict";
import { test } from "node:test";
import { prepareGhost } from "../ghost/ghost.js";
import { createEl } from "../ui/dom.js";
import { makeFakeDoc, textOf } from "../ui/fakeDom.js";
import { createGhostHud, PASS_AFTER } from "./ghostHud.js";

const k = (t) => ({ t, expected: "a", typed: "a", ok: true });
const ghost = prepareGhost({
  wpm: 35.6,
  keystrokes: Array.from({ length: 40 }, (_, i) => k(i * 100)),
});
const you = (n, activeMs) => ({ activeMs, keystrokes: Array.from({ length: n }, (_, i) => k(i)) });

test("the box shows the ghost's speed and your lead", () => {
  const said = [];
  const h = createGhostHud(createEl(makeFakeDoc()), ghost, (l) => said.push(l));
  assert.ok(textOf(h.node).startsWith("GHOST:36 WPM"));
  const leadNode = h.node.children.at(-1);
  h.update(you(0, 0));
  assert.equal(leadNode.textContent, "1 BEHIND"); // the ghost's first letter is at 0 ms
  h.update(you(5, 300));
  assert.equal(leadNode.textContent, "+1 AHEAD");
  h.update(you(4, 300));
  assert.equal(leadNode.textContent, "LEVEL");
});

test("passing is said once, only after being behind, and not before the ghost has started", () => {
  const said = [];
  const h = createGhostHud(createEl(makeFakeDoc()), ghost, (l) => said.push(l));
  h.update(you(3, 200)); // level
  h.update(you(20, 300)); // ahead, but never behind yet
  assert.deepEqual(said, []);
  h.update(you(5, (PASS_AFTER + 5) * 100)); // behind
  h.update(you(30, (PASS_AFTER + 5) * 100)); // ahead: passed
  h.update(you(5, (PASS_AFTER + 6) * 100));
  h.update(you(40, (PASS_AFTER + 7) * 100)); // ahead again: not said twice
  assert.deepEqual(said, ["You passed your ghost."]);
});
