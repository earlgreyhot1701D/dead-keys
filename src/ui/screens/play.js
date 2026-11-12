// Play: the mode picker (play Req 2.1). Two choices, each with its one-line "how it plays", and
// one shared panel with the rules both games use and the real speed. Enter on a choice starts
// that round; Escape goes back. Every word here is the copy table's (play design.md). No mock
// screen of its own, so it uses the Block 6 page pieces (header, title strip, panels, footer).
import {
  backButton,
  hints,
  menuButton,
  saveNote,
  scanlines,
  termBar,
  termFooter,
} from "../components/chrome.js";
import { el } from "../dom.js";
import { speedText } from "./settings.js";

/** The rounds the picker and the menu can start (play design decision 5). */
export const ROUND_KINDS = Object.freeze({
  falling: { mode: "falling", mechanic: "falling", title: "Falling words" },
  corners: { mode: "corners", mechanic: "corners", title: "Four corners" },
  practice: { mode: "practice", mechanic: "falling", title: "Practice" },
});
let next = "falling";

/**
 * Say which round the round screen starts next (the router has no parameters, so the choice
 * waits here until the screen opens).
 * @throws {RangeError} For a kind that is not a round.
 */
export function chooseRound(kind) {
  if (!Object.hasOwn(ROUND_KINDS, kind)) throw new RangeError(`"${kind}" is not a round`);
  next = kind;
}
/** The round the round screen will start. */
export const nextRound = () => ROUND_KINDS[next];

export const PICK_LINE = "Pick how the words come at you.";
export const CHOICES = Object.freeze([
  {
    kind: "falling",
    name: "Falling words",
    how: "Words drop down eight lanes toward your station. Type the first letter to lock a word, then finish it before it lands.",
  },
  {
    kind: "corners",
    name: "Four corners",
    how: "Words close in from four corners toward the core. Type the first letter to lock the closest one, then finish it before it reaches the ring.",
  },
]);
export const RULES =
  "Lives are the arcade part. A word that lands costs one; a wrong key never does. Words speed up each wave, and you get one free continue. Running out just ends the round, and it's still saved. Want no pressure? Try Practice from the menu.";
export const ESCAPE_LINE = "Escape pauses.";
/** "Speed: 1× (change it in Settings)." with the real speed. */
export const speedLine = (speed) => `Speed: ${speedText(speed)} (change it in Settings).`;

function choice(ctx, { kind, name, how }) {
  const howId = `pick-${kind}-how`;
  return el("section", { class: "term-panel mode-choice", "aria-labelledby": `pick-${kind}` }, [
    el(
      "button",
      {
        type: "button",
        id: `pick-${kind}`,
        class: "btn btn-term btn-primary btn-big",
        "data-focus-id": `pick-${kind}`,
        "aria-describedby": howId,
        onClick: () => {
          chooseRound(kind);
          ctx.go("round");
        },
      },
      name,
    ),
    el("p", { id: howId, class: "mode-how" }, how),
  ]);
}

/** @type {import("../router.js").Screen} */
export const playScreen = {
  id: "play",
  title: "Play",
  render(ctx) {
    const right = [
      el("span", { class: "save-note" }, saveNote(ctx.state)),
      menuButton(ctx),
      backButton(ctx),
    ];
    return el("div", { class: "screen-frame term-page" }, [
      scanlines(),
      el("header", { class: "term-page-head" }, [
        termBar(right, "", () => ctx.go("menu")),
        el(
          "div",
          { class: "title-strip" },
          el("span", { class: "title-strip-left" }, el("h1", {}, "Play")),
        ),
      ]),
      el("main", { id: "main", class: "term-main picker" }, [
        el("p", { class: "picker-line" }, PICK_LINE),
        el(
          "div",
          { class: "picker-choices" },
          CHOICES.map((c) => choice(ctx, c)),
        ),
        el(
          "section",
          { class: "term-panel prose-panel picker-rules", "aria-label": "Rules for both games" },
          [
            el("p", {}, RULES),
            el("p", {}, ESCAPE_LINE),
            el("p", {}, speedLine(ctx.state.settings.speed)),
          ],
        ),
      ]),
      termFooter(ctx.state, [hints(["[ESC] BACK", "[TAB] MOVE"])]),
    ]);
  },
};
