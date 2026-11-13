// The play screen (play Req 2 to 7): engine + loop + renderer + keys + dialogs + moments. Keys go
// to the engine one at a time, only while no dialog is open. The loop stops when the round ends
// or the screen is gone; an ended round is recorded (app.finishRound) and shown on results.
import pack from "../../../packs/general.json" with { type: "json" };
import { announceAll } from "../../a11y/announce.js";
import { clockFor } from "../../drills/daily.js";
import { LIVES_MAX } from "../../engine/config.js";
import {
  backspace,
  endRound,
  pause,
  resolveOutOfLives,
  resume,
  tick,
} from "../../engine/lifecycle.js";
import { toResult } from "../../engine/result.js";
import { createRound, key, pressEscape } from "../../engine/round.js";
import { findGhost, prepareGhost } from "../../ghost/ghost.js";
import { liveWpm } from "../../render/hud.js";
import { startLoop } from "../../render/loop.js";
import { createStage } from "../../render/stage.js";
import { openConfirm } from "../components/confirmDialog.js";
import { el } from "../dom.js";
import { localDay } from "../roundRecord.js";
import { kindSource, roundOptions } from "./drillRound.js";
import { nextRound } from "./play.js";
import { showResults } from "./results.js";

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
const tagOf = (n) => (n.tagName ?? n.tag)?.toLowerCase(); // a real element, or the test fake

function begin(ctx) {
  const kind = nextRound();
  const r = createRound(roundOptions(kind, ctx)); // a drill's weights and live line: drillRound.js
  const doc = ctx.root?.ownerDocument ?? globalThis.document;
  const run = { state: r.state, loop: null };
  const clock = clockFor(kind, ctx.announce, (s) => step(endRound(s)));
  const stage = createStage(el, {
    mechanic: kind.mechanic,
    practice: kind.mode === "practice",
    title: kind.title,
    persist: ctx.state.persist !== false,
    speed: r.state.speed,
    drill: kindSource(kind), // the HUD badge: built-in or AI (drills Req 4.1, ai-drills Req 4.1)
    limitMs: kind.limitMs, // the daily drill's clock counts down (daily Req 2)
    ghost: kind.items ? null : prepareGhost(findGhost(ctx.state.progress, kind.mode, pack.id)),
    say: ctx.announce, // "You passed your ghost." (ghost Req 2)
    onPause: () => step(pause(run.state)),
  });
  const stop = () => {
    run.loop?.stop();
    stage.stop();
    if (live === run) live = null;
  };
  const finish = () => {
    stop();
    const now = Date.now();
    const meta = { id: `round-${now}`, date: now, packId: pack.id, lessonId: null };
    const result = toResult(run.state, { ...meta, drillSource: kindSource(kind) });
    const keys = kind.items ? null : run.state.keystrokes; // a ghost is only from the pack's words
    const outcome = ctx.app.finishRound(result, localDay(now), null, keys);
    showResults({ result, log: stage.log(), outcome });
    ctx.replace("results");
  };
  const step = ({ state, events }) => {
    const before = run.state;
    run.state = state;
    const lines = announceAll(events, before, state);
    if (lines.length) ctx.announce(lines.join(" "));
    stage.show(events, before, state);
    for (const e of events) {
      if (e.type === "paused") openPause();
      if (e.type === "outOfLives") openOut();
      if (e.type === "ended") finish();
    }
  };
  // Cancel (focused first, and Escape) is the safe choice: Resume, or Continue.
  const ask = (id, title, lines, cancelLabel, cancel, confirm) =>
    openConfirm(doc, el, {
      ...{ id, title, lines, cancelLabel, confirmLabel: PAUSE.end },
      onCancel: () => step(cancel(run.state)),
      onConfirm: () => step(confirm(run.state)),
    });
  const openPause = () => ask("pause", PAUSE.title, [], PAUSE.resume, resume, endRound);
  const goOn = (yes) => (s) => resolveOutOfLives(s, yes);
  const openOut = () =>
    ask("out", "Out of lives", outOfLivesLines(run.state), "Continue", goOn(true), goOn(false));
  run.step = step;
  run.setCaps = (on) => {
    stage.setCaps(on);
    stage.show([], run.state, run.state); // show or hide the hint now, even while paused
  };
  run.dialogOpen = () => !!doc.querySelector?.("dialog[open]");
  run.node = stage.node;
  const [h1, main] = ["h1", "main"].map((t) => [...run.node.children].find((n) => tagOf(n) === t));
  (main.prepend ?? main.append).call(main, h1); // the hidden h1 goes inside <main> (Req 10.1)
  stage.show([], run.state, run.state);
  run.loop = startLoop({
    onFrame: (dt) => {
      // The screen was left another way: stop, and go nowhere (no frame outlives its screen).
      if (run.node.isConnected === false) return stop();
      step(tick(run.state, dt));
      clock(run.state); // the daily drill's 2 minutes; nothing for other rounds
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
    // Caps Lock makes every lowercase word miss, so the footer says so (Shara, Nov 12).
    if (typeof e.getModifierState === "function") live.setCaps(e.getModifierState("CapsLock"));
    // Escape: let go, else pause. Backspace clears a wrong key shown on the word, never the word.
    const special = { Escape: pressEscape, Backspace: backspace }[e.key];
    if (special) live.step(special(live.state));
    else if (isTyping(e)) live.step(key(live.state, e.key));
    else return false;
    return true;
  },
};
