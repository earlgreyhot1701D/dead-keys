// The progress screen (shell Req 6): keyboard heat map, up to three diagnosis sentences, weak
// keys and personal bests, with a text summary for screen readers. Reads only; never saves.
import { diagnose } from "../../engine/diagnose.js";
import { renderKeyboard } from "../components/keyboard.js";
import { keyboardModel, summarizeKeyboard } from "../components/keyboardLayout.js";
import { el } from "../dom.js";

// Approved wording (shell design copy table).
export const EMPTY_LINE = "Play a round and your keys will show up here.";
export const FEW_LINE = "Not enough typing yet to say anything about your keys. Keep playing.";
export const EVEN_LINE = "Nothing stands out. Your keys look even.";
export const NO_BESTS_LINE = "No personal bests yet. Play a round to set one.";

/** Player names for the modes that can hold a personal best. */
export const MODE_NAMES = Object.freeze({
  corners: "Four corners",
  falling: "Falling words",
  lesson: "Lessons",
  testout: "Test outs",
  daily: "Daily drill",
  specwave: "Spec Wave",
});
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

/**
 * "set Nov 11" for a time in ms, in the player's local time. Empty when the time is unusable.
 * @param {unknown} ms
 */
export function setOn(ms) {
  const d = new Date(typeof ms === "number" ? ms : Number.NaN);
  return Number.isNaN(d.getTime()) ? "" : `set ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const list = (items) =>
  el(
    "ul",
    { class: "plain-list" },
    items.map((t) => el("li", {}, t)),
  );
const bestLine = ([mode, b]) => {
  const name = Object.hasOwn(MODE_NAMES, mode) ? MODE_NAMES[mode] : mode;
  return [`${name}: ${b.wpm} WPM`, setOn(b.date)].filter(Boolean).join(", ");
};

/** @type {import("../router.js").Screen} */
export const progressScreen = {
  id: "progress",
  title: "Progress",
  render(ctx) {
    const { keys = [], bests = {}, rounds = [] } = ctx.state.progress ?? {};
    const d = diagnose(keys);
    const summary = summarizeKeyboard(keyboardModel(keys));
    const bestList = Object.entries(bests);
    return el("main", { id: "main", class: "progress-main" }, [
      el("h1", {}, "Progress"),
      rounds.length === 0 ? el("p", { class: "hint" }, EMPTY_LINE) : null,
      el("section", { "aria-labelledby": "pg-map" }, [
        el("h2", { id: "pg-map" }, "Your keys"),
        renderKeyboard(el, keys),
        el("h3", {}, "Heat map in words"),
        list(summary),
      ]),
      el("section", { "aria-labelledby": "pg-diag" }, [
        el("h2", { id: "pg-diag" }, "What we notice"),
        d.sentences.length
          ? list(d.sentences.map((s) => s.text))
          : el("p", {}, d.sufficientData ? EVEN_LINE : FEW_LINE),
        d.weakKeys.length ? el("p", {}, `Keys to practice: ${d.weakKeys.join(", ")}`) : null,
      ]),
      el("section", { "aria-labelledby": "pg-best" }, [
        el("h2", { id: "pg-best" }, "Personal bests"),
        bestList.length ? list(bestList.map(bestLine)) : el("p", {}, NO_BESTS_LINE),
      ]),
      el("div", { class: "actions" }, [
        el("button", { type: "button", class: "btn", onClick: () => ctx.back() }, "Back"),
      ]),
    ]);
  },
};
