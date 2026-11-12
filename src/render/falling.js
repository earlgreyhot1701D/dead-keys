// Falling words (mock screen 3, play Req 3): six lanes, word cards, the locked card with its
// typed and remaining parts, the beam under it, the danger band and the station. Positions come
// only from the engine's `slot` and `progress` (design 1); per frame only `transform`,
// `textContent` and the `--near` dimming value change. Classes change on events (lock,
// danger), never every frame.
import { SLOTS } from "../engine/config.js";
import { svg } from "../ui/svg.js";
import { dangerMark, inDanger, lockBar, lockParts, nearness } from "./hud.js";

const LOCKED_BAR = "╔══ LOCKED ══╗";

/** The field in design pixels (the page is fitted to 1440x900, Block 6 fit.js). */
export const FIELD = Object.freeze({ w: 1376, h: 680, cardH: 64 });
export const LANES = SLOTS.falling;

/** The locked card's width (playLock.css); an edge lane's card is kept this far inside. */
export const LOCK_W = 220;
/** A lane's center, in field pixels. */
export const laneX = (slot) => ((slot + 0.5) * FIELD.w) / LANES;
/** Where a card's center goes: its lane, pulled in so a locked card is never cut off. */
export const cardX = (slot) => Math.min(FIELD.w - LOCK_W / 2, Math.max(LOCK_W / 2, laneX(slot)));
/** Where the ship sits: under the locked word's lane, or where it last was (Shara, Nov 12). */
export const shipX = (state, last = FIELD.w / 2) => {
  const t = state.targets.find((x) => x.id === state.lockId);
  return t ? cardX(t.slot) : last;
};
/** A card's top edge for its progress: 0 at the top, landing on the station line at 1. */
export const cardY = (progress) => progress * (FIELD.h - FIELD.cardH);

const move = (node, x, y) => {
  if (node.style) node.style.transform = `translate(${x}px, ${y}px)`;
};
const setText = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};

function crosshair() {
  const line = { stroke: "#031013", "stroke-width": 2.5 };
  return svg("svg", { viewBox: "0 0 24 24", width: 14, height: 14, "aria-hidden": "true" }, [
    svg("circle", { cx: 12, cy: 12, r: 7, fill: "none", ...line }),
    svg("path", { d: "M12 1v5M12 18v5M1 12h5M18 12h5", ...line }),
  ]);
}

function makeCard(el, target) {
  const parts = {
    tag: el("div", { class: "fw-tag" }),
    word: el("div", { class: "fw-word" }, target.text),
    typed: el("span", { class: "fw-typed" }),
    wrong: el("span", { class: "fw-wrong" }),
    rest: el("span", { class: "fw-rest" }),
    bar: el("span", {}, LOCKED_BAR),
  };
  const node = el("div", { class: "fw" }, [
    el("div", { class: "fw-inner" }, [
      el("div", { class: "fw-card" }, [parts.tag, parts.word]),
      el("div", { class: "fw-lock" }, [
        el("div", { class: "fw-lock-bar" }, [parts.bar, crosshair()]),
        el("div", { class: "fw-lock-word" }, [
          el("span", { class: "fw-bracket" }, "["),
          parts.typed,
          el("span", { class: "fw-caret" }, "|"),
          parts.wrong,
          parts.rest,
          el("span", { class: "fw-bracket" }, "]"),
        ]),
        el("div", { class: "fw-lock-foot" }, el("span", {}, "╚════════╝")),
      ]),
      el("div", { class: "fw-trail" }),
      el("span", { class: "m-check" }, "✓"),
    ]),
  ]);
  return { node, parts, locked: null, danger: null, near: null };
}

/**
 * Build the field. `update(state)` draws one frame of the engine state.
 * @param {Function} el The `el` function.
 * @returns {{ node: HTMLElement, update: (state: object) => void, cards: Map<number, object>, banner: HTMLElement }}
 */
export function createFalling(el) {
  const layer = el("div", { class: "fall-cards" });
  const beam = el("div", { class: "fall-beam" });
  const banner = el("div", { class: "m-wave" });
  const station = el("div", { class: "fall-station" }, [
    el("div", { class: "st-1" }, "▲"),
    el("div", { class: "st-2" }, "[ ╨ ]"),
    el("div", { class: "st-3" }, "╔═══╩═══╗"),
    el("div", { class: "st-4" }, "▓▓▓▓▓▓▓▓▓▓▓"),
  ]);
  let shipAt = FIELD.w / 2;
  const node = el("div", { class: "fall-field", "aria-hidden": "true" }, [
    el(
      "div",
      { class: "fall-lanes" },
      [...Array(LANES)].map(() => el("div", { class: "fall-lane" })),
    ),
    el("div", { class: "fall-danger" }),
    el("span", { class: "fall-danger-label" }, "DANGER ZONE"),
    station,
    beam,
    layer,
    banner,
  ]);
  const cards = new Map();
  function update(state) {
    const live = new Set();
    for (const t of state.targets) {
      live.add(t.id);
      let c = cards.get(t.id);
      if (!c) {
        c = makeCard(el, t);
        cards.set(t.id, c);
        layer.append(c.node);
      }
      const isLocked = t.id === state.lockId;
      const cls = `fw${isLocked ? " is-locked" : ""}${inDanger(t) ? " is-danger" : ""}${t.wrong ? " is-wrong" : ""}`;
      if (c.cls !== cls) c.node.setAttribute("class", cls);
      c.cls = cls;
      setText(c.parts.tag, dangerMark(t));
      const { typed, wrong, rest } = lockParts(t);
      setText(c.parts.typed, typed);
      setText(c.parts.wrong, wrong);
      setText(c.parts.bar, lockBar(t, LOCKED_BAR));
      setText(c.parts.rest, rest);
      const near = nearness(t.progress);
      if (c.near !== near && c.node.style) c.node.style.setProperty("--near", String(near));
      c.near = near;
      move(c.node, cardX(t.slot), cardY(t.progress));
      if (isLocked) move(beam, cardX(t.slot), cardY(t.progress) + FIELD.cardH);
    }
    const x = shipX(state, shipAt); // the ship slides under the locked word (CSS transition)
    if (x !== shipAt) {
      shipAt = x;
      station.style?.setProperty("--ship-x", `${x}px`);
    }
    for (const [id, c] of cards) {
      if (!live.has(id) && !c.leaving) {
        c.node.remove();
        cards.delete(id);
      }
    }
    beam.setAttribute("class", state.lockId === null ? "fall-beam" : "fall-beam is-on");
  }
  return { node, update, cards, banner };
}
