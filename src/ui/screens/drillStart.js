// What Drill these keys does (ai-drills design: order of the drill start), split from progress.js.
// AI drills off, or no weak key the AI may see: the built-in drill at once (Block 9). Otherwise
// the waiting line, one request, then the AI's words if there are enough, else the built-in drill.
// Either way the round carries its own label. Nothing here throws.
import pack from "../../../packs/general.json" with { type: "json" };
import { drillRequest, fetchAiWords } from "../../drills/aiClient.js";
import { aiItems } from "../../drills/aiWords.js";
import { DRILL_MIN_WORDS } from "../../drills/weights.js";
import { diagnose } from "../../engine/diagnose.js";
import { chooseRound } from "./play.js";

/**
 * @param {{ state: object, go: (id: string) => void }} ctx The router's ctx.
 * @param {{ wait: (on: boolean) => void, here: () => boolean }} ui From drillButton.js.
 * @param {{ fetch?: typeof fetch }} [o] Tests pass a fake fetch.
 * @returns {Promise<"ai"|"built-in"|"left">} Which drill started ("left": the player had gone).
 */
export async function startDrill(ctx, ui, o = {}) {
  const p = ctx.state.progress ?? {};
  const keys = p.keys ?? [];
  const on = ctx.state.settings?.ai === true;
  const req = on ? drillRequest(pack, diagnose(keys).weakKeys, keys, p.rounds ?? []) : null;
  let words = null;
  if (req) {
    ui.wait(true);
    words = await fetchAiWords(req, pack.charset, o);
    ui.wait(false);
    if (!ui.here()) return "left"; // the player left Progress while the drill was being written
  }
  // An AI drill only when the AI gave enough words with a weak key (Nov 13): otherwise built-in,
  // which always aims at the weak keys. The drill keeps only the aimed words.
  const weak = req?.weakKeys.map((k) => k.key) ?? [];
  const aimed = (words ?? []).filter((w) => weak.some((k) => w.includes(k)));
  const ai = aimed.length >= DRILL_MIN_WORDS;
  chooseRound("drill", ai ? aiItems(aimed) : null);
  ctx.go("round");
  return ai ? "ai" : "built-in";
}
