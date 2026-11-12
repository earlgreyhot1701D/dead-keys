// The play screen's bars (mock screen 3): the HUD header, the station line with the input stream
// and target, and the footer. Every value comes from hud.js; per frame only textContent changes.
// Dropped per the map: the drill label, word codes, BASELINE, SHIELD, CAPACITOR, SOUND.
import { crtOn } from "../ui/components/chrome.js";
import {
  accuracyBar,
  accuracyText,
  leftText,
  liveAccuracy,
  livesLabel,
  livesText,
  liveWpm,
  lockColumn,
  locked,
  lockParts,
  speedText,
  timeText,
  waveText,
} from "./hud.js";

/** The practice HUD note (play copy table). */
export const PRACTICE_NOTE = "No lives, no clock pressure. End the round from the pause menu.";

const setText = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};

/**
 * The footer both play screens share (mocks 3 and 4): starting speed, save, the pause button,
 * the hint, CRT-SCAN. `update` sets the hint each frame: Caps Lock first (every key would
 * miss), then how to let go of a locked word, else nothing. `setCaps` is told by each key press.
 * @param {Function} el
 * @param {{ onPause: () => void, persist: boolean, speed: number }} o
 * @returns {{ node: HTMLElement, update: (state: object) => void, setCaps: (on: boolean) => void }}
 */
export function playFooter(el, { onPause, persist, speed }) {
  const hint = el("span", { class: "foot-hint" }, "");
  const node = el("footer", { class: "term-footer play-footer" }, [
    el("span", { class: "foot-left" }, [
      el("span", { class: "foot-speed" }, `START SPEED: ${speedText(speed)}`),
      el("span", { class: "foot-sep", "aria-hidden": "true" }, "|"),
      el("span", { class: "foot-save" }, `SYS.84 // SAVE: ${persist ? "THIS BROWSER" : "OFF"}`),
    ]),
    el("button", { type: "button", class: "play-pause", onClick: onPause }, "[ESC] PAUSE"),
    hint,
    el("span", { class: "foot-crt" }, `CRT-SCAN ${crtOn() ? "ON" : "OFF"}`),
  ]);
  let caps = false;
  return {
    node,
    update: (state) => setText(hint, caps ? CAPS_HINT : lockHint(state)),
    setCaps: (on) => {
      caps = on === true;
    },
  };
}

/** The footer hint lines (play copy table, Shara, Nov 12). */
export const LET_GO_HINT = "LOCKED: [ESC] LETS GO";
export const WRONG_HINT = "TYPE THE AMBER LETTER. [ESC] LETS GO";
export const COACH = Object.freeze({
  pick: "TYPE A WORD'S FIRST LETTER TO LOCK IT",
  finish: "FINISH IT BEFORE IT LANDS. [ESC] LETS GO",
});
/** Shown while Caps Lock is on: the words are lowercase, so every key would miss. */
export const CAPS_HINT = "CAPS LOCK IS ON";

/**
 * What the footer says: during the warm-up and in Practice it coaches every step; later only how
 * to let go, and which letter a word waits on after a wrong key.
 */
export function lockHint(state) {
  const t = state.targets.find((x) => x.id === state.lockId);
  const coach = state.warmup > 0 || state.mode === "practice";
  if (t?.wrong) return WRONG_HINT;
  if (t) return coach ? COACH.finish : LET_GO_HINT;
  return coach ? COACH.pick : "";
}

/**
 * @param {Function} el
 * @param {{ onPause: () => void, persist: boolean, speed: number, practice?: boolean }} o
 *   Practice has no lives and no waves, so the note takes their place (play copy table).
 * @returns {{ header: HTMLElement, station: HTMLElement, footer: HTMLElement, update: (state: object) => void, setCaps: (on: boolean) => void }}
 */
export function createPlayHud(el, { onPause, persist, speed, practice = false }) {
  const span = (cls) => el("span", { class: cls });
  const box = (label, nodes) =>
    el("div", { class: "hud-box" }, [el("span", { class: "hud-label" }, label), ...nodes]);
  const v = {
    lives: el("span", { class: "hud-lives", role: "img" }),
    wave: span("hud-strong"),
    left: span("hud-dim"),
    wpm: span("hud-big"),
    acc: span("hud-big"),
    bar: el("span", { class: "hud-bar", "aria-hidden": "true" }),
    time: span("hud-strong"),
    station: span("station-tag"),
    typed: span("stream-typed"),
    target: span("stream-target"),
  };
  const header = el("header", { class: "play-hud" }, [
    el("div", { class: "hud-group" }, [
      el("span", { class: "hud-term" }, "TERMINAL 84"),
      ...(practice
        ? [el("p", { class: "hud-box hud-note" }, PRACTICE_NOTE)]
        : [box("LIVES:", [v.lives]), box("SECTOR:", [v.wave, v.left])]),
    ]),
    el("div", { class: "hud-group" }, [
      box("SPEED:", [v.wpm, el("span", { class: "hud-unit" }, "WPM")]),
      box("ACCURACY:", [v.acc, v.bar]),
      box("TIME:", [v.time]),
    ]),
  ]);
  const station = el("section", { class: "play-station", "aria-label": "Your station" }, [
    el("div", { class: "station-rule" }, [v.station]),
    el("div", { class: "stream-bar" }, [
      el("div", { class: "stream-left" }, [
        el("span", { class: "stream-label" }, "INPUT_STREAM:"),
        el("span", { class: "stream-text" }, [
          v.typed,
          el("span", { class: "stream-cursor", "aria-hidden": "true" }, "█"),
        ]),
      ]),
      el("div", { class: "stream-right" }, [
        el("span", { class: "stream-label" }, "TARGET:"),
        v.target,
      ]),
    ]),
  ]);
  const foot = playFooter(el, { onPause, persist, speed });
  function update(state) {
    setText(v.lives, livesText(state.lives));
    v.lives.setAttribute("aria-label", livesLabel(state.lives));
    setText(v.wave, waveText(state));
    setText(v.left, leftText(state));
    setText(v.wpm, String(liveWpm(state)));
    setText(v.acc, accuracyText(state));
    setText(v.bar, accuracyBar(liveAccuracy(state)));
    setText(v.time, timeText(state.activeMs));
    const col = lockColumn(state);
    setText(v.station, col ? `STATION_ID: TER-84 // ${col}` : "STATION_ID: TER-84");
    const t = locked(state);
    setText(v.typed, t ? lockParts(t).typed : "");
    setText(v.target, t ? t.text : "");
    foot.update(state);
  }
  return { header, station, footer: foot.node, update, setCaps: foot.setCaps };
}
