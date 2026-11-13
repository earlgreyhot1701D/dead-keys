// The Lessons menu's right column (lessons Req 5.3, 5.4; mock screen D), split from
// src/ui/screens/lessons.js at the line cap: the learned-keys map and the selected lesson's
// paper card. Drawing only, with textContent.
import { cardLabel, MENU } from "../../lessons/copy.js";
import { lessonById } from "../../lessons/ladder.js";
import { CARD_STATE, capLabels, legendText, mapKeys } from "../../lessons/menuModel.js";
import { el } from "../dom.js";
import { rowsFor } from "./lessonKeyboard.js";

const dot = (cls) => el("span", { class: `lm-dot${cls}`, "aria-hidden": "true" });

/** The learned-keys map: lit keys, the recommended lesson's keys outlined, and the legend. */
export function lessonsMap(states, recommended) {
  const { lit, next, learned } = mapKeys(states, recommended);
  const legend = legendText(learned, next);
  const cls = (k) => `lm-m${lit.has(k) ? " is-on" : ""}${next.includes(k) ? " is-next" : ""}`;
  // The letter rows, as the locked mock draws them (Block 8b's number row and ' / stay off it).
  const rows = rowsFor(new Set(), false)
    .filter((r) => r[0] !== " ")
    .map((r, i) =>
      el(
        "div",
        { class: `lm-kb-row lm-kb-row-${i}` },
        r.map((k) => el("span", { class: cls(k) }, k)),
      ),
    );
  return el("section", { class: "lm-map", "aria-label": "Learned keys" }, [
    el("div", { class: "lm-kb", "aria-hidden": "true" }, rows),
    el("p", { class: "lm-legend" }, [
      el("span", {}, [dot(" is-on"), legend.learned]),
      legend.next ? el("span", {}, [dot(" is-next"), legend.next]) : null,
      el("span", {}, [dot(""), legend.toCome]),
    ]),
  ]);
}

/**
 * The selected lesson's card: number, state, name, key caps, the four parts, and Start lesson
 * and Test out (Lesson 0: Start only; Later lessons: "Not built yet", no buttons).
 * @param {{ id: string, state: string, start: () => void, testOut: () => void }} o
 */
export function lessonsCard({ id, state, start, testOut }) {
  const l = lessonById(id);
  const parts = id === "L00" ? MENU.parts0 : MENU.parts;
  const canTestOut = l.built && id !== "L00";
  const btn = (label, onClick, primary) =>
    el(
      "button",
      { type: "button", class: `btn btn-term ld-btn${primary ? " is-primary" : ""}`, onClick },
      label,
    );
  const caps = capLabels(id).map((c) => el("span", { class: c.length > 2 ? "is-wide" : "" }, c));
  return el("section", { class: "desk-card lm-card", "aria-labelledby": "lm-card-title" }, [
    el("p", { class: "desk-card-top" }, [
      el("span", {}, cardLabel(l.n)),
      el("span", {}, CARD_STATE[state]),
    ]),
    el("h2", { id: "lm-card-title", class: "lm-card-title" }, l.name),
    el("p", { class: "lm-caps" }, caps),
    l.built
      ? el(
          "ol",
          { class: "lm-parts" },
          parts.map(([b, rest]) => el("li", {}, [el("strong", {}, b), rest])),
        )
      : el("p", { class: "lm-later" }, MENU.later),
    l.built
      ? el("div", { class: "ld-buttons lm-buttons" }, [
          btn(MENU.start, start, true),
          canTestOut ? btn(MENU.testOut, testOut, false) : null,
        ])
      : null,
    canTestOut ? el("p", { class: "lm-note" }, MENU.testOutNote) : null,
  ]);
}
