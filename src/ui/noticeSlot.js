// The notice slot's behavior (shell Req 3.3), split from router.js at the line cap: draw the
// current notice, keep focus off the page body when a notice goes away, and show a startup
// notice a moment after the live region exists so a screen reader reads it once.
import { renderNotice, runAction } from "./components/noticeBar.js";
import { el } from "./dom.js";

/** How long a notice present at startup waits, so its live region sees it arrive. */
export const BOOT_DELAY_MS = 150;

/**
 * @param {object} o
 * @param {any} o.app
 * @param {Document} o.doc
 * @param {HTMLElement} o.slot The `role="status"` element.
 * @param {() => void} o.focusTitle Moves focus to the screen's heading.
 * @param {(screen: string) => void} o.go What a notice button uses to change screen.
 * @param {(fn: () => void, ms: number) => unknown} [o.later] setTimeout, or a test's stand-in.
 */
export function createNoticeSlot({ app, doc, slot, focusTitle, go, later = setTimeout }) {
  let last = null;
  let timer = null;
  const handlers = {
    run: (id) => runAction(id, { app, go }),
    dismiss: () => app.dismissNotice(),
  };
  function draw() {
    const id = app.state.notice;
    last = id;
    const hadFocus = slot.contains?.(doc.activeElement);
    slot.replaceChildren(...(id ? [renderNotice(el, id, handlers)] : []));
    if (hadFocus && !slot.contains?.(doc.activeElement)) focusTitle(); // never drop to the body
  }
  return {
    /** Redraw if the notice changed. */
    update() {
      if (app.state.notice !== last) draw();
    },
    /** Called once after the first screen is drawn. */
    boot() {
      if (app.state.notice) timer = later(() => app.state.notice !== last && draw(), BOOT_DELAY_MS);
    },
    destroy() {
      clearTimeout(timer);
    },
  };
}
