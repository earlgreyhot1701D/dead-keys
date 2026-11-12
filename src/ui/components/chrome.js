// The locked mock's frame, shared by every screen: header bar, footer bar, panel heads, badges,
// icons and the system line (mock/index.html is the spec for how these look). Everything here
// says only what is true: the save line follows `persist`, CRT-SCAN follows reduced motion.
import { el } from "../dom.js";
import { svg } from "../svg.js";

export const TERMINAL = "Dead Keys // Terminal 84";
export const NOT_BUILT = "Not built yet";

/** The mock's small terminal icon. Decoration. */
export function terminalIcon(size = 22) {
  const line = { fill: "none", stroke: "#4FE3D1", "stroke-width": 1.8 };
  return svg("svg", { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true" }, [
    svg("rect", { x: 2, y: 4, width: 20, height: 16, ...line }),
    svg("path", { d: "M6 9l3 3-3 3M11 15h6", ...line }),
  ]);
}

/** Our own small ghost, the only mascot. Decoration. */
export function ghostIcon(width = 28, height = 31) {
  return svg("svg", { viewBox: "0 0 24 24", width, height, "aria-hidden": "true" }, [
    svg("path", {
      d: "M4 20V10a8 8 0 0 1 16 0v10l-3-2-2.5 2-2.5-2-2.5 2-2.5-2-3 2z",
      fill: "none",
      stroke: "#4FE3D1",
      "stroke-width": 1.6,
    }),
    svg("rect", { x: 8.4, y: 9, width: 2, height: 2.6, fill: "#4FE3D1" }),
    svg("rect", { x: 13.6, y: 9, width: 2, height: 2.6, fill: "#4FE3D1" }),
  ]);
}

/** Are the scanlines on? They are off under reduced motion. */
export const crtOn = () => !globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/** "SYS.84 // SAVE: THIS BROWSER // CRT-SCAN ON", true to the moment it is drawn. */
export function sysLine(state) {
  const save = state?.persist === false ? "OFF" : "THIS BROWSER";
  return `SYS.84 // SAVE: ${save} // CRT-SCAN ${crtOn() ? "ON" : "OFF"}`;
}

/** The faint scanline layer over a whole screen (gone under reduced motion). */
export const scanlines = (fine = false) =>
  el("div", { class: fine ? "scan scan-fine" : "scan", "aria-hidden": "true" });

/** A row of key hints like "[TAB] MOVE". Each is its own span, as in the mock. */
export const hints = (list, cls = "") =>
  el(
    "span",
    { class: `hints ${cls}`.trim() },
    list.map((h) => el("span", {}, h)),
  );

/** A small bordered label, such as "BUILD v1". */
export const pill = (text, cls = "") => el("span", { class: `pill ${cls}`.trim() }, text);

/** A filled badge, such as "DIAGNOSTIC LOG". */
export const badge = (text) => el("span", { class: "badge" }, text);

/** The top bar of a panel: a title on the left, something small on the right, a rule below. */
export const panelHead = (left, right = null, cls = "") =>
  el("div", { class: `panel-head ${cls}`.trim() }, [left, right]);

/** A panel for a feature a later block builds: its real title, and the words "Not built yet". */
export function notBuiltPanel(title, extra = null) {
  return el("section", { class: "term-panel not-built", "aria-label": title }, [
    panelHead(el("span", { class: "panel-title" }, title), null),
    el("div", { class: "not-built-body" }, [extra, el("p", {}, NOT_BUILT)]),
  ]);
}

/** The standard header bar: icon and terminal name on the left, `right` on the right. */
export function termBar(right = [], cls = "") {
  return el("div", { class: `term-header ${cls}`.trim() }, [
    el("span", { class: "term-name" }, [terminalIcon(20), el("span", {}, TERMINAL)]),
    el("span", { class: "term-header-right" }, right),
  ]);
}

/** The standard footer bar: the system line, then whatever else the screen lists. */
export function termFooter(state, rest = [], cls = "") {
  return el("footer", { class: `term-footer ${cls}`.trim() }, [
    el("span", { class: "sys-line" }, sysLine(state)),
    ...rest,
  ]);
}

/** A Back button for the header, in the mock's bracket style. */
export const backButton = (ctx) =>
  el("button", { type: "button", class: "btn btn-term", onClick: () => ctx.back() }, "Back");

/**
 * A full page in the mock's diagnostic-log style (progress, and the screens with no mock of
 * their own): header, a title strip with a badge and the h1, the main area, and the footer.
 */
export function termPage(ctx, { badgeText, flavor, title, meta = null, body, footerExtra = [] }) {
  return el("div", { class: "screen-frame term-page" }, [
    scanlines(),
    // Both bars sit in the page's one <header>, so everything is inside a landmark.
    el("header", { class: "term-page-head" }, [
      termBar([el("span", { class: "save-note" }, saveNote(ctx.state)), backButton(ctx)]),
      el("div", { class: "title-strip" }, [
        el("span", { class: "title-strip-left" }, [
          badge(badgeText),
          flavor ? el("span", { class: "flavor" }, flavor) : null,
          flavor ? el("span", { class: "strip-sep", "aria-hidden": "true" }, "//") : null,
          el("h1", {}, title),
        ]),
        meta ? el("span", { class: "title-strip-meta" }, meta) : null,
      ]),
    ]),
    body,
    termFooter(ctx.state, [hints(["[ESC] BACK", "[TAB] MOVE"]), ...footerExtra]),
  ]);
}

/** "SAVED: THIS BROWSER", or "NOT SAVING" when this browser is not saving. */
export const saveNote = (state) =>
  state?.persist === false ? "NOT SAVING" : "SAVED: THIS BROWSER";
