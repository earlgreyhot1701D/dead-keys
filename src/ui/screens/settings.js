// The settings screen (shell Req 5.1, 5.2): AI drills, sound set, speed, finger colors. Each
// change is saved at once through app.js. The data half (backup, import, clear) is settingsData.js.
import { SPEED_MAX, SPEED_MIN } from "../../engine/config.js";
import { isValidSetting, SOUND_SETS } from "../../storage/settings.js";
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

/** Change a setting only if the value is allowed; the screen never offers anything else. */
function change(ctx, key, value) {
  if (isValidSetting(key, value)) ctx.app.setSetting(key, value);
  else ctx.refresh(); // put the control back to what is saved
}

function checkbox(ctx, key, label, hint) {
  const id = `st-${key}`;
  return el("p", {}, [
    el("input", {
      type: "checkbox",
      id,
      "data-focus-id": id,
      checked: ctx.state.settings[key],
      "aria-describedby": hint ? `${id}-hint` : null,
      onChange: (e) => change(ctx, key, e.target.checked === true),
    }),
    el("label", { for: id }, ` ${label}`),
    hint ? el("span", { id: `${id}-hint`, class: "hint" }, ` ${hint}`) : null,
  ]);
}

/** @type {import("../router.js").Screen} */
export const settingsScreen = {
  id: "settings",
  title: "Settings",
  render(ctx) {
    const s = ctx.state.settings;
    const shown = el("output", { id: "st-speed-out", for: "st-speed" }, `${s.speed}×`);
    return el("main", { id: "main", class: "settings-main" }, [
      el("h1", {}, "Settings"),
      checkbox(ctx, "ai", "AI drills", AI_HINT),
      el("p", {}, [
        el("label", { for: "st-sound" }, "Sound "),
        el(
          "select",
          {
            id: "st-sound",
            "data-focus-id": "st-sound",
            onChange: (e) => change(ctx, "sound", e.target.value),
          },
          SOUND_SETS.map((v) =>
            el("option", { value: v, selected: v === s.sound }, SOUND_LABELS[v]),
          ),
        ),
      ]),
      el("p", {}, [
        el("label", { for: "st-speed" }, "Speed "),
        el("input", {
          type: "range",
          id: "st-speed",
          "data-focus-id": "st-speed",
          min: SPEED_MIN,
          max: SPEED_MAX,
          step: 0.1,
          value: s.speed,
          onInput: (e) => {
            shown.textContent = `${Number(e.target.value)}×`;
          },
          onChange: (e) => change(ctx, "speed", Number(e.target.value)),
        }),
        ` `,
        shown,
      ]),
      checkbox(ctx, "fingerColors", "Finger colors"),
      renderDataSection(ctx),
      el("div", { class: "actions" }, [
        el("button", { type: "button", class: "btn", onClick: () => ctx.back() }, "Back"),
      ]),
    ]);
  },
};
