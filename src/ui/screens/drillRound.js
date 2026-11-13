// The options a round starts with (split from round.js at the line cap). A drill also gets item
// weights from the saved key stats at that moment (drills Req 3.2) and says where its words came
// from in the live region once (drills Req 3.4, ai-drills Req 4.1). An AI drill's words arrive as
// the kind's items (drillStart.js); every other round starts exactly as it did before Block 9.
import pack from "../../../packs/general.json" with { type: "json" };
import { DAILY_SAY, dailySeed } from "../../drills/daily.js";
import { drillItems, itemWeights } from "../../drills/weights.js";
import { AI, isDrill } from "../components/drillLabel.js";

/** The live lines when a drill starts (drills and ai-drills copy tables). */
export const DRILL_SAY = "Drill: built-in.";
export const AI_SAY = "Drill: AI-generated.";

/**
 * Where a round kind's words come from: "ai" for a drill on the AI's words, the kind's own
 * drillSource ("built-in") for other drills, null for every other round.
 * @param {{ drillSource?: string, items?: { source?: string }[] }} kind From `nextRound()`.
 * @returns {"ai"|"built-in"|null}
 */
export function kindSource(kind) {
  if (!isDrill(kind)) return null;
  return kind.items?.length && kind.items.every((i) => i.source === AI) ? AI : kind.drillSource;
}

/**
 * createRound's options for the round kind `play.js` chose: the pack's words (or the kind's own
 * items), the seed and the saved speed; for a drill, plus `weights`.
 * @param {object} kind From `nextRound()`.
 * @param {{ state: object, announce: (text: string) => void }} ctx The router's ctx.
 * @param {number} [seed]
 */
export function roundOptions(kind, ctx, seed = Date.now()) {
  const daily = kind.mode === "daily"; // the date is the seed: today's words, for everyone
  if (daily) ctx.announce(DAILY_SAY.start);
  const o = { items: pack.pools.words, ...kind, seed: daily ? dailySeed() : seed };
  o.speed = ctx.state.settings.speed;
  if (!isDrill(kind)) return o;
  ctx.announce(kindSource(kind) === AI ? AI_SAY : DRILL_SAY);
  const keys = ctx.state.progress?.keys ?? [];
  const items = drillItems(o.items, keys); // only words with a weak key, when there are enough
  return { ...o, items, weights: itemWeights(items, keys) };
}
