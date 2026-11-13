// The Play screen's Words choice (spanish Req 2): the two packs, the saved one picked, a change
// saved at once, and the hint tied to the control.
import assert from "node:assert/strict";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { PACK_HINT, packRow } from "./packPick.js";

const ctxFor = (pack) => {
  const log = [];
  return {
    log,
    state: { settings: { pack } },
    app: { setSetting: (k, v) => log.push([k, v]) },
    refresh: () => log.push(["refresh"]),
  };
};

test("English and Español, the saved one picked, the hint tied to the select", () => {
  withFakeDocument(() => {
    const node = packRow(ctxFor("spanish"));
    const select = findAll(node, (n) => n.tag === "select")[0];
    const opts = findAll(select, (n) => n.tag === "option");
    assert.deepEqual(opts.map(textOf), ["English", "Español"]);
    assert.equal(opts[1].selected, true);
    assert.equal(select.attrs["aria-describedby"], "pick-pack-hint");
    assert.ok(textOf(node).includes(PACK_HINT));
  });
});

test("a change saves at once; a value that is not a pack puts the choice back", () => {
  withFakeDocument(() => {
    const ctx = ctxFor("general");
    const select = findAll(packRow(ctx), (n) => n.tag === "select")[0];
    select.listeners.change({ target: { value: "spanish" } });
    select.listeners.change({ target: { value: "klingon" } });
    assert.deepEqual(ctx.log, [["pack", "spanish"], ["refresh"]]);
  });
});
