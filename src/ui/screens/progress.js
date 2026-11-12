// The progress screen (shell Req 6): keyboard heat map, up to three diagnosis sentences, weak
// keys and personal bests, with a text summary for screen readers. Reads only; never saves.
import { diagnose } from "../../engine/diagnose.js";
import { renderKeyboard } from "../components/keyboard.js";
import { keyboardModel, summarizeKeyboard } from "../components/keyboardLayout.js";
import { el } from "../dom.js";

// Draft wording, Shara to approve (flagged in the Block 6 notes).
export const EMPTY_LINE = "Play a round and your keys will show up here.";
export const FEW_LINE = "Not enough typing yet to say anything about your keys. Keep playing.";

const list = (items) =>
  el(
    "ul",
    { class: "plain-list" },
    items.map((t) => el("li", {}, t)),
  );
const bestLine = ([mode, b]) => `${mode}: ${b.wpm} WPM`;

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
          : el("p", {}, d.sufficientData ? "Nothing stands out." : FEW_LINE),
        d.weakKeys.length ? el("p", {}, `Keys to practice: ${d.weakKeys.join(", ")}`) : null,
      ]),
      el("section", { "aria-labelledby": "pg-best" }, [
        el("h2", { id: "pg-best" }, "Personal bests"),
        bestList.length ? list(bestList.map(bestLine)) : el("p", {}, "None yet."),
      ]),
      el("div", { class: "actions" }, [
        el("button", { type: "button", class: "btn", onClick: () => ctx.back() }, "Back"),
      ]),
    ]);
  },
};
