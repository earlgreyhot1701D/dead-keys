// The title screen (shell Req 1.1, 1.5; design 6), laid out as the locked mock's screen 1. The
// scene is a still frame until the attract demo starts (src/attract/demo.js, Block 13b); any key,
// click or scroll stops it. STUB: the `kiro` easter egg and the sound button (Block 14).

import { createDemo } from "../../attract/demo.js";
import { ghostIcon, hints, scanlines, TERMINAL } from "../components/chrome.js";
import { renderPhoneNotice } from "../components/phoneNotice.js";
import { el } from "../dom.js";
import { isControl } from "../nav.js";

export const TAGLINE = "a typing game, back from the dead.";
export const SUBLINE = "1980s typing games // rebuilt as a real trainer";
export const INTERCEPT = "PARANORMAL INTERCEPT // PID 0xDEAD";
export const PRESS = "Press any key to start.";
export const FOOTER_LINE = "Keyboard required. No account. Your progress stays in this browser.";
/** Shown instead while this browser is not saving, so the footer never claims a save. */
export const FOOTER_NOT_SAVING =
  "Keyboard required. No account. Progress isn't being saved right now.";

/** Keys that never start the game: the ones you use to move around, and browser shortcuts. */
const NOT_A_START = new Set([
  "Tab",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "AltGraph",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "Escape",
  "ContextMenu",
  "PrintScreen",
  "Pause",
  "OS",
  "Help",
  "Fn",
  "FnLock",
]);

/**
 * Does this key press mean "start"? Any key does, except the ones used to move around the page or
 * to run a browser shortcut (Tab, Shift, Escape, F-keys, Ctrl/Alt/Meta combinations).
 * @param {{ key: string, ctrlKey?: boolean, altKey?: boolean, metaKey?: boolean }} e
 */
export function startKey(e) {
  if (typeof e?.key !== "string" || e.key === "") return false;
  if (e.ctrlKey || e.altKey || e.metaKey) return false;
  return !NOT_A_START.has(e.key) && !/^F\d{1,2}$/.test(e.key);
}

/** Where "start" goes: the privacy card the first time, the menu after. */
const begin = (ctx) => ctx.go(ctx.state.settings.privacySeen ? "menu" : "privacy");

let demo = null; // the attract demo on the screen now (one title screen at a time)

const corner = (c, cls) => el("span", { class: `corner ${cls}`, "aria-hidden": "true" }, c);

/** @type {import("../router.js").Screen} */
export const titleScreen = {
  id: "title",
  title: "Dead Keys",
  render(ctx) {
    demo = createDemo(el);
    const stop = (e) => demo?.input(e); // a click or scroll stops the demo (attract Req 1.3)
    return el("div", { class: "screen-frame title-frame", onPointerdown: stop, onWheel: stop }, [
      demo.scene,
      scanlines(),
      el("header", { class: "title-header" }, [
        el("span", { class: "term-name" }, TERMINAL),
        demo.controls,
      ]),
      el("main", { id: "main", class: "title-panel" }, [
        el("div", { class: "intercept" }, [ghostIcon(28, 31), el("span", {}, INTERCEPT)]),
        el("div", { class: "wordmark" }, el("h1", {}, "Dead Keys")),
        el("div", { class: "title-lines" }, [
          el("p", { class: "tagline" }, TAGLINE),
          el("p", { class: "title-sub" }, SUBLINE),
        ]),
        ctx.phone ? renderPhoneNotice(el, ctx.dismissPhone) : null,
        el("div", { class: "press-box" }, [
          corner("╔", "c-tl"),
          corner("╗", "c-tr"),
          corner("╚", "c-bl"),
          corner("╝", "c-br"),
          el("div", { class: "press-row" }, [
            el("p", { class: "press" }, PRESS),
            el("span", { class: "press-cursor", "aria-hidden": "true" }),
          ]),
          el("div", { class: "press-foot" }, [
            el(
              "button",
              { type: "button", class: "btn btn-term btn-primary", onClick: () => begin(ctx) },
              "Start",
            ),
          ]),
        ]),
      ]),
      el("footer", { class: "title-footer" }, [
        el("span", {}, ctx.state?.persist === false ? FOOTER_NOT_SAVING : FOOTER_LINE),
        hints(["[ANY KEY] START", "[TAB] MOVE"]),
      ]),
    ]);
  },
  onKey(ctx, e) {
    demo?.input(e); // any key stops the demo first
    // Enter and Space on a focused button (a notice, "Got it", Start) press that button.
    if (isControl(e.target) && (e.key === "Enter" || e.key === " ")) return false;
    if (!startKey(e)) return false;
    begin(ctx);
    return true;
  },
};
