// One play screen's page (split from round.js at the line cap): the field and HUD for the
// mechanic, laid out as mocks 3 and 4, and what each engine step draws: the moments, the word
// log, then the frame. The engine, keys and dialogs stay in src/ui/screens/round.js.
import { scanlines } from "../ui/components/chrome.js";
import { createCorners } from "./corners.js";
import { createCornersHud } from "./cornersHud.js";
import { createFalling } from "./falling.js";
import { logWords } from "./hud.js";
import { createMoments, playMoments } from "./moments.js";
import { createPlayHud } from "./playHud.js";

/**
 * @param {Function} el
 * @param {object} o
 * @param {"falling"|"corners"} o.mechanic
 * @param {boolean} o.practice
 * @param {string} o.title The screen's h1 (read by a screen reader; the mock shows none).
 * @param {boolean} o.persist
 * @param {number} o.speed
 * @param {"built-in"|"ai"|null} [o.drill] A drill's source: the HUD shows its badge (falling only).
 * @param {() => void} o.onPause The footer's pause button.
 */
export function createStage(el, { mechanic, practice, title, persist, speed, drill, onPause }) {
  const corners = mechanic === "corners";
  const field = (corners ? createCorners : createFalling)(el);
  const hud = (corners ? createCornersHud : createPlayHud)(el, {
    onPause,
    persist,
    speed,
    practice,
    drill,
  });
  const moments = createMoments();
  let log = { words: [], breaches: 0 };
  const node = el("div", { class: "screen-frame play-frame" }, [
    scanlines(),
    el("h1", { class: "sr-only" }, title),
    hud.header,
    el("main", { id: "main", class: corners ? "play-main cn-main" : "play-main" }, [
      field.node,
      hud.station,
    ]),
    hud.footer,
  ]);
  return {
    node,
    /** Draw one engine step: its moments, its words for the log, then the frame. */
    show(events, before, state) {
      playMoments(moments, field, events, before);
      log = logWords(log, events, before);
      field.update(state);
      hud.update(state);
    },
    /** Tell the footer whether Caps Lock is on (the round screen reads it from each key). */
    setCaps: (on) => hud.setCaps(on),
    /** The word log so far: the last 8 words and every breach. */
    log: () => log,
    /** Clear every moment's timer (the screen is closing). */
    stop: () => moments.stop(),
  };
}
