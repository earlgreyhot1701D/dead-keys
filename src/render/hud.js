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

/** "♥ ♥ ♡ ♡ ♡": one heart per life, filled for lives left (corners draws it bare). */
export function heartsText(lives) {
  const n = Math.max(0, Math.min(LIVES_MAX, lives));
  return [...Array(LIVES_MAX)].map((_, i) => (i < n ? "♥" : "♡")).join(" ");
}
/** "[ ♥ ♥ ♡ ♡ ♡ ]", as falling draws it. */
export const livesText = (lives) => `[ ${heartsText(lives)} ]`;
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
/** "95%", or "--" before the first key (Shara, Nov 12: no 0% for keys not yet pressed). */
export function accuracyText(state) {
  return counts(state).total === 0 ? "--" : `${liveAccuracy(state)}%`;
}
/** "█████████░": ten cells, one per 10%. */
export function accuracyBar(percent) {
  const filled = Math.max(0, Math.min(10, Math.floor(percent / 10))); // the mock: 95% is 9 cells
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

/** Words kept for the results word log (Req 7.2: the last 8). */
export const LOG_WORDS = 8;
/**
 * Add one step's cleared and breached words to the round's log: the last LOG_WORDS words, newest
 * last, and the count of every breach (the engine does not keep either).
 * @param {{ words: { text: string, cleared: boolean }[], breaches: number }} log
 * @param {object[]} events
 * @param {object} before The state the events came from (it still holds the words).
 */
export function logWords(log, events, before) {
  const text = (id) => before.targets.find((t) => t.id === id)?.text;
  const add = [];
  for (const e of events) {
    if (e.type !== "cleared" && e.type !== "lifeLost") continue;
    const w = text(e.targetId);
    if (w) add.push({ text: w, cleared: e.type === "cleared" });
  }
  if (!add.length) return log;
  return {
    words: [...log.words, ...add].slice(-LOG_WORDS),
    breaches: log.breaches + add.filter((w) => !w.cleared).length,
  };
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
/**
 * How near a word is, 0 at the start to 1 at the danger zone or ring, in steps of 0.05: far
 * words are dimmer, as the mocks draw them (Shara, Nov 12). The CSS mixes --accent into --text.
 */
export const nearness = (progress) => Math.round(Math.min(1, progress / DANGER_FROM) * 20) / 20;
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
