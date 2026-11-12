// Show one screen at a time (shell design). The decisions are pure and tested under node (nav.js:
// the back-stack and the Escape rule). This is the thin DOM layer on top: it renders, moves focus
// to the screen's heading, speaks to the live region, and hands each screen a `ctx`.
import { renderNotice, runAction } from "./components/noticeBar.js";
import { isHardwareKey, showPhoneNotice } from "./components/phoneNotice.js";
import { el } from "./dom.js";
import { createNav, escapeAction } from "./nav.js";

/**
 * @typedef {object} Screen
 * @property {string} id
 * @property {string} title Announced when the screen opens.
 * @property {(ctx: object) => Node} render
 * @property {(ctx: object, event: KeyboardEvent) => boolean} [onKey] Return true if it used the key.
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
  root.replaceChildren(noticeSlot, screenSlot);
  const win = doc.defaultView;
  let shown = null; // the state last drawn, so a change only redraws what it affects
  let lastNotice = null;
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
  // "Got it" hides the phone notice until the page is reloaded; focus goes to the heading.
  function dismissPhone() {
    phoneHidden = true;
    draw({ focusHeading: true });
  }
  const has = (id) => Object.hasOwn(screens, id);
  const ctx = () => ({
    state: app.state,
    app,
    root: screenSlot,
    go,
    replace,
    back,
    refresh,
    announce,
    has,
    phone: phone() && !phoneHidden,
    dismissPhone,
  });

  const noticeHandlers = {
    run: (id) => runAction(id, { app, go }),
    dismiss: () => app.dismissNotice(),
  };
  function drawNotice() {
    const id = app.state.notice;
    lastNotice = id;
    noticeSlot.replaceChildren(...(id ? [renderNotice(el, id, noticeHandlers)] : []));
  }

  function draw({ focusHeading }) {
    const screen = screens[nav.current()] ?? screens[start];
    const keep = doc.activeElement?.getAttribute?.("data-focus-id");
    const node = screen.render(ctx());
    screenSlot.replaceChildren(node);
    shown = app.state;
    if (focusHeading) {
      const h = node.querySelector?.("h1");
      h?.setAttribute("tabindex", "-1"); // focusable by script, not by Tab
      h?.focus();
      announce(screen.title);
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

  // A new notice redraws the notice slot; a change to what screens show redraws the screen (in
  // place, keeping focus). A change to neither does nothing.
  const unsubscribe = app.subscribe((s) => {
    if (s.notice !== lastNotice) drawNotice();
    if (
      ["progress", "settings", "persist", "oldData", "newerSave"].some((k) => s[k] !== shown?.[k])
    ) {
      refresh();
    }
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

  drawNotice();
  draw({ focusHeading: true });
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
    },
  };
}
