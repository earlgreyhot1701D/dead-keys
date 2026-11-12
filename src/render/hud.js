// Every value the play screens show about a round, as pure functions of engine state (play
// Req 3.2, 3.3; the mock-to-build map). Only true values: nothing here makes a number up. The
// renderers put these strings on the page with textContent.
import { LIVES_MAX, WAVE_SIZE } from "../engine/config.js";
import { accuracy, wpm } from "../engine/score.js";

/** A word is in the danger zone (falling) or ring (corners) from this far along (design 2). */
export const DANGER_FROM = 0.8;
/** The corners, in slot order (the mock's quadrants). */
export const CORNERS = Object.freeze(["NW", "NE", "SW", "SE"]);
export const QUADRANTS = Object.freeze(["ALPHA", "BETA", "GAMMA", "DELTA"]);

const two = (n) => String(Math.max(0, Math.round(n))).padStart(2, "0");

/** The round's counts so far, the same way `toResult` counts them. */
export function counts(state) {
  const correct = state.keystrokes.filter((k) => k.ok).length;
  return { correct, total: state.keystrokes.length + state.strayKeys };
}

/** "[ ♥ ♥ ♡ ♡ ♡ ]": one heart per life, filled for lives left. */
export function livesText(lives) {
  const n = Math.max(0, Math.min(LIVES_MAX, lives));
  const hearts = [...Array(LIVES_MAX)].map((_, i) => (i < n ? "♥" : "♡"));
  return `[ ${hearts.join(" ")} ]`;
}
/** The same, in words for a screen reader (the mock's label). */
export const livesLabel = (lives) => `${lives} of ${LIVES_MAX} lives left`;

/** "WAVE 04". */
export const waveText = (state) => `WAVE ${two(state.wave)}`;
/** "· 12 LEFT": words still to clear in this wave. */
export const leftText = (state) => `· ${WAVE_SIZE - state.clearedThisWave} LEFT`;

/** Live words per minute, whole. */
export function liveWpm(state) {
  return Math.round(wpm(counts(state).correct, state.activeMs));
}
/** Live accuracy as a whole percent (0 before the first key, the same math as results). */
export function liveAccuracy(state) {
  const { correct, total } = counts(state);
  return Math.round(accuracy(correct, total) * 100);
}
/** "█████████░": ten cells, one per 10%. */
export function accuracyBar(percent) {
  const filled = Math.max(0, Math.min(10, Math.floor(percent / 10))); // the mock: 95% is 9 cells
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

/** "1:12" from active milliseconds (pauses are not in activeMs). */
export function timeText(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** "0.8×". */
export const speedText = (speed) => `${speed}×`;

/** The locked word, or null. */
export const locked = (state) => state.targets.find((t) => t.id === state.lockId) ?? null;

/** Its typed part and remaining part. */
export function lockParts(target) {
  return { typed: target.text.slice(0, target.typed), rest: target.text.slice(target.typed) };
}

/** "LOCK: COLUMN_3" for the locked word's lane, or null when nothing is locked. */
export function lockColumn(state) {
  const t = locked(state);
  return t ? `LOCK: COLUMN_${t.slot + 1}` : null;
}

/** Is this word in the danger zone or ring? */
export const inDanger = (target) => target.progress >= DANGER_FROM;
/** "[!]" in danger, "[·]" otherwise. */
export const dangerMark = (target) => (inDanger(target) ? "[!]" : "[·]");

/** Corners: "05", the distance left in tenths of the way, two digits. */
export const dist = (target) => two((1 - target.progress) * 10);
/** "HOSTILES ACTIVE: 06": words on screen. */
export const hostilesText = (state) => `HOSTILES ACTIVE: ${two(state.targets.length)}`;
/** "QUADRANT // GAMMA [SW]", with "[LOCKED]" on the locked word's quadrant. */
export function quadrantText(slot, state) {
  const lock = locked(state);
  const mark = lock && lock.slot === slot ? " [LOCKED]" : "";
  return `QUADRANT // ${QUADRANTS[slot]} [${CORNERS[slot]}]${mark}`;
}
/** "VECTOR SW // CHAR BUFFER: 4/7" for the locked word, or null. */
export function vectorText(state) {
  const t = locked(state);
  return t ? `VECTOR ${CORNERS[t.slot]} // CHAR BUFFER: ${t.typed}/${t.text.length}` : null;
}
