// Four corners (Req 3): words move from their corner toward the core and cross the danger ring
// exactly at the danger point; cards carry [!] and D:nn; the lock lights its line, its quadrant
// and the beam, and shows DIST and VECTOR.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { createEl } from "../ui/dom.js";
import { findAll, makeFakeDoc } from "../ui/fakeDom.js";
import { CORE, CORNER_AT, createCorners, RING_R, STOP_R, wordAt } from "./corners.js";
import { DANGER_FROM } from "./hud.js";

const target = (id, text, slot, progress, typed = 0) => ({ id, text, slot, progress, typed });
const fromCore = ({ x, y }) => Math.hypot(x - CORE.x, y - CORE.y);

function withDoc(fn) {
  globalThis.document = makeFakeDoc(); // the svg builder uses the page's document
  try {
    return fn();
  } finally {
    delete globalThis.document;
  }
}
const field = () => withDoc(() => createCorners(createEl(globalThis.document)));
const cls = (n) => n.getAttribute?.("class");

test("a word starts at its corner, crosses the ring at the danger point, stops short of the core", () => {
  for (let slot = 0; slot < 4; slot++) {
    assert.deepEqual(wordAt(slot, 0), { x: CORNER_AT[slot][0], y: CORNER_AT[slot][1] });
    assert.ok(Math.abs(fromCore(wordAt(slot, DANGER_FROM)) - RING_R) < 1e-9);
    assert.ok(Math.abs(fromCore(wordAt(slot, 1)) - STOP_R) < 1e-9);
  }
  assert.ok(STOP_R > 88, "it stops outside the 176px core box");
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 3 }),
      fc.double({ min: 0, max: 1, noNaN: true }),
      (s, p) => {
        assert.ok(fromCore(wordAt(s, p)) >= fromCore(wordAt(s, Math.min(1, p + 0.01))) - 1e-9);
      },
    ),
  );
});

test("cards show [·] or [!] and D:nn; the lock lights its line, quadrant and beam", () => {
  const f = field();
  const s = { targets: [target(1, "buffer", 0, 0.2), target(2, "kettle", 3, 0.85)], lockId: null };
  withDoc(() => f.update(s));
  const one = f.cards.get(1);
  assert.equal(one.p.tag.textContent, "[·]");
  assert.equal(one.p.dist.textContent, "D:08");
  assert.equal(cls(f.cards.get(2).node), "cw is-danger");
  assert.equal(f.cards.get(2).p.tag.textContent, "[!]");
  const lines = findAll(f.node, (n) => cls(n)?.startsWith("cn-line"));
  const beam = findAll(f.node, (n) => cls(n)?.startsWith("cn-beam"))[0];
  const quads = findAll(f.node, (n) => /^cn-quad /.test(cls(n) ?? ""));
  assert.equal(quads[0].textContent, "QUADRANT // ALPHA [NW]");

  withDoc(() =>
    f.update({ ...s, targets: [target(1, "buffer", 0, 0.6, 2), s.targets[1]], lockId: 1 }),
  );
  assert.equal(cls(one.node), "cw is-locked");
  assert.equal(one.p.typed.textContent, "bu");
  assert.equal(one.p.rest.textContent, "ffer");
  assert.equal(one.p.lockDist.textContent, "DIST: 04");
  assert.equal(one.p.vector.textContent, "VECTOR NW // CHAR BUFFER: 2/6");
  assert.deepEqual(lines.map(cls), ["cn-line is-on", "cn-line", "cn-line", "cn-line"]);
  assert.equal(cls(beam), "cn-beam is-on");
  assert.equal(quads[0].textContent, "QUADRANT // ALPHA [NW] [LOCKED]");
  assert.equal(cls(quads[0]), "cn-quad cn-nw is-on");

  withDoc(() => f.update({ targets: [s.targets[1]], lockId: null }));
  assert.deepEqual([...f.cards.keys()], [2]);
  assert.equal(cls(beam), "cn-beam");
  assert.equal(cls(quads[0]), "cn-quad cn-nw");
});
