// The packs a player can pick (spanish Req 2): which rounds the pick applies to, and English for
// everything else, including a bad or missing setting.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ROUND_KINDS } from "../ui/screens/roundKinds.js";
import { PACK_IDS, PACK_LABELS, packFor } from "./registry.js";

test("Español applies to Falling words, Four corners and Practice", () => {
  for (const k of ["falling", "corners", "practice"])
    assert.equal(packFor(ROUND_KINDS[k], { pack: "spanish" }).id, "spanish", k);
});

test("drills, the daily drill, Spec Wave and Play these keys keep their own words", () => {
  for (const k of ["drill", "daily", "specwave"])
    assert.equal(packFor(ROUND_KINDS[k], { pack: "spanish" }).id, "general", k);
  const keys = { ...ROUND_KINDS.falling, items: [{ id: "x", text: "fad" }] };
  assert.equal(packFor(keys, { pack: "spanish" }).id, "general");
});

test("a missing or unknown pick is English; the labels are the Play screen's", () => {
  assert.equal(packFor(ROUND_KINDS.falling, {}).id, "general");
  assert.equal(packFor(ROUND_KINDS.falling, { pack: "klingon" }).id, "general");
  assert.deepEqual(
    PACK_IDS.map((id) => PACK_LABELS[id]),
    ["English", "Español"],
  );
});
