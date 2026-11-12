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

const setText = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};

/**
 * @param {Function} el
 * @param {{ onPause: () => void, persist: boolean, speed: number }} o
 * @returns {{ header: HTMLElement, station: HTMLElement, footer: HTMLElement, update: (state: object) => void }}
 */
export function createPlayHud(el, { onPause, persist, speed }) {
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
      box("LIVES:", [v.lives]),
      box("SECTOR:", [v.wave, v.left]),
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
  const footer = el("footer", { class: "term-footer play-footer" }, [
    el("span", { class: "foot-left" }, [
      el("span", { class: "foot-speed" }, `SPEED: ${speedText(speed)}`),
      el("span", { class: "foot-sep", "aria-hidden": "true" }, "|"),
      el("span", { class: "foot-save" }, `SYS.84 // SAVE: ${persist ? "THIS BROWSER" : "OFF"}`),
    ]),
    el("button", { type: "button", class: "play-pause", onClick: onPause }, "[ESC] PAUSE"),
    el("span", { class: "foot-crt" }, `CRT-SCAN ${crtOn() ? "ON" : "OFF"}`),
  ]);
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
  }
  return { header, station, footer, update };
}
