// Job: the title screen's attract mode (attract Reqs 1 and 3). The still frame shows first; after
// IDLE_MS with no input the real game plays itself (Falling words, outer lanes only) until
// any key, click or scroll puts the still frame back. A Pause demo button stops it (WCAG 2.2.2).
// It is silent and hidden from screen readers. Under reduced motion it never starts.
import pack from "../../packs/general.json" with { type: "json" };
import { createCorners } from "../render/corners.js";
import { createFalling } from "../render/falling.js";
import { startLoop } from "../render/loop.js";
import { createMoments, playMoments } from "../render/moments.js";
import { titleScene } from "../ui/components/titleScene.js";
import { DEMO_MECHANICS, demoRound, demoStep, IDLE_MS } from "./bot.js";

/** The demo's words (attract copy table). */
export const DEMO_COPY = Object.freeze({
  playing: "Demo playing",
  paused: "Demo paused",
  pause: "Pause demo",
  resume: "Resume demo",
  tag: "STATION_ID: TER-84 // DEMO",
});

const reducedMotion = (win) => !!win?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/**
 * @param {Function} el
 * @param {{ win?: Window, doc?: Document, idleMs?: number }} [o]
 * @returns {{ scene: HTMLElement, controls: HTMLElement, input: (e?: Event) => void,
 *   running: () => boolean }}
 */
export function createDemo(
  el,
  { win = globalThis.window, doc = globalThis.document, idleMs = IDLE_MS } = {},
) {
  const scene = el("div", { class: "title-scene-wrap", "aria-hidden": "true" }, titleScene());
  const status = el("span", { class: "demo-status" }, `[${DEMO_COPY.playing}]`);
  const label = el("span", {}, DEMO_COPY.pause);
  const pauseBtn = el(
    "button",
    { type: "button", class: "btn demo-pause", "aria-pressed": "false", onClick: () => toggle() },
    label,
  );
  const controls = el("div", { class: "demo-controls", hidden: true }, [status, pauseBtn]);
  let run = null; // { loop, state, field, moments, clock, n, paused }
  let timer = null;

  const gone = () => scene.isConnected === false;
  const wait = () => {
    if (reducedMotion(win)) return; // a still frame only (attract Req 3.3)
    win?.clearTimeout?.(timer);
    timer = win?.setTimeout?.(() => (gone() ? null : start()), idleMs);
  };
  const show = (paused) => {
    status.textContent = `[${paused ? DEMO_COPY.paused : DEMO_COPY.playing}]`;
    label.textContent = paused ? DEMO_COPY.resume : DEMO_COPY.pause;
    pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
  };
  function newRound(n) {
    const mechanic = DEMO_MECHANICS[n % DEMO_MECHANICS.length];
    const field = (mechanic === "corners" ? createCorners : createFalling)(el);
    const state = demoRound(mechanic, pack.pools.words, Date.now());
    const box = el("div", { class: `attract-field attract-${mechanic}` }, [
      field.node,
      el("span", { class: "scene-tag station-id" }, DEMO_COPY.tag),
    ]);
    scene.replaceChildren(box);
    field.update(state);
    return { ...run, state, field, n, clock: { wait: 600 } };
  }
  const frame = (dt) => {
    if (gone()) return stop();
    const r = demoStep(run.state, dt, run.clock);
    playMoments(run.moments, run.field, r.events, run.state);
    run.state = r.state;
    run.field.update(r.state);
    if (r.done) run = newRound(run.n + 1);
  };
  const loop = () => startLoop({ onFrame: frame, onHide: () => {}, win, doc });
  function start() {
    run = { moments: createMoments(), paused: false };
    run = newRound(0);
    run.loop = loop();
    controls.removeAttribute("hidden");
    show(false);
  }
  function stop() {
    run?.loop?.stop();
    run?.moments?.stop();
    run = null;
  }
  function toggle() {
    if (!run) return;
    run.paused = !run.paused;
    if (run.paused) run.loop.stop();
    else run.loop = loop();
    show(run.paused);
  }
  wait();
  return {
    scene,
    controls,
    /** Any key, click or scroll: back to the still frame, and the idle wait starts over. */
    input(e) {
      if (e?.target && controls.contains?.(e.target)) return; // the Pause button is not "input"
      if (run) {
        stop();
        scene.replaceChildren(titleScene());
        controls.setAttribute("hidden", "");
      }
      wait();
    },
    running: () => !!run && !run.paused,
  };
}
