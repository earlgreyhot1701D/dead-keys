// Fit the 1440x900 design on a smaller laptop screen (Shara's rule: no page scrolls). On a
// viewport from 1100x600 up to 1440x900, the whole page is zoomed by one factor so every screen
// fits, the same way the locked mock fits itself. Below that size (a narrow window, or the
// browser zoomed past about 130%) nothing is zoomed and the page reflows and scrolls instead, so
// browser zoom and text resizing keep working (WCAG 1.4.4, 1.4.10).

export const DESIGN = Object.freeze({ width: 1440, height: 900 });
export const FIT_MIN = Object.freeze({ width: 1100, height: 600 });

/**
 * The zoom factor for a viewport: 1 at or above the design size, smaller to fit, and 1 again
 * below FIT_MIN, where the layout reflows instead.
 * @param {number} w Viewport width in CSS pixels.
 * @param {number} h Viewport height in CSS pixels.
 * @returns {number} From about 0.67 to 1.
 */
export function fitFactor(w, h) {
  if (!(w >= FIT_MIN.width && h >= FIT_MIN.height)) return 1;
  return Math.min(1, w / DESIGN.width, h / DESIGN.height);
}

/** Apply the factor to the page now and on every resize. Browser only. */
export function mountFit(win = globalThis.window) {
  if (!win?.document) return;
  const root = win.document.documentElement;
  const apply = () => {
    const k = fitFactor(win.innerWidth, win.innerHeight);
    root.classList.toggle("fit", k < 1);
    root.style.setProperty("--fit", String(k));
  };
  apply();
  win.addEventListener("resize", apply);
}
