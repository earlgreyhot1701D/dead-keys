// The on-screen keyboard heat map (shell Req 6.1). Each cap shows its letter and the band glyph;
// the band class adds a pattern in CSS, and a legend spells out every glyph in words. The grid
// is hidden from a screen reader because the text summary beside it says the same thing.
import { BANDS } from "../../engine/progressConfig.js";
import { keyboardModel } from "./keyboardLayout.js";

/**
 * @param {typeof import("../dom.js").el} el
 * @param {{ key: string, attempts: number, misses: number }[]} keys Saved stats.
 * @returns {HTMLElement} The grid and its legend.
 */
export function renderKeyboard(el, keys) {
  const rows = keyboardModel(keys).map((row) =>
    el(
      "div",
      { class: "kb-row" },
      row.map((c) =>
        el(
          "span",
          {
            class: `kb-key band-${c.band}${c.key === " " ? " kb-space" : ""}`,
            title: `${c.key === " " ? "space" : c.key}: ${c.label}`,
          },
          [
            el("span", { class: "kb-char" }, c.key === " " ? "space" : c.key),
            el("span", { class: "kb-glyph" }, c.glyph),
          ],
        ),
      ),
    ),
  );
  const legend = BANDS.map((b) =>
    el("li", {}, [
      el("span", { class: `kb-key kb-swatch band-${b.name}` }, el("span", {}, b.glyph)),
      ` ${b.label}`,
    ]),
  );
  return el("div", { class: "kb" }, [
    el("div", { class: "kb-grid", "aria-hidden": "true" }, rows),
    el("ul", { class: "kb-legend", "aria-label": "Key legend" }, legend),
  ]);
}
