// The main menu (shell Req 1.4, 1.5): the eight PRD items. A screen that is not built yet shows
// "Not built yet" and stays focusable but does nothing, so the menu reads the same in every build.
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

/** @type {import("../router.js").Screen} */
export const menuScreen = {
  id: "menu",
  title: "Main menu",
  render(ctx) {
    const items = MENU_ITEMS.map(({ label, screen }) => {
      const built = ctx.has(screen);
      return el("li", {}, [
        el(
          "button",
          {
            type: "button",
            class: "btn menu-item",
            "data-focus-id": screen,
            "aria-disabled": built ? null : "true",
            onClick: () => (built ? ctx.go(screen) : ctx.announce(`${label}: not built yet`)),
          },
          [
            el("span", {}, label),
            built ? null : el("span", { class: "menu-note" }, "Not built yet"),
          ],
        ),
      ]);
    });
    return el("main", { id: "main", class: "menu-main" }, [
      el("h1", {}, "Main menu"),
      ctx.phone ? renderPhoneNotice(el, ctx.dismissPhone) : null,
      el("nav", { "aria-label": "Main menu" }, el("ul", { class: "menu-list" }, items)),
      el("p", { class: "hint" }, "Arrow keys move. Enter opens. Escape goes back."),
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
