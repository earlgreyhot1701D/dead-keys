// The play screen (play Req 2 to 5): engine + loop + renderer + keys + dialogs. Keys go to the
// engine one character at a time, only while no dialog is open. Escape follows the engine's
// layered rule (drop the lock, else pause). The loop stops when the round ends or the screen is
// gone. STUB: corners is task 7, moments task 8, practice task 9, results and saving task 10;
// until then an ended round returns to the Play picker.
import pack from "../../../packs/general.json" with { type: "json" };
import { announceAll } from "../../a11y/announce.js";
import { LIVES_MAX } from "../../engine/config.js";
import { endRound, pause, resolveOutOfLives, resume, tick } from "../../engine/lifecycle.js";
import { createRound, key, pressEscape } from "../../engine/round.js";
import { createFalling } from "../../render/falling.js";
import { liveWpm } from "../../render/hud.js";
import { startLoop } from "../../render/loop.js";
import { createPlayHud } from "../../render/playHud.js";
import { scanlines } from "../components/chrome.js";
import { openConfirm } from "../components/confirmDialog.js";
import { el } from "../dom.js";
import { nextRound } from "./play.js";

/** The pause dialog's words (play copy table). */
export const PAUSE = Object.freeze({ title: "Paused", resume: "Resume", end: "End round" });

/** The out-of-lives dialog's lines (play copy table), with the round's real numbers. */
export const outOfLivesLines = (s) => [
  "That's the arcade part. Nothing is lost.",
  `So far: ${liveWpm(s)} WPM, ${s.cleared} words cleared, wave ${s.wave}.`,
  `Continue: your ${LIVES_MAX} lives come back and you keep going from wave ${s.wave}, with this score. You get one continue per round.`,
  "End round: see your results. Either way, this round is saved.",
];

/** Is this key press one character for the engine (not Shift, Tab, Backspace or a shortcut)? */
export const isTyping = (e) =>
  typeof e?.key === "string" && [...e.key].length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;

let live = null; // the running round: { state, step, ... }; only one at a time

function begin(ctx) {
  const kind = nextRound();
  const r = createRound({
    mode: kind.mode,
    mechanic: kind.mechanic,
    items: pack.pools.words,
    seed: Date.now(),
    speed: ctx.state.settings.speed,
  });
  const field = createFalling(el);
  const doc = ctx.root?.ownerDocument ?? globalThis.document;
  const run = { state: r.state, loop: null };
  const draw = () => {
    field.update(run.state);
    hud.update(run.state);
  };
  const stop = () => {
    run.loop?.stop();
    if (live === run) live = null;
  };
  const finish = () => {
    stop();
    ctx.go("play"); // STUB until task 10: results and saving
  };
  const step = ({ state, events }) => {
    const before = run.state;
    run.state = state;
    const lines = announceAll(events, before, state);
    if (lines.length) ctx.announce(lines.join(" "));
    draw();
    for (const e of events) {
      if (e.type === "paused") openPause();
      if (e.type === "outOfLives") openOut();
      if (e.type === "ended") finish();
    }
  };
  const openPause = () =>
    openConfirm(doc, el, {
      id: "pause",
      title: PAUSE.title,
      lines: [],
      cancelLabel: PAUSE.resume,
      confirmLabel: PAUSE.end,
      onCancel: () => step(resume(run.state)),
      onConfirm: () => step(endRound(run.state)),
    });
  const openOut = () =>
    openConfirm(doc, el, {
      id: "out",
      title: "Out of lives",
      lines: outOfLivesLines(run.state),
      cancelLabel: "Continue",
      confirmLabel: PAUSE.end,
      onCancel: () => step(resolveOutOfLives(run.state, true)),
      onConfirm: () => step(resolveOutOfLives(run.state, false)),
    });
  const hud = createPlayHud(el, {
    onPause: () => step(pause(run.state)),
    persist: ctx.state.persist !== false,
    speed: ctx.state.settings.speed,
  });
  run.step = step;
  run.dialogOpen = () => !!doc.querySelector?.("dialog[open]");
  run.node = el("div", { class: "screen-frame play-frame" }, [
    scanlines(),
    el("h1", { class: "sr-only" }, kind.title),
    hud.header,
    el("main", { id: "main", class: "play-main" }, [field.node, hud.station]),
    hud.footer,
  ]);
  draw();
  run.loop = startLoop({
    onFrame: (dt) => {
      // The screen was left another way: stop, and go nowhere (no frame outlives its screen).
      if (run.node.isConnected === false) return stop();
      step(tick(run.state, dt));
    },
    onHide: () => step(pause(run.state)),
  });
  live = run;
  return run;
}

/** @type {import("../router.js").Screen} */
export const roundScreen = {
  id: "round",
  title: "Round",
  redrawOn: [], // the round draws itself every frame; a redraw would restart it
  render(ctx) {
    live?.loop?.stop();
    return begin(ctx).node;
  },
  onKey(_ctx, e) {
    if (!live || live.dialogOpen()) return false;
    if (e.key === "Escape") {
      live.step(pressEscape(live.state));
      return true;
    }
    if (!isTyping(e)) return false;
    live.step(key(live.state, e.key));
    return true;
  },
};
