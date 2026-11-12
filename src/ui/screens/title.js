// The title screen (shell Req 1.1, 1.5; design 6). STUB: the live attract demo arrives in Block 13
// and the `kiro` easter egg in Block 14. Today it shows the still frame the demo will fall back to
// under reduced motion, so a still frame is also what a reduced-motion player will always see.
import { renderPhoneNotice } from "../components/phoneNotice.js";
import { el } from "../dom.js";
import { isControl } from "../nav.js";

export const TAGLINE = "a typing game, back from the dead.";

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

/** A static drawing of the locked title scene: words falling, one locked, a station below. */
function stillFrame() {
  const word = (text, cls) => el("span", { class: `card ${cls}` }, text);
  return el("div", { class: "frame", "aria-hidden": "true" }, [
    word("mist", "card-1"),
    word("lantern", "card-2"),
    word("fern", "card-3"),
    word("quill", "card-4"),
    el("span", { class: "card card-5 locked" }, [el("strong", {}, "gh"), "ost"]),
    el("div", { class: "danger-band" }, "[!] danger line"),
    el("div", { class: "station" }, "▄▄█▄▄"),
  ]);
}

/** @type {import("../router.js").Screen} */
export const titleScreen = {
  id: "title",
  title: "Dead Keys",
  render(ctx) {
    return el("main", { id: "main", class: "title-main" }, [
      el("h1", {}, "Dead Keys"),
      el("p", { class: "tagline" }, TAGLINE),
      ctx.phone ? renderPhoneNotice(el, ctx.dismissPhone) : null,
      stillFrame(),
      el("p", { class: "press" }, "Press any key to start."),
      el("button", { type: "button", class: "btn", onClick: () => begin(ctx) }, "Start"),
    ]);
  },
  onKey(ctx, e) {
    // Enter and Space on a focused button (a notice, "Got it", Start) press that button.
    if (isControl(e.target) && (e.key === "Enter" || e.key === " ")) return false;
    if (!startKey(e)) return false;
    begin(ctx);
    return true;
  },
};
