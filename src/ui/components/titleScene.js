// The title screen's still frame of the attract scene, carried over from the locked mock
// (mock/index.html, screen 1): dashed lanes, falling word cards, the locked word with its beam,
// the danger band, a word inside it, the station on the baseline. A picture only: hidden from a
// screen reader, nothing in it takes focus. STUB: it moves in Block 13 (live attract mode); this
// still frame is what reduced motion will show then. The mock's word codes, SHIELD and CAPACITOR
// labels are left out (they read as data).
import { el } from "../dom.js";

/** The falling cards: word and its position class (positions live in title.css). */
const CARDS = [
  { word: "lantern", cls: "fc-1", trail: true },
  { word: "velvet", cls: "fc-2", trail: true },
  { word: "quiet", cls: "fc-3", trail: true },
  { word: "orbit", cls: "fc-4", trail: true },
  { word: "ribbon", cls: "fc-5", trail: false },
];

const card = ({ word, cls, trail }) =>
  el("div", { class: `fall-card ${cls}` }, [
    el("div", { class: "card-box" }, [
      el("div", { class: "card-tag" }, "[·]"),
      el("div", { class: "card-word" }, word),
    ]),
    trail ? el("div", { class: "card-trail" }) : null,
  ]);

/** @returns {HTMLElement} */
export function titleScene() {
  return el("div", { class: "title-scene", "aria-hidden": "true" }, [
    el(
      "div",
      { class: "lanes" },
      [1, 2, 3, 4, 5, 6].map((n) => el("div", { class: `lane lane-${n}` })),
    ),
    ...CARDS.map(card),
    el("div", { class: "locked-box" }, [
      el("div", { class: "locked-bar" }, [el("span", {}, "╔═ LOCKED ═╗"), el("span", {}, "DEMO")]),
      el("div", { class: "locked-word" }, [
        el("span", { class: "typed" }, "har"),
        el("span", { class: "caret" }, "|"),
        "bor",
      ]),
    ]),
    el("div", { class: "beam" }),
    el("div", { class: "danger-band" }),
    el("div", { class: "card-box danger-card" }, [
      el("div", { class: "card-tag" }, "[!]"),
      el("div", { class: "card-word" }, "maple"),
    ]),
    el("div", { class: "station" }, [
      el("div", { class: "st-1" }, "▲"),
      el("div", { class: "st-2" }, "[ ╨ ]"),
      el("div", { class: "st-3" }, "╔═══╩═══╗"),
      el("div", { class: "st-4" }, "▓▓▓▓▓▓▓▓▓▓▓"),
    ]),
    el("div", { class: "baseline" }),
    el("span", { class: "scene-tag station-id" }, "STATION_ID: TER-84 // DEMO"),
    el("div", { class: "demo-stream" }, [
      el("span", { class: "ds-label" }, "DEMO_STREAM:"),
      el("span", { class: "ds-typed" }, [
        el("span", { class: "typed-fill" }, "har"),
        el("span", { class: "ds-cursor" }, "█"),
      ]),
      el("span", { class: "ds-label" }, "TARGET:"),
      el("span", { class: "ds-target" }, "harbor"),
    ]),
  ]);
}
