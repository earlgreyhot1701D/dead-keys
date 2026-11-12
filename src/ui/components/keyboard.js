// The on-screen keyboard heat map (shell Req 6.1), drawn as the locked mock's keycaps: each cap
// has its band's fill, border and pattern, the band glyph in its corner, the shifted character on
// the top row, F and J bumps, and the inert modifier keys. Color is never alone: glyph, pattern
// and border style differ per band, and the legend says each band in words. The picture is
// hidden from a screen reader because the text summary says the same thing.
import { BANDS } from "../../engine/progressConfig.js";
import { BUMPS, bandRanges, keyboardModel, SHIFT_LABELS } from "./keyboardLayout.js";

/** The scroll frame's name for a screen reader. */
export const KB_REGION = "Keyboard heat map picture. The same facts are in words below.";

/** Inert keys around each row, as in the mock: [before, after], with their width class. */
const EDGES = [
  [[], [["BKSP", "w80"]]],
  [[["TAB", "w66"]], [["\\", "w66"]]],
  [[["LOCK", "w80"]], [["RETURN", "w104"]]],
  [[["SHIFT", "w104"]], [["SHIFT", "w132"]]],
  [
    [
      ["CTRL", "w66"],
      ["ALT", "w66"],
    ],
    [
      ["ALT", "w66"],
      ["CTRL", "w66"],
    ],
  ],
];

const inert = (el, [label, w]) => el("span", { class: `kb-key kb-inert ${w}` }, label);

/**
 * One keycap.
 * @param {Function} el
 * @param {{ key: string, band: string, glyph: string, label: string }} c
 */
export function keyCap(el, c) {
  if (c.key === " ") {
    return el("span", { class: `kb-key kb-space band-${c.band}` }, [
      el("span", { class: "kb-space-tag" }, "[SPACE_BAR]"),
      el("span", { class: "kb-glyph" }, `${c.glyph} ${c.label}`),
    ]);
  }
  const bump = BUMPS.includes(c.key) ? " kb-bump" : "";
  return el("span", { class: `kb-key kb-cap band-${c.band}${bump}` }, [
    el("span", { class: "kb-top" }, [
      el(
        "span",
        { class: "kb-shift" },
        Object.hasOwn(SHIFT_LABELS, c.key) ? SHIFT_LABELS[c.key] : "",
      ),
      el("span", { class: "kb-glyph" }, c.glyph),
    ]),
    el("span", { class: "kb-char" }, c.key),
  ]);
}

/** The legend: each band's swatch, its name and glyph, and its range in words. */
export function renderLegend(el) {
  const ranges = bandRanges();
  return el(
    "ul",
    { class: "kb-legend", "aria-label": "Key legend" },
    BANDS.map((b) =>
      el("li", { class: "kb-leg" }, [
        el("span", { class: "kb-leg-top" }, [
          el("span", { class: `kb-swatch band-${b.name}`, "aria-hidden": "true" }, b.glyph),
          el("span", { class: `kb-leg-name leg-${b.name}` }, `${b.label} [${b.glyph}]`),
        ]),
        el("span", { class: "kb-leg-desc" }, ranges[b.name]),
      ]),
    ),
  );
}

/**
 * @param {Function} el The `el` function.
 * @param {{ key: string, attempts: number, misses: number }[]} keys Saved stats.
 * @returns {HTMLElement} The keyboard tray and its legend.
 */
export function renderKeyboard(el, keys) {
  const rows = keyboardModel(keys).map((row, i) =>
    el("div", { class: "kb-row" }, [
      ...EDGES[i][0].map((k) => inert(el, k)),
      ...row.map((c) => keyCap(el, c)),
      ...EDGES[i][1].map((k) => inert(el, k)),
    ]),
  );
  return el("div", { class: "kb" }, [
    // On a narrow window the tray scrolls sideways, so its frame takes keyboard focus.
    el(
      "div",
      { class: "kb-scroll", tabindex: "0", role: "region", "aria-label": KB_REGION },
      el("div", { class: "kb-grid", "aria-hidden": "true" }, rows),
    ),
    renderLegend(el),
  ]);
}
