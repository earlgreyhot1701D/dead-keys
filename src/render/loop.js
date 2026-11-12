// The game loop (play Req 4): one call per animation frame with the time since the last frame,
// clamped to at most MAX_DT_MS and never NaN or negative; an auto-pause call when the tab is
// hidden or the window loses focus; and `stop`, which leaves no frame request or listener
// behind. The browser pieces come in as arguments so tests can drive it with a fake clock.

/** The most time one frame may move the round: a long stall never becomes a jump. */
export const MAX_DT_MS = 100;

/** A frame's time step: 0 for NaN, negative or missing, at most MAX_DT_MS. */
export function clampDt(dt) {
  return Number.isFinite(dt) && dt > 0 ? Math.min(dt, MAX_DT_MS) : 0;
}

/**
 * Start the loop.
 * @param {object} o
 * @param {(dtMs: number) => void} o.onFrame Called once per frame.
 * @param {() => void} o.onHide Called when the tab is hidden or the window loses focus.
 * @param {Window} [o.win] Gives requestAnimationFrame, cancelAnimationFrame and blur events.
 * @param {Document} [o.doc] Gives visibilitychange.
 * @returns {{ stop: () => void, running: () => boolean }}
 */
export function startLoop({ onFrame, onHide, win = globalThis.window, doc = globalThis.document }) {
  let last = null;
  let handle = null;
  let live = true;
  const frame = (ts) => {
    if (!live) return;
    const dt = last === null ? 0 : clampDt(ts - last);
    last = Number.isFinite(ts) ? ts : last;
    onFrame(dt);
    if (live) handle = win.requestAnimationFrame(frame);
  };
  const onVisibility = () => {
    if (doc.visibilityState === "hidden") hidden();
  };
  // After a hide, the next frame starts its time over, so the time away never counts.
  const hidden = () => {
    last = null;
    onHide();
  };
  doc.addEventListener("visibilitychange", onVisibility);
  win.addEventListener("blur", hidden);
  handle = win.requestAnimationFrame(frame);
  return {
    stop() {
      if (!live) return;
      live = false;
      win.cancelAnimationFrame(handle);
      doc.removeEventListener("visibilitychange", onVisibility);
      win.removeEventListener("blur", hidden);
    },
    running: () => live,
  };
}
