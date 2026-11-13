// The built-in drill round (drills Req 3, 4): the options it starts with, the HUD badge and the
// live line, recording with drillSource "built-in", the results badge and row, and Play again.
// Every other round starts, draws and records as before.
import assert from "node:assert/strict";
import { test } from "node:test";
import pack from "../../../packs/general.json" with { type: "json" };
import { itemWeights } from "../../drills/weights.js";
import { DRILL_BADGE, DRILL_SOURCE } from "../components/drillLabel.js";
import { findAll, makeFakeDoc, textOf } from "../fakeDom.js";
import { DRILL_SAY, roundOptions } from "./drillRound.js";
import { chooseRound, nextRound, ROUND_KINDS } from "./play.js";
import { resultsScreen } from "./results.js";
import { roundScreen } from "./round.js";

const KEYS = [{ key: "q", attempts: 40, misses: 20, lastSeen: 0 }];
const ctxFor = (said = []) => ({
  state: { settings: { speed: 1.2 }, progress: { keys: KEYS } },
  announce: (t) => said.push(t),
});

test("the drill kind: Practice mode on the falling layout, titled Drill, built-in source", () => {
  assert.deepEqual(ROUND_KINDS.drill, {
    mode: "practice",
    mechanic: "falling",
    title: "Drill",
    drillSource: "built-in",
  });
});

test("roundOptions: other rounds get exactly what round.js passed before, with no weights", () => {
  const said = [];
  for (const kind of ["falling", "corners", "practice"]) {
    const o = roundOptions(ROUND_KINDS[kind], ctxFor(said), 5);
    assert.deepEqual(o, { items: pack.pools.words, ...ROUND_KINDS[kind], seed: 5, speed: 1.2 });
  }
  const items = [{ id: "x", text: "fad" }];
  assert.equal(roundOptions({ ...ROUND_KINDS.practice, items }, ctxFor(said), 5).items, items);
  assert.deepEqual(said, [], "no live line outside a drill");
});

test("roundOptions: a drill weighs the pack's words from the saved stats, and says so once", () => {
  const said = [];
  const o = roundOptions(ROUND_KINDS.drill, ctxFor(said), 5);
  assert.deepEqual(o.weights, itemWeights(pack.pools.words, KEYS));
  assert.equal(o.weights.length, pack.pools.words.length);
  assert.deepEqual(said, [DRILL_SAY]);
  assert.equal(DRILL_SAY, "Drill: built-in.");
  const none = roundOptions(ROUND_KINDS.drill, { ...ctxFor(), state: { settings: { speed: 1 } } });
  assert.ok(
    none.weights.every((w, i) => Math.abs(w - 0.05 * pack.pools.words[i].text.length) < 1e-9),
  );
});

/** A round on a fake page, ended from the pause dialog; returns what it said and recorded. */
function playAndEnd(kind) {
  const frames = [];
  globalThis.window = {
    requestAnimationFrame: (f) => frames.push(f),
    cancelAnimationFrame: () => frames.splice(0),
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const doc = makeFakeDoc();
  doc.addEventListener = () => {};
  doc.removeEventListener = () => {};
  globalThis.document = doc;
  const log = { go: [], said: [], finished: [] };
  chooseRound(kind);
  const ctx = {
    state: { settings: { speed: 1 }, persist: true, progress: { keys: KEYS } },
    go: (id) => log.go.push(id),
    replace: (id) => log.go.push(id),
    announce: (t) => log.said.push(t),
    app: {
      finishRound: (result) => {
        log.finished.push(result);
        return { recorded: true, saved: true, newBest: null, milestones: [], previous: null };
      },
    },
  };
  const node = roundScreen.render(ctx);
  doc.body.append(node);
  const hud = textOf(findAll(node, (n) => n.tag === "header")[0]);
  const h1 = textOf(findAll(node, (n) => n.tag === "h1")[0]);
  roundScreen.onKey({}, { key: "Escape" }); // nothing locked: pause
  const end = findAll(doc.body, (n) => n.tag === "button" && textOf(n) === "End round")[0];
  end.click();
  return { hud, h1, log, ctx };
}
const cleanup = () => {
  delete globalThis.window;
  delete globalThis.document;
};

test("a drill: h1 Drill, the HUD badge after the practice note, the live line once", () => {
  try {
    const { hud, h1, log } = playAndEnd("drill");
    assert.equal(h1, "Drill");
    assert.ok(hud.includes(DRILL_BADGE));
    assert.ok(hud.indexOf("No lives") < hud.indexOf(DRILL_BADGE), "after the practice note");
    assert.ok(!hud.includes("LIVES:") && !hud.includes("SECTOR:"));
    assert.equal(log.said.filter((l) => l === DRILL_SAY).length, 1);
    const [r] = log.finished;
    assert.equal(r.mode, "practice");
    assert.equal(r.drillSource, "built-in");
    assert.equal(r.packId, pack.id);
  } finally {
    cleanup();
  }
});

test("other rounds: no badge, no drill line, drillSource null", () => {
  try {
    for (const kind of ["falling", "practice"]) {
      const { hud, log } = playAndEnd(kind);
      assert.ok(!hud.includes(DRILL_BADGE), kind);
      assert.ok(!log.said.includes(DRILL_SAY), kind);
      assert.equal(log.finished[0].drillSource, null, kind);
      cleanup();
    }
  } finally {
    cleanup();
  }
});

test("a drill's results: the badge under the mode line, DRILL SOURCE last; Play again drills", () => {
  try {
    const { log, ctx } = playAndEnd("drill");
    assert.deepEqual(log.go, ["results"]);
    const node = resultsScreen.render(ctx);
    const text = textOf(node);
    assert.ok(text.includes("ROUND_OVER // PRACTICE"));
    const mode = findAll(node, (n) => n.attrs?.class === "rs-mode-col")[0];
    assert.equal(textOf(mode), `MODE: PRACTICE // PACK: GENERAL${DRILL_BADGE}`);
    const rows = findAll(node, (n) => n.attrs?.class?.startsWith("rs-row") && n.tag === "p");
    assert.equal(textOf(rows.at(-1)), `${DRILL_SOURCE.label}${DRILL_SOURCE.value}`);
    resultsScreen.onKey(ctx, { key: "Enter", target: { tagName: "BODY" } });
    assert.deepEqual(log.go.at(-1), "round");
    assert.deepEqual(nextRound(), ROUND_KINDS.drill);
  } finally {
    cleanup();
  }
});

test("a non-drill round's results show neither the badge nor the row", () => {
  try {
    const { ctx } = playAndEnd("practice");
    const text = textOf(resultsScreen.render(ctx));
    assert.ok(!text.includes(DRILL_BADGE) && !text.includes(DRILL_SOURCE.label));
  } finally {
    cleanup();
  }
});
