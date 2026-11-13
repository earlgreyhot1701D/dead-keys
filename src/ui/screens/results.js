// Results (play Req 7; mock screen 5 through the map). The round screen hands over the round with
// `showResults` before it opens this screen (the router has no parameters). Enter plays the same
// mode again, Escape goes to the main menu, View progress opens progress. Dropped per the map:
// SESSION, PASS LINE, the drill label, the coach note, the feedback link (and SOUND, as on play).
import { hints, menuButton, NOT_BUILT, scanlines, sysLine } from "../components/chrome.js";
import { breakdownPanel, milestonesPanel, statTiles } from "../components/resultsPanels.js";
import { el } from "../dom.js";
import { chooseRound, roundItems } from "./play.js";

export const HOW_LINK = "How we count every number";
export const SHARE = "Share card";
let shown = null; // { result, log, outcome }

/** Hand the finished round to the results screen. */
export function showResults(data) {
  shown = data;
}

/** The line over the h1: the wave reached, or PRACTICE. */
export const overLine = (r) =>
  r.mode === "practice"
    ? "ROUND_OVER // PRACTICE"
    : `ROUND_OVER // WAVE_${String(r.wave).padStart(2, "0")}_REACHED`;

function accuracyPanel({ result }) {
  const p = Math.round(result.accuracy * 100);
  const cells = Math.floor(p / 4); // 25 cells, one per 4%, as the mock draws 96%
  return el("section", { class: "rs-panel rs-quiet", "aria-label": "Accuracy bar" }, [
    el("span", { class: "rs-acc-head" }, [el("span", {}, "ACCURACY"), el("strong", {}, `${p}%`)]),
    el(
      "span",
      { class: "rs-acc-bar", "aria-hidden": "true" },
      "█".repeat(cells) + "░".repeat(25 - cells),
    ),
  ]);
}

/** The last 8 words, cleared or breached, then "+ n more cleared", then the save status. */
function wordLogPanel({ result, log, outcome }) {
  const more = result.cleared - log.words.filter((w) => w.cleared).length;
  return el("section", { class: "rs-panel rs-quiet rs-log", "aria-labelledby": "rs-log" }, [
    el("p", { class: "panel-head" }, [
      el("span", { id: "rs-log" }, "INTERCEPTED WORDS"),
      el("span", {}, "WORD LOG"),
    ]),
    el(
      "ul",
      { class: "rs-words" },
      log.words.map((w) =>
        el("li", { class: w.cleared ? "rs-word" : "rs-word is-breach" }, [
          el("span", {}, `${w.cleared ? "[·]" : "[!]"} ${w.text}`),
          el("span", { class: "rs-word-how" }, w.cleared ? "CLEARED" : "BREACHED"),
        ]),
      ),
    ),
    more > 0 ? el("p", { class: "rs-more" }, `+ ${more} more cleared`) : null,
    el("p", { class: "rs-status" }, [
      el("span", {}, outcome.saved ? "STATUS: SAVED IN THIS BROWSER" : "STATUS: NOT SAVING"),
      el("span", { class: "rs-block", "aria-hidden": "true" }, "█"),
    ]),
  ]);
}

function playAgain(ctx) {
  const [mode, keep] = [shown.result.mode, roundItems()]; // Play these keys plays them again
  chooseRound(mode, keep);
  ctx.replace(mode === "practice" && !keep ? "practice" : "round");
}

const button = (label, cls, onClick, extra = {}) =>
  el(
    "button",
    { type: "button", class: `btn btn-term rs-btn ${cls}`.trim(), onClick, ...extra },
    label,
  );

/** @type {import("../router.js").Screen} */
export const resultsScreen = {
  id: "results",
  title: "Round results",
  render(ctx) {
    const data = shown;
    const r = data.result;
    return el("div", { class: "screen-frame rs-frame" }, [
      scanlines(),
      el("header", { class: "rs-head" }, [
        el("span", { class: "rs-brand" }, "DEAD KEYS // TERMINAL 84"),
        el("span", { class: "pill" }, "NODE: 0x84-RESULTS"),
        menuButton(ctx), // top right, like every page (Shara, Nov 12)
      ]),
      el("main", { id: "main", class: "rs-body" }, [
        el("section", { class: "rs-title" }, [
          el("div", {}, [
            el("p", { class: "rs-over" }, [
              "// BUFFER STATUS: DUMP_COMPLETE :: ",
              el("strong", {}, overLine(r)),
            ]),
            el("h1", {}, "DEAD KEYS // ROUND RESULTS"),
          ]),
          el("p", { class: "rs-mode" }, `MODE: ${r.mode.toUpperCase()} // PACK: GENERAL`),
        ]),
        el("div", { class: "rs-main" }, [
          el("div", { class: "rs-col" }, [
            statTiles(data),
            el(
              "button",
              { type: "button", class: "rs-how", onClick: () => ctx.go("howWeCount") },
              HOW_LINK,
            ),
            milestonesPanel(data),
          ]),
          el("div", { class: "rs-col" }, [
            breakdownPanel(data),
            accuracyPanel(data),
            wordLogPanel(data),
          ]),
        ]),
        el("section", { class: "rs-actions", "aria-label": "What next" }, [
          button("Play again", "btn-primary", () => playAgain(ctx), {
            "data-focus-id": "rs-again",
          }),
          el("div", { class: "later" }, [
            button(SHARE, "", () => ctx.announce(`${SHARE}: not built yet`), {
              "aria-disabled": "true",
              "aria-describedby": "rs-share-note",
            }),
            el("span", { id: "rs-share-note", class: "later-note" }, NOT_BUILT),
          ]),
          button("View progress", "", () => ctx.go("progress")),
        ]),
      ]),
      el("footer", { class: "term-footer rs-foot" }, [
        el("span", { class: "sys-line" }, sysLine(ctx.state)),
        hints(["[ENTER] PLAY AGAIN", "[TAB] MOVE", "[ESC] MAIN MENU"]),
      ]),
    ]);
  },
  // Enter on a focused control does that control's job; anywhere else it plays again.
  onKey(ctx, e) {
    if (e.key === "Escape") {
      ctx.go("menu");
      return true;
    }
    const tag = e.target?.tagName;
    if (e.key !== "Enter" || tag === "BUTTON" || tag === "A" || tag === "INPUT") return false;
    playAgain(ctx);
    return true;
  },
};
