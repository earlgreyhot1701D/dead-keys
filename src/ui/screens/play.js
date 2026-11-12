// Play: the mode picker (play Req 2.1, 2.3). Two choices, each with its one-line "how it plays",
// one shared panel with the rules both games use, and the speed slider (the same setting
// Settings shows). Enter on a choice starts that round; Escape goes back. Every word here is the
// copy table's (play design.md). No mock screen of its own, so it uses the Block 6 page pieces.
import { SPEED_MAX, SPEED_MIN } from "../../engine/config.js";
import { isValidSetting } from "../../storage/settings.js";
import { termPage } from "../components/chrome.js";
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
export const BADGE = "SELECT";
export const CHOICES = Object.freeze([
  {
    kind: "falling",
    name: "Falling words",
    how: "Words drop down six lanes toward your station. Type the first letter to lock a word, then finish it before it lands.",
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
export const SPEED_HINT = "Slower words give you more time. You can change this any time.";

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

/** The speed slider: same range, steps and readout as Settings; a change saves at once. */
function speedRow(ctx) {
  const speed = ctx.state.settings.speed;
  // The slider speaks its own value, so the visible readout is hidden from a screen reader.
  const shown = el("span", { class: "pick-speed-out", "aria-hidden": "true" }, speedText(speed));
  return el("p", { class: "set-row picker-speed" }, [
    el("label", { for: "pick-speed" }, "Speed "),
    el("input", {
      type: "range",
      id: "pick-speed",
      "data-focus-id": "pick-speed",
      min: SPEED_MIN,
      max: SPEED_MAX,
      step: 0.1,
      value: speed,
      "aria-valuetext": speedText(speed),
      "aria-describedby": "pick-speed-hint",
      onInput: (e) => {
        const text = speedText(Number(e.target.value));
        shown.textContent = text;
        e.target.setAttribute?.("aria-valuetext", text);
      },
      onChange: (e) => {
        const v = Number(e.target.value);
        if (isValidSetting("speed", v)) ctx.app.setSetting("speed", v);
        else ctx.refresh(); // put the slider back to what is saved
      },
    }),
    " ",
    shown,
    el("span", { id: "pick-speed-hint", class: "hint" }, SPEED_HINT),
  ]);
}

/** @type {import("../router.js").Screen} */
export const playScreen = {
  id: "play",
  title: "Play",
  // The slider already shows a speed change, so a settings change does not redraw the picker.
  redrawOn: ["progress", "persist", "oldData", "newerSave"],
  render(ctx) {
    return termPage(ctx, {
      badgeText: BADGE,
      title: "Play",
      body: el("main", { id: "main", class: "term-main picker" }, [
        el("p", { class: "picker-line" }, PICK_LINE),
        el(
          "div",
          { class: "picker-choices" },
          CHOICES.map((c) => choice(ctx, c)),
        ),
        el(
          "section",
          { class: "term-panel prose-panel picker-rules", "aria-label": "Rules for both games" },
          [el("p", {}, RULES), el("p", {}, ESCAPE_LINE), speedRow(ctx)],
        ),
      ]),
    });
  },
};
