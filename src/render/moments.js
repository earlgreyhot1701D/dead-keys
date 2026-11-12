// The three moments (play Req 6): a miss flashes the locked word's border coral, a clear shrinks
// the word away with a "✓", a wave up shows a "WAVE nn" banner. Each one sets `data-moment` on a
// node for its time; the look, and the reduced-motion version (same colors and words, no
// movement), are in src/styles/playMoments.css. `stop` clears every timer, so none outlives its
// screen (Req 4.4).
import { waveText } from "./hud.js";

/** How long each moment lasts, in milliseconds (Req 6.1). */
export const MOMENT_MS = Object.freeze({ miss: 200, clear: 250, wave: 1000 });

/**
 * @param {{ setTimeout: Function, clearTimeout: Function }} [timers] The page's, or a fake.
 */
export function createMoments(timers = globalThis) {
  const pending = new Map(); // node -> timer, so a new moment on a node restarts its time
  function hold(node, name, ms, done) {
    if (!node) return;
    timers.clearTimeout(pending.get(node));
    node.setAttribute("data-moment", name);
    const id = timers.setTimeout(() => {
      pending.delete(node);
      node.setAttribute("data-moment", "");
      done?.();
    }, ms);
    pending.set(node, id);
  }
  return {
    /** The locked word's card: its border is coral for MOMENT_MS.miss. */
    miss: (card) => hold(card, "miss", MOMENT_MS.miss),
    /** A cleared word's card: shrinks away with a ✓, then `done` takes it off the page. */
    clear: (card, done) => hold(card, "clear", MOMENT_MS.clear, done),
    /** The banner: "WAVE 04" for MOMENT_MS.wave. */
    wave(banner, wave) {
      if (!banner) return;
      banner.textContent = waveText({ wave });
      hold(banner, "wave", MOMENT_MS.wave);
    },
    /** Clear every timer (the screen is closing). */
    stop() {
      for (const id of pending.values()) timers.clearTimeout(id);
      pending.clear();
    },
  };
}

/**
 * Run the moments for one engine step, before the frame is drawn.
 * @param {ReturnType<typeof createMoments>} m
 * @param {{ cards: Map<number, any>, banner: HTMLElement }} field The renderer.
 * @param {object[]} events
 * @param {object} before The state the events came from (it holds the lock a miss was on).
 */
export function playMoments(m, field, events, before) {
  for (const e of events) {
    if (e.type === "miss" && e.expected !== null) m.miss(field.cards.get(before.lockId)?.node);
    if (e.type === "waveUp") m.wave(field.banner, e.wave);
    if (e.type === "warmupDone") m.wave(field.banner, 1); // wave 1 starts for real
    if (e.type !== "cleared") continue;
    const c = field.cards.get(e.targetId);
    if (!c) continue;
    c.leaving = true; // the renderer keeps it on the page until the moment ends
    m.clear(c.node, () => {
      c.node.remove();
      field.cards.delete(e.targetId);
    });
  }
}
