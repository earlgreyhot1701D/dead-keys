// The settings screen (shell Req 5.1, 5.2): AI drills, sound set, speed, finger colors. Each
// change is saved at once through app.js. The data half (backup, import, clear) is settingsData.js.
import { SPEED_MAX, SPEED_MIN } from "../../engine/config.js";
import { isValidSetting, SOUND_SETS } from "../../storage/settings.js";
import { NOT_BUILT, panelHead, termPage } from "../components/chrome.js";
import { el } from "../dom.js";
import { renderDataSection } from "./settingsData.js";

// Approved wording (shell design copy table).
export const AI_HINT =
  "When on, we send which keys you miss and your recent speed so the AI can write practice lines. The words you type are never sent.";
export const SOUND_LABELS = Object.freeze({
  off: "Off",
  typewriter: "Typewriter",
  arcade: "Arcade",
});

/** The speed as the player reads it, and as the slider announces it: "1.2×". */
export const speedText = (v) => `${v}×`;

/**
 * The small "Not built yet" line under a setting that saves now but does nothing until a later
 * block (sound: Block 14, speed and finger colors: Blocks 7 and 8, AI drills: Block 10).
 */
const later = (id) => el("span", { id: `${id}-later`, class: "hint later-hint" }, NOT_BUILT);

/** Change a setting only if the value is allowed; the screen never offers anything else. */
function change(ctx, key, value) {
  if (isValidSetting(key, value)) ctx.app.setSetting(key, value);
  else ctx.refresh(); // put the control back to what is saved
}

function checkbox(ctx, key, label, hint) {
  const id = `st-${key}`;
  return el("p", { class: "set-row" }, [
    el("input", {
      type: "checkbox",
      id,
      "data-focus-id": id,
      checked: ctx.state.settings[key],
      "aria-describedby": hint ? `${id}-hint ${id}-later` : `${id}-later`,
      onChange: (e) => change(ctx, key, e.target.checked === true),
    }),
    el("label", { for: id }, ` ${label}`),
    hint ? el("span", { id: `${id}-hint`, class: "hint" }, ` ${hint}`) : null,
    later(id),
  ]);
}

/** @type {import("../router.js").Screen} */
export const settingsScreen = {
  id: "settings",
  title: "Settings",
  // The controls already show a settings change, so only a change to the data redraws the screen.
  redrawOn: ["progress", "persist", "oldData", "newerSave"],
  render(ctx) {
    const s = ctx.state.settings;
    // The slider speaks its own value ("1.2×"), so the visible readout is hidden from a screen
    // reader rather than being a second live region.
    const shown = el("span", { id: "st-speed-out", "aria-hidden": "true" }, speedText(s.speed));
    const prefs = el("section", { class: "term-panel", "aria-labelledby": "st-prefs" }, [
      panelHead(
        el("h2", { id: "st-prefs" }, "Preferences"),
        el("span", { class: "flavor" }, "CH-84"),
      ),
      checkbox(ctx, "ai", "AI drills", AI_HINT),
      el("p", { class: "set-row" }, [
        el("label", { for: "st-sound" }, "Sound "),
        el(
          "select",
          {
            id: "st-sound",
            "data-focus-id": "st-sound",
            "aria-describedby": "st-sound-later",
            onChange: (e) => change(ctx, "sound", e.target.value),
          },
          SOUND_SETS.map((v) =>
            el("option", { value: v, selected: v === s.sound }, SOUND_LABELS[v]),
          ),
        ),
        later("st-sound"),
      ]),
      el("p", { class: "set-row" }, [
        el("label", { for: "st-speed" }, "Speed "),
        el("input", {
          type: "range",
          id: "st-speed",
          "data-focus-id": "st-speed",
          min: SPEED_MIN,
          max: SPEED_MAX,
          step: 0.1,
          value: s.speed,
          "aria-valuetext": speedText(s.speed),
          "aria-describedby": "st-speed-later",
          onInput: (e) => {
            const text = speedText(Number(e.target.value));
            shown.textContent = text;
            e.target.setAttribute?.("aria-valuetext", text);
          },
          onChange: (e) => change(ctx, "speed", Number(e.target.value)),
        }),
        ` `,
        shown,
        later("st-speed"),
      ]),
      checkbox(ctx, "fingerColors", "Finger colors"),
    ]);
    return termPage(ctx, {
      badgeText: "CONFIG",
      flavor: "PREFERENCES & DATA",
      title: "Settings",
      body: el("main", { id: "main", class: "term-main page-grid" }, [
        prefs,
        renderDataSection(ctx),
      ]),
    });
  },
};
