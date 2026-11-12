// The main menu (shell Req 1.4, 1.5), laid out as the locked mock's screen 2: the eight PRD items
// in the command selector, the right column, header and footer. A screen that is not built yet
// shows "Not built yet" and stays focusable but does nothing, so the menu reads the same in every
// build. The focused item takes the mock's raised look; that look is also its focus indicator.
import { hints, pill, scanlines, sysLine, TERMINAL, terminalIcon } from "../components/chrome.js";
import { liveClock } from "../components/clock.js";
import { renderMenuSide } from "../components/menuSide.js";
import { renderPhoneNotice } from "../components/phoneNotice.js";
import { el } from "../dom.js";
import { isControl } from "../nav.js";

/** The PRD G2 main menu, in order. `screen` is the id the router opens. */
export const MENU_ITEMS = Object.freeze([
  { label: "Play", screen: "play" },
  { label: "Lessons", screen: "lessons" },
  { label: "Practice", screen: "practice" },
  { label: "Daily drill", screen: "daily" },
  { label: "Progress", screen: "progress" },
  { label: "How we count", screen: "howWeCount" },
  { label: "Settings", screen: "settings" },
  { label: "About", screen: "about" },
]);

export const HINTS = ["Arrow keys move.", "Enter opens.", "Escape goes back."];
/** The mock's footer note; shown only while this browser is saving, so it stays true. */
export const MENU_FOOT = "Keyboard required. Your progress stays in this browser.";

/**
 * Where focus goes on an arrow key. Down and Up wrap around; Home and End jump. From nowhere
 * (-1), Down goes to the first item and Up to the last.
 * @returns {number | null} The new index, or null for a key the menu does not use.
 */
export function nextIndex(count, current, key) {
  if (count < 1) return null;
  if (key === "ArrowDown") return current < 0 ? 0 : (current + 1) % count;
  if (key === "ArrowUp") return current < 0 ? count - 1 : (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

function item(ctx, { label, screen }) {
  const built = ctx.has(screen);
  return el("li", {}, [
    el(
      "button",
      {
        type: "button",
        class: "menu-item",
        "data-focus-id": screen,
        "aria-disabled": built ? null : "true",
        onClick: () => (built ? ctx.go(screen) : ctx.announce(`${label}: not built yet`)),
      },
      [
        el("span", { class: "mi-label" }, label),
        built ? null : el("span", { class: "menu-note" }, "Not built yet"),
      ],
    ),
  ]);
}

/** @type {import("../router.js").Screen} */
export const menuScreen = {
  id: "menu",
  title: "Main menu",
  render(ctx) {
    const save = ctx.state?.persist === false ? "OFF" : "THIS BROWSER";
    return el("div", { class: "screen-frame menu-frame" }, [
      scanlines(true),
      el("header", { class: "menu-header" }, [
        el("span", { class: "term-name" }, [
          terminalIcon(22),
          el("span", {}, TERMINAL),
          pill("BUILD v1"),
        ]),
        liveClock(),
      ]),
      el("main", { id: "main", class: "menu-main" }, [
        el("div", { class: "menu-title-row" }, [
          el("div", { class: "menu-title-left" }, [
            pill("SYSTEM 84", "pill-text"),
            el("div", {}, [
              el("span", { class: "flavor" }, "DEAD KEYS // MAIN TERMINAL"),
              el("h1", {}, "Main menu"),
            ]),
          ]),
          el("span", { class: "menu-title-meta" }, ["SAVE: ", el("strong", {}, save)]),
        ]),
        ctx.phone ? renderPhoneNotice(el, ctx.dismissPhone) : null,
        el("div", { class: "menu-grid" }, [
          el("section", { class: "menu-selector", "aria-label": "Command selector" }, [
            el("div", { class: "selector-head" }, [
              el("span", { class: "selector-title" }, "COMMAND SELECTOR // ROOT"),
              el("span", { class: "selector-ch" }, "CH-84"),
            ]),
            el(
              "nav",
              { "aria-label": "Main menu" },
              el(
                "ul",
                { class: "menu-list" },
                MENU_ITEMS.map((i) => item(ctx, i)),
              ),
            ),
            el(
              "p",
              { class: "hint selector-hint" },
              HINTS.map((h) => el("span", {}, h)),
            ),
          ]),
          renderMenuSide(ctx),
        ]),
      ]),
      el("footer", { class: "term-footer menu-footer" }, [
        el("span", { class: "sys-line" }, sysLine(ctx.state)),
        hints(["[ENTER] SELECT", "[TAB] MOVE", "[ESC] BACK"]),
        ctx.state?.persist === false ? null : el("span", { class: "footer-note" }, MENU_FOOT),
      ]),
    ]);
  },
  onKey(ctx, e) {
    // Only when focus is in the menu (or on nothing that uses keys, such as the heading), so a
    // notice button or the page's own scrolling keeps its arrows, Home and End.
    if (isControl(e.target) && !e.target.closest?.(".menu-list")) return false;
    const list = [...ctx.root.querySelectorAll(".menu-item")];
    const i = nextIndex(list.length, list.indexOf(ctx.root.ownerDocument.activeElement), e.key);
    if (i === null) return false;
    list[i].focus();
    return true;
  },
};
