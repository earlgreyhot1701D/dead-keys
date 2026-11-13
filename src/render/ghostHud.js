// Job: the ghost's box in the play HUD (ghost Req 2): your ghost's speed and your lead, updated
// each frame by textContent only. Says "You passed your ghost." once, the first time you pull
// ahead after being behind. Both HUDs get it in their first group, after TERMINAL 84.
import { GHOST_COPY, ghostChars, lead, leadText } from "../ghost/ghost.js";

/** The ghost must have typed this many letters right before passing it counts (no start spam). */
export const PASS_AFTER = 10;

/**
 * @param {Function} el
 * @param {object} ghost From `prepareGhost`.
 * @param {(line: string) => void} say The live region.
 * @returns {{ node: HTMLElement, update: (state: object) => void }}
 */
export function createGhostHud(el, ghost, say) {
  const leadNode = el("span", { class: "hud-ghost-lead" });
  const node = el("div", { class: "hud-box hud-ghost" }, [
    el("span", { class: "hud-label" }, "GHOST:"),
    el("span", { class: "hud-strong" }, `${Math.round(ghost.wpm)} WPM`),
    leadNode,
  ]);
  let behind = false;
  let passed = false;
  return {
    node,
    update(state) {
      const n = lead(ghost, state);
      const text = leadText(n);
      if (leadNode.textContent !== text) leadNode.textContent = text;
      if (n < 0) behind = true;
      if (!passed && behind && n > 0 && ghostChars(ghost, state.activeMs) >= PASS_AFTER) {
        passed = true;
        say?.(GHOST_COPY.passed);
      }
    },
  };
}
