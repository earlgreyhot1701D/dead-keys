// The options a round starts with (split from round.js at the line cap). A built-in drill also
// gets item weights from the saved key stats at that moment (drills Req 3.2) and says so in the
// live region once (Req 3.4). Every other round starts exactly as it did before Block 9.
import pack from "../../../packs/general.json" with { type: "json" };
import { itemWeights } from "../../drills/weights.js";
import { isDrill } from "../components/drillLabel.js";

/** The live line when a drill starts (drills copy table). */
export const DRILL_SAY = "Drill: built-in.";

/**
 * createRound's options for the round kind `play.js` chose: the pack's words (or the kind's own
 * items), the seed and the saved speed; for a drill, plus `weights`.
 * @param {object} kind From `nextRound()`.
 * @param {{ state: object, announce: (text: string) => void }} ctx The router's ctx.
 * @param {number} [seed]
 */
export function roundOptions(kind, ctx, seed = Date.now()) {
  const o = { items: pack.pools.words, ...kind, seed, speed: ctx.state.settings.speed };
  if (!isDrill(kind)) return o;
  ctx.announce(DRILL_SAY);
  return { ...o, weights: itemWeights(o.items, ctx.state.progress?.keys ?? []) };
}
