// The ghost line on results (ghost Req 3): the race's outcome, the new-ghost line, both, or
// nothing; never after Play these keys, which neither races nor saves a ghost.
import assert from "node:assert/strict";
import { test } from "node:test";
import { GHOST_COPY } from "../../ghost/ghost.js";
import { textOf, withFakeDocument } from "../fakeDom.js";
import { chooseRound } from "./play.js";
import { ghostLine, modeBlock } from "./resultsDrill.js";

const r = { mode: "falling", wpm: 40.6, drillSource: null };
const line = (ghost) => withFakeDocument(() => textOf(ghostLine(r, ghost)));

test("raced and beaten, with a new ghost saved", () => {
  chooseRound("falling");
  assert.equal(
    line({ raced: 36.2, saved: true }),
    `You beat your ghost: 41 WPM to 36. ${GHOST_COPY.saved}`,
  );
});

test("raced and lost: no new ghost; first ghost: only the saved line; neither: no line", () => {
  chooseRound("falling");
  assert.equal(line({ raced: 44, saved: false }), "Your ghost was faster: 44 WPM to your 41.");
  assert.equal(line({ raced: null, saved: true }), GHOST_COPY.saved);
  assert.equal(
    withFakeDocument(() => ghostLine(r, { raced: null, saved: false })),
    null,
  );
  assert.equal(
    withFakeDocument(() => ghostLine(r, undefined)),
    null,
  );
});

test("Play these keys: no ghost line", () => {
  chooseRound("falling", [{ id: "w", text: "fad" }]);
  assert.equal(
    withFakeDocument(() => ghostLine(r, { raced: 30, saved: true })),
    null,
  );
  chooseRound("falling");
});

test("the mode block carries the line under the mode line", () => {
  chooseRound("falling");
  const t = withFakeDocument(() => textOf(modeBlock(r, { ghost: { raced: 36, saved: false } })));
  assert.equal(t, "MODE: FALLING // PACK: GENERALYou beat your ghost: 41 WPM to 36.");
});
