// Four corners' bars (mock screen 4): the HUD header, the ACTIVE_BUFFER line and the shared
// footer. Every value comes from hud.js; per frame only textContent changes.
// Dropped per the map: the drill label, MATCH RATE, SOUND (as on falling).
import {
  accuracyText,
  heartsText,
  hostilesText,
  leftText,
  livesLabel,
  liveWpm,
  locked,
  lockParts,
  timeText,
  waveText,
} from "./hud.js";
import { playFooter } from "./playHud.js";

const setText = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};

/**
 * @param {Function} el
 * @param {{ onPause: () => void, persist: boolean, speed: number }} o
 * @returns {{ header: HTMLElement, station: HTMLElement, footer: HTMLElement, update: (state: object) => void, setCaps: (on: boolean) => void }}
 */
export function createCornersHud(el, o) {
  const span = (cls) => el("span", { class: cls });
  const v = {
    wave: span("cn-hud-wave"),
    left: span("hud-dim cn-hud-left"),
    lives: el("span", { class: "cn-hud-lives", role: "img" }),
    wpm: span("cn-hud-val"),
    acc: span("cn-hud-val"),
    hostiles: span("cn-hud-hostiles"),
    time: span("cn-hud-time"),
    typed: span("cn-buffer-typed"),
    wrong: span("cn-buffer-wrong"),
  };
  const stat = (label, nodes) =>
    el("div", { class: "cn-hud-stat" }, [el("span", { class: "cn-hud-label" }, label), ...nodes]);
  const rule = () => el("div", { class: "cn-hud-rule", "aria-hidden": "true" });
  const header = el("header", { class: "play-hud cn-hud" }, [
    el("div", { class: "hud-group" }, [el("span", { class: "hud-term" }, "TERMINAL 84")]),
    el("div", { class: "cn-hud-mid" }, [
      stat("WAVE_REGISTER", [el("span", { class: "cn-hud-val" }, [v.wave, " ", v.left])]),
      rule(),
      stat("LIVES", [v.lives]),
      rule(),
      stat("SPEED", [el("span", { class: "cn-hud-val" }, [v.wpm, " WPM"])]),
      rule(),
      stat("ACCURACY", [v.acc]),
    ]),
    el("div", { class: "cn-hud-right" }, [v.hostiles, v.time]),
  ]);
  const station = el("section", { class: "cn-buffer", "aria-label": "Your station" }, [
    el("span", { class: "cn-buffer-label" }, "ACTIVE_BUFFER >"),
    v.typed,
    v.wrong,
    el("span", { class: "cn-buffer-cursor", "aria-hidden": "true" }),
  ]);
  function update(state) {
    setText(v.wave, waveText(state));
    setText(v.left, leftText(state));
    setText(v.lives, heartsText(state.lives));
    v.lives.setAttribute("aria-label", livesLabel(state.lives));
    setText(v.wpm, String(liveWpm(state)));
    setText(v.acc, accuracyText(state));
    setText(v.hostiles, hostilesText(state));
    setText(v.time, `TIME: ${timeText(state.activeMs)}`);
    const t = locked(state);
    setText(v.typed, t ? lockParts(t).typed : "");
    setText(v.wrong, t ? lockParts(t).wrong : "");
    foot.update(state);
  }
  const foot = playFooter(el, o);
  return { header, station, footer: foot.node, update, setCaps: foot.setCaps };
}
