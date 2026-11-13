// Job: a round's limits, watched after every frame (daily Req 2, specwave Req 2): the daily
// drill's 2-minute clock and the Spec Wave's one wave. Each says its line once and ends the round
// once. A round with neither gets a watcher that does nothing.
import { createWaveWatch } from "../specwave/specwave.js";
import { createWatch } from "./daily.js";

/**
 * @param {{ limitMs?: number, waves?: number }} kind
 * @param {(line: string) => void} say The live region.
 * @param {(state: object) => void} end Ends the round.
 */
export function clockFor(kind, say, end) {
  const watches = [
    kind.limitMs ? createWatch() : null,
    kind.waves ? createWaveWatch(kind.waves) : null,
  ].filter(Boolean);
  if (watches.length === 0) return () => {};
  let ended = false;
  return (state) => {
    for (const watch of watches) {
      const r = watch(state);
      if (r.say) say(r.say);
      if (r.end && !ended) {
        ended = true;
        end(state);
      }
    }
  };
}
