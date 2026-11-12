// The falling field (Req 3): a card per live target, removed when its target goes; the locked
// card and the beam change class only on the lock; positions come from slot and progress only.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createEl } from "../ui/dom.js";
import { makeFakeDoc } from "../ui/fakeDom.js";
import { cardX, cardY, createFalling, FIELD, LANES, LOCK_W, laneX } from "./falling.js";
import { nearness } from "./hud.js";

const target = (id, text, slot, progress, typed = 0) => ({ id, text, slot, progress, typed });

function field() {
  const doc = makeFakeDoc();
  globalThis.document = doc; // the crosshair's svg builder uses the page's document
  try {
    return createFalling(createEl(doc));
  } finally {
    delete globalThis.document;
  }
}
const draw = (f, s) => {
  globalThis.document = makeFakeDoc();
  try {
    f.update(s);
  } finally {
    delete globalThis.document;
  }
};

test("six lanes across the field, cards from the top to the station line", () => {
  assert.equal(LANES, 6);
  assert.equal(laneX(0), FIELD.w / 12);
  assert.equal(laneX(LANES - 1), FIELD.w - FIELD.w / 12);
  for (let s = 0; s < LANES; s++) {
    assert.ok(cardX(s) - LOCK_W / 2 >= 0 && cardX(s) + LOCK_W / 2 <= FIELD.w, `lane ${s}`);
  }
  assert.equal(cardX(3), laneX(3));
  assert.equal(cardY(0), 0);
  // Far words are dimmer: 0 at the top, 1 from the danger zone on, in steps of 0.05.
  assert.equal(nearness(0), 0);
  assert.equal(nearness(0.4), 0.5);
  assert.equal(nearness(0.8), 1);
  assert.equal(nearness(1), 1);
  assert.equal(cardY(1), FIELD.h - FIELD.cardH);
});

test("cards come and go with their targets; lock and beam follow lockId", () => {
  const f = field();
  draw(f, { targets: [target(1, "and", 0, 0.1), target(2, "the", 3, 0.5)], lockId: null });
  assert.deepEqual([...f.cards.keys()], [1, 2]);
  assert.equal(f.cards.get(1).node.getAttribute("class"), "fw");
  const beam = f.node.children.find((n) => n.attrs.class?.startsWith("fall-beam"));
  assert.equal(beam.getAttribute("class"), "fall-beam");

  draw(f, { targets: [target(1, "and", 0, 0.2, 1), target(2, "the", 3, 0.85)], lockId: 1 });
  assert.equal(f.cards.get(1).node.getAttribute("class"), "fw is-locked");
  assert.equal(f.cards.get(2).node.getAttribute("class"), "fw is-danger");
  assert.equal(f.cards.get(1).parts.typed.textContent, "a");
  assert.equal(f.cards.get(1).parts.rest.textContent, "nd");
  assert.equal(beam.getAttribute("class"), "fall-beam is-on");

  draw(f, { targets: [target(2, "the", 3, 0.9)], lockId: null });
  assert.deepEqual([...f.cards.keys()], [2]);
  assert.equal(beam.getAttribute("class"), "fall-beam");
});
