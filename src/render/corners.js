// Four corners (mock screen 4, play Req 3): four quadrants, the line from each corner to the
// core, the danger ring, the core, word cards with D:nn, the locked word with TARGET_LOCKED,
// DIST and VECTOR, and the beam from the core to it. Positions come only from the engine's
// `slot` and `progress` (design 1); per frame only `transform`, `textContent` and `--near`
// change. Classes change on events (lock, danger), never every frame.
import { ghostIcon } from "../ui/components/chrome.js";
import { svg } from "../ui/svg.js";
import { makeCard } from "./cornersCard.js";
import {
  CORNERS,
  DANGER_FROM,
  dangerMark,
  dist,
  inDanger,
  lockParts,
  nearness,
  quadrantText,
  vectorText,
} from "./hud.js";

/** The play area in design pixels, the core, the corners (slot order NW, NE, SW, SE). */
export const AREA = Object.freeze({ w: 1440, h: 780 });
export const CORE = Object.freeze({ x: 720, y: 390 });
export const CORNER_AT = Object.freeze([
  [173, 94],
  [1267, 94],
  [173, 686],
  [1267, 686],
]);
/** The mock's danger ring and outer ring radii. */
export const RING_R = 240;
const OUTER_R = 340;
const LINE = Math.hypot(CORE.x - CORNER_AT[0][0], CORE.y - CORNER_AT[0][1]);
/** How far from the core a word stops, so progress DANGER_FROM is exactly on the ring. */
export const STOP_R = LINE - (LINE - RING_R) / DANGER_FROM;

/** Where a word is: along its corner's line toward the core, by progress. */
export function wordAt(slot, progress) {
  const [x0, y0] = CORNER_AT[slot];
  const f = (progress * (LINE - STOP_R)) / LINE;
  return { x: x0 + f * (CORE.x - x0), y: y0 + f * (CORE.y - y0) };
}

const setText = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};
const style = (node, prop, value) => {
  if (node.style) node.style.setProperty(prop, value);
};

function drawing() {
  const path = (d, cls) => svg("path", { d, class: cls });
  const lines = CORNER_AT.map(([x, y]) => path(`M${x} ${y}L${CORE.x} ${CORE.y}`, "cn-line"));
  const ring = (r, cls) => svg("circle", { cx: CORE.x, cy: CORE.y, r, class: cls });
  const view = `0 0 ${AREA.w} ${AREA.h}`;
  const art = svg("svg", { viewBox: view, width: AREA.w, height: AREA.h, class: "cn-art" }, [
    ...lines,
    ring(OUTER_R, "cn-outer"),
    ring(RING_R, "cn-ring"),
  ]);
  return { art, lines };
}

/**
 * Build the field. `update(state)` draws one frame of the engine state.
 * @param {Function} el The `el` function.
 * @returns {{ node: HTMLElement, update: (state: object) => void, cards: Map<number, object>, banner: HTMLElement }}
 */
export function createCorners(el) {
  const quads = CORNERS.map((c) => el("div", { class: `cn-quad cn-${c.toLowerCase()}` }));
  const { art, lines } = drawing();
  const beam = el("div", { class: "cn-beam" });
  const layer = el("div", { class: "cn-cards" });
  const banner = el("div", { class: "m-wave" });
  const node = el("div", { class: "cn-field", "aria-hidden": "true" }, [
    el("div", { class: "cn-quads" }, quads),
    art,
    el("span", { class: "cn-ring-label" }, "DANGER RING"),
    beam,
    layer,
    el("div", { class: "cn-core" }, [
      el("div", { class: "cn-core-head" }, el("span", {}, "CORE 84")),
      el("div", { class: "cn-core-ghost" }, ghostIcon(48, 52)),
    ]),
    banner,
  ]);
  const cards = new Map();
  let lockSlot;
  function update(state) {
    const live = new Set();
    let lock = null;
    for (const t of state.targets) {
      live.add(t.id);
      let c = cards.get(t.id);
      if (!c) {
        c = makeCard(el, t);
        cards.set(t.id, c);
        layer.append(c.node);
      }
      const isLocked = t.id === state.lockId;
      if (isLocked) lock = t;
      const cls = `cw${isLocked ? " is-locked" : ""}${inDanger(t) ? " is-danger" : ""}${t.wrong ? " is-wrong" : ""}`;
      if (c.cls !== cls) c.node.setAttribute("class", cls);
      c.cls = cls;
      const near = nearness(t.progress);
      if (c.near !== near) style(c.node, "--near", String(near));
      c.near = near;
      setText(c.p.tag, dangerMark(t));
      setText(c.p.dist, `D:${dist(t)}`);
      setText(c.p.lockDist, `DIST: ${dist(t)}`);
      const { typed, wrong, rest } = lockParts(t);
      setText(c.p.typed, typed);
      setText(c.p.wrong, wrong);
      setText(c.p.rest, rest);
      setText(c.p.vector, isLocked ? vectorText(state) : "");
      const at = wordAt(t.slot, t.progress);
      style(c.node, "transform", `translate(${at.x}px, ${at.y}px)`);
    }
    for (const [id, c] of cards) {
      if (!live.has(id) && !c.leaving) {
        c.node.remove();
        cards.delete(id);
      }
    }
    for (const [i, q] of quads.entries()) setText(q, quadrantText(i, state));
    const slot = lock ? lock.slot : null;
    if (slot !== lockSlot) {
      for (const [i, l] of lines.entries())
        l.setAttribute("class", i === slot ? "cn-line is-on" : "cn-line");
      for (const [i, q] of quads.entries()) {
        const base = `cn-quad cn-${CORNERS[i].toLowerCase()}`;
        q.setAttribute("class", i === slot ? `${base} is-on` : base);
      }
      beam.setAttribute("class", slot === null ? "cn-beam" : "cn-beam is-on");
      lockSlot = slot;
    }
    if (lock) {
      const at = wordAt(lock.slot, lock.progress);
      const angle = Math.atan2(at.y - CORE.y, at.x - CORE.x);
      const len = Math.hypot(at.x - CORE.x, at.y - CORE.y);
      style(
        beam,
        "transform",
        `translate(${CORE.x}px, ${CORE.y}px) rotate(${angle}rad) scaleX(${len})`,
      );
    }
  }
  return { node, update, cards, banner };
}
