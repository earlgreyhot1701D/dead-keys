// Show one screen at a time (shell design). The decisions are pure and tested under node (nav.js:
// the back-stack and the Escape rule). This is the thin DOM layer on top: it renders, moves focus
// to the screen's heading, speaks to the live region, and hands each screen a `ctx`.
import { isHardwareKey, showPhoneNotice } from "./components/phoneNotice.js";
import { el } from "./dom.js";
import { createNav, escapeAction, tabTitle } from "./nav.js";
import { createNoticeSlot } from "./noticeSlot.js";

/** State keys whose change redraws the current screen, unless the screen lists its own. */
const REDRAW_ON = Object.freeze(["progress", "settings", "persist", "oldData", "newerSave"]);

/**
 * @typedef {object} Screen
 * @property {string} id
 * @property {string} title The screen's name (its h1 takes focus when it opens).
 * @property {(ctx: object) => Node} render
 * @property {(ctx: object, event: KeyboardEvent) => boolean} [onKey] Return true if it used the key.
 * @property {string[]} [redrawOn] State keys that redraw it (default REDRAW_ON).
 */

/**
 * Mount the router in the browser. Each screen gets `ctx`: `state`, `app`, `go(id)`, `back()`,
 * `refresh()`, `announce(text)`, `has(id)` (is that screen built?), `phone` (show the phone notice)
 * and `root` (the element the screen is drawn in, for focus moves).
 * @param {{ root: HTMLElement, live: HTMLElement, screens: Record<string, Screen>, app: any, start?: string, doc?: Document }} o
 */
export function mountRouter({ root, live, screens, app, start = "title", doc = document }) {
  const nav = createNav(start);
  const noticeSlot = el("div", { id: "notice", class: "notice-slot", role: "status" });
  const screenSlot = el("div", { id: "screen" });
  const region = el("section", { class: "notice-region", "aria-label": "Notices" }, noticeSlot);
  root.replaceChildren(region, screenSlot); // a labelled region, so landmark navigation finds it
  const win = doc.defaultView;
  let shown = null; // the state last drawn, so a change only redraws what it affects
  let keyboardSeen = false;
  let phoneHidden = false;
  let timer = null;

  function announce(text) {
    live.textContent = ""; // empty first, so the same words are spoken again
    clearTimeout(timer);
    timer = setTimeout(() => {
      live.textContent = text;
    }, 60);
  }
  const phone = () =>
    showPhoneNotice({
      coarse: !!win?.matchMedia?.("(pointer: coarse)").matches,
      width: win?.innerWidth,
      keyboardSeen,
    });
  // "Got it" hides the phone notice for the visit; focus goes to the heading (not announced again).
  function dismissPhone() {
    phoneHidden = true;
    draw({ focusHeading: true });
  }
  const has = (id) => Object.hasOwn(screens, id);
  const actions = { go, replace, back, refresh, announce, has, dismissPhone };
  const showPhone = () => phone() && !phoneHidden;
  const ctx = () => ({ ...actions, app, state: app.state, root: screenSlot, phone: showPhone() });

  const focusTitle = () => {
    const h = screenSlot.querySelector?.("h1");
    h?.setAttribute("tabindex", "-1"); // focusable by script, not by Tab
    h?.focus();
  };
  const notices = createNoticeSlot({
    app,
    doc,
    slot: noticeSlot,
    focusTitle,
    // "Choose another file" lands on the file input, not just the Settings heading.
    go: (s) => {
      go(s);
      screenSlot.querySelector?.("#import-file")?.focus();
    },
  });

  // Heading focus reads the new screen's name; the live region is only for what moves no focus.
  function draw({ focusHeading }) {
    const screen = screens[nav.current()] ?? screens[start];
    const keep = doc.activeElement?.getAttribute?.("data-focus-id");
    const node = screen.render(ctx());
    screenSlot.replaceChildren(node);
    if ("title" in doc) doc.title = tabTitle(screen); // each screen names the tab (WCAG 2.4.2)
    shown = app.state;
    if (focusHeading) {
      focusTitle();
    } else if (keep) {
      for (const n of node.querySelectorAll?.("[data-focus-id]") ?? []) {
        if (n.getAttribute("data-focus-id") === keep) n.focus();
      }
    }
  }
  function go(id) {
    nav.go(has(id) ? id : start);
    draw({ focusHeading: true });
  }
  function replace(id) {
    nav.replace(has(id) ? id : start);
    draw({ focusHeading: true });
  }
  function back() {
    if (nav.back()) draw({ focusHeading: true });
  }
  function refresh() {
    draw({ focusHeading: false });
  }

  // A screen's `redrawOn` (Settings) can skip changes its own controls already show.
  const unsubscribe = app.subscribe((s) => {
    notices.update();
    const keys = screens[nav.current()]?.redrawOn ?? REDRAW_ON;
    if (keys.some((k) => s[k] !== shown?.[k])) refresh();
  });

  function onKeydown(e) {
    if (isHardwareKey(e)) keyboardSeen = true;
    if (e.defaultPrevented) return;
    if (screens[nav.current()]?.onKey?.(ctx(), e)) {
      e.preventDefault();
      return;
    }
    if (escapeAction(e, { dialogOpen: !!doc.querySelector("dialog[open]") }) === "back") {
      e.preventDefault();
      back();
    }
  }
  doc.addEventListener("keydown", onKeydown);

  draw({ focusHeading: true });
  notices.boot();
  return {
    go,
    back,
    refresh,
    announce,
    nav,
    destroy() {
      unsubscribe();
      doc.removeEventListener("keydown", onKeydown);
      clearTimeout(timer);
      notices.destroy();
    },
  };
}
