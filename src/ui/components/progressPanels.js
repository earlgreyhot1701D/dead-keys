// The progress screen's panels, as the locked mock draws them (screen 6): the keyboard panel with
// its words, the diagnosis panel, the personal-best tiles, and the weak-keys panel whose drill and
// lesson buttons are "Not built yet" (Blocks 9 and 8). Rendering only; the numbers come from the
// engine (heatmap, diagnose) and the saved progress.
import { el } from "../dom.js";
import { NOT_BUILT, panelHead, pill } from "./chrome.js";
import { keyCap, renderKeyboard } from "./keyboard.js";
import { keyboardModel, summarizeKeyboard } from "./keyboardLayout.js";
import {
  EMPTY_LINE,
  EVEN_LINE,
  FEW_LINE,
  findingsText,
  modeName,
  NO_BESTS_LINE,
  setOn,
} from "./progressText.js";

const list = (items) =>
  el(
    "ul",
    { class: "plain-list" },
    items.map((t) => el("li", {}, t)),
  );

/** Keyboard, legend, and the same facts in words. */
export function keysPanel(keys, rounds) {
  return el("section", { class: "term-panel keys-panel", "aria-labelledby": "pg-map" }, [
    panelHead(
      el("span", { class: "keys-head" }, [
        el("h2", { id: "pg-map" }, "Your keys"),
        el("span", { class: "chassis" }, "[CHASSIS: MODEL-84]"),
      ]),
      el("span", { class: "bumps" }, "F + J BUMPS MARKED"),
    ),
    rounds === 0 ? el("p", { class: "hint" }, EMPTY_LINE) : null,
    renderKeyboard(el, keys),
    el("div", { class: "words" }, [
      el("h3", {}, "Heat map in words"),
      list(summarizeKeyboard(keyboardModel(keys))),
    ]),
  ]);
}

/** Up to three findings, worst first, with their keys; or the plain line when there are none. */
export function diagnosisPanel(d, goHowWeCount) {
  const findings = d.sentences.map((s) =>
    el("p", { class: "finding" }, [
      el("span", { class: `find-mark sev-${s.severity}`, "aria-hidden": "true" }, "►"),
      el("span", { class: "find-text" }, s.text),
      s.keys.length ? el("span", { class: "find-keys" }, `[ ${s.keys.join(" ")} ]`) : null,
    ]),
  );
  return el("section", { class: "term-panel diag-panel", "aria-labelledby": "pg-diag" }, [
    panelHead(
      el("h2", { id: "pg-diag" }, "What we notice"),
      findings.length ? pill(findingsText(findings.length), "pill-dim") : null,
    ),
    ...(findings.length
      ? findings
      : [el("p", { class: "finding-none" }, d.sufficientData ? EVEN_LINE : FEW_LINE)]),
    el("div", { class: "diag-foot" }, [
      el("button", { type: "button", class: "link-btn", onClick: goHowWeCount }, "How we count"),
    ]),
  ]);
}

/** Personal bests as tiles: mode, speed, date. */
export function bestsBlock(bests) {
  const entries = Object.entries(bests ?? {});
  return el("div", { class: "bests" }, [
    el("h2", { id: "pg-best", class: "bests-title" }, "Personal bests"),
    entries.length
      ? el(
          "ul",
          { class: "best-tiles", "aria-labelledby": "pg-best" },
          entries.map(([mode, b]) =>
            el("li", { class: "best-tile" }, [
              el("span", { class: "best-mode" }, modeName(mode)),
              el("span", { class: "best-wpm" }, `${b.wpm} WPM`),
              el("span", { class: "best-date" }, setOn(b.date)),
            ]),
          ),
        )
      : el("p", { class: "bests-none" }, NO_BESTS_LINE),
  ]);
}

const comingSoon = (label) =>
  el("button", { type: "button", class: "btn btn-term", "aria-disabled": "true" }, [
    label,
    el("span", { class: "btn-note" }, ` ${NOT_BUILT}`),
  ]);

/** The weak keys, drawn as caps, and the drill and lesson buttons that come later. */
export function weakPanel(weakKeys, heat) {
  const byKey = new Map(heat.map((h) => [h.key, h]));
  return el("section", { class: "weak-panel", "aria-labelledby": "pg-weak" }, [
    el("h2", { id: "pg-weak", class: "weak-title" }, "Your top weak keys"),
    weakKeys.length
      ? el("p", { class: "weak-line" }, `Keys to practice: ${weakKeys.join(", ")}`)
      : null,
    weakKeys.length
      ? el(
          "div",
          { class: "weak-caps", "aria-hidden": "true" },
          weakKeys.map((k) =>
            keyCap(el, byKey.get(k) ?? { key: k, band: "noData", glyph: "·", label: "" }),
          ),
        )
      : null,
    el("div", { class: "weak-actions" }, [comingSoon("Drill these keys"), comingSoon("Lessons")]),
  ]);
}
