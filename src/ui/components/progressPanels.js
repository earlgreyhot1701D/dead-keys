// The progress screen's panels, as the locked mock draws them (screen 6): the keyboard panel with
// its words, the diagnosis panel, the personal-best tiles, and the weak-keys panel: Drill these keys
// starts a drill (Block 9), Lessons opens the Lessons menu. Rendering only; the numbers come from the
// engine (heatmap, diagnose) and the saved progress.
import { el } from "../dom.js";
import { NOT_BUILT, panelHead, pill } from "./chrome.js";
import { DRILL_BUTTON, drillButton } from "./drillButton.js";
import { keyCap, renderKeyboard } from "./keyboard.js";
import { keyboardModel, summarizeKeyboard } from "./keyboardLayout.js";
import {
  EMPTY_LINE,
  EVEN_LINE,
  FEW_LINE,
  findingsText,
  keyList,
  modeName,
  NO_BESTS_LINE,
  NO_GROUP_LINE,
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

/**
 * The line shown when no group is flagged. "Your keys look even" only when no single key is in
 * Focus here or Practicing either; otherwise it points to Keys to practice.
 * @param {{ sufficientData: boolean }} d
 * @param {{ band: string }[]} heat
 */
export function quietLine(d, heat) {
  if (!d.sufficientData) return FEW_LINE;
  return heat.some((h) => h.band === "missed" || h.band === "shaky") ? NO_GROUP_LINE : EVEN_LINE;
}

/** Up to three findings, worst first, with their keys; or the plain line when there are none. */
export function diagnosisPanel(d, goHowWeCount, heat = []) {
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
    ...(findings.length ? findings : [el("p", { class: "finding-none" }, quietLine(d, heat))]),
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
              el("span", { class: "best-wpm" }, `${Math.round(b.wpm)} WPM`),
              el("span", { class: "best-date" }, setOn(b.date)),
            ]),
          ),
        )
      : el("p", { class: "bests-none" }, NO_BESTS_LINE),
  ]);
}

/**
 * A future button: its label alone, styled disabled, with "Not built yet" as a line under it.
 * It stays focusable; pressing it only says "<label>: not built yet" through the live region.
 */
const comingSoon = (label, id, announce) =>
  el("div", { class: "later" }, [
    el(
      "button",
      {
        type: "button",
        class: "btn btn-term",
        "aria-disabled": "true",
        "aria-describedby": id,
        onClick: announce ? () => announce(`${label}: not built yet`) : null,
      },
      label,
    ),
    el("span", { id, class: "later-note" }, NOT_BUILT),
  ]);

/** The weak keys, drawn as caps, Drill these keys, and Lessons. */
export function weakPanel(weakKeys, heat, announce = null, toLessons = null, toDrill = null) {
  const byKey = new Map(heat.map((h) => [h.key, h]));
  return el("section", { class: "weak-panel", "aria-labelledby": "pg-weak" }, [
    el("h2", { id: "pg-weak", class: "weak-title" }, "Your top weak keys"),
    weakKeys.length
      ? el("p", { class: "weak-line" }, `Keys to practice: ${keyList(weakKeys)}`)
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
    el("div", { class: "weak-actions" }, [
      toDrill // drills are built (Block 9); a caller without the route keeps the old line
        ? drillButton(el, weakKeys.length > 0, toDrill)
        : comingSoon(DRILL_BUTTON, "later-drill", announce),
      toLessons // Lessons are built (Block 8a); a caller without the route keeps the old line
        ? el("button", { type: "button", class: "btn btn-term", onClick: toLessons }, "Lessons")
        : comingSoon("Lessons", "later-lessons", announce),
    ]),
  ]);
}
