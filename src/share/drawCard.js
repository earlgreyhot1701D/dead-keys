// Job: draw the share card on a 1200 x 630 canvas (the link-preview size), as the approved mock
// (Nov 13). Takes any 2D context, so tests pass a fake that records the calls. Colors are the
// design tokens; fonts are the app's own self-hosted ones, loaded before drawing (shareDialog).
import { SITE, TAGLINE } from "./cardData.js";

export const W = 1200;
export const H = 630;
const C = {
  bg: "#0a1214",
  text: "#4fe3d1",
  accent: "#71d8ca",
  muted: "#9bb0ad",
  rule: "#3ca89c",
  card: "#142225",
  bright: "#d6e5e9",
  shaky: "#f2c14e",
};
const HEAD = '"Roboto Condensed", "Arial Narrow", sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const L = 62; // left edge
const R = W - 62; // right edge

function text(g, s, x, y, { font, color, align = "left", spacing = "0px" }) {
  g.font = font;
  g.fillStyle = color;
  g.textAlign = align;
  if ("letterSpacing" in g) g.letterSpacing = spacing;
  g.fillText(s, x, y);
}

/** A 6px "double" border: two 2px lines with a 2px gap. */
function double(g, x, y, w, h, color) {
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.strokeRect(x + 1, y + 1, w - 2, h - 2);
  g.strokeRect(x + 5, y + 5, w - 10, h - 10);
}

function rule(g, y) {
  g.fillStyle = C.rule;
  g.fillRect(L, y, R - L, 2);
}

/**
 * Draw the card for `d` (from cardData).
 * @param {CanvasRenderingContext2D} g
 * @param {ReturnType<typeof import("./cardData.js").cardData>} d
 */
export function drawCard(g, d) {
  g.fillStyle = C.bg;
  g.fillRect(0, 0, W, H);
  double(g, 0, 0, W, H, C.rule);
  const top = { font: `700 26px ${HEAD}`, color: C.accent, spacing: "3.6px" };
  text(g, "DEAD KEYS // TERMINAL 84", L, 72, top);
  text(g, "ROUND REPORT", R, 72, { ...top, align: "right" });
  rule(g, 94);
  const unit = { font: `400 34px ${HEAD}`, color: C.accent, spacing: "5.4px" };
  text(g, String(d.wpm), L - 4, 300, { font: `700 200px ${HEAD}`, color: C.text });
  g.font = `700 200px ${HEAD}`;
  const accX = L + Math.max(g.measureText(String(d.wpm)).width, 90) + 80;
  text(g, "WPM", L, 358, unit);
  text(g, `${d.accuracy}%`, accX, 300, { font: `700 120px ${HEAD}`, color: C.bright });
  text(g, "ACCURACY", accX, 358, unit);
  g.fillStyle = C.card;
  g.fillRect(776, 142, R - 776, 224);
  double(g, 776, 142, R - 776, 224, C.rule);
  const rows = [
    ["BEST SPEED", d.best === null ? "—" : `${d.best} WPM`],
    ["ROUNDS", String(d.rounds)],
    ["STREAK", `${d.streak} ${d.streak === 1 ? "DAY" : "DAYS"}`],
  ];
  rows.forEach(([k, v], i) => {
    text(g, k, 808, 216 + i * 47, { font: `400 24px ${MONO}`, color: C.muted });
    text(g, v, R - 32, 216 + i * 47, { font: `700 24px ${MONO}`, color: C.bright, align: "right" });
  });
  text(g, d.meta, L, 432, { font: `400 26px ${MONO}`, color: C.muted, spacing: "1.5px" });
  if (d.milestone) {
    const ms = { font: `700 28px ${HEAD}`, color: C.shaky, spacing: "3.4px" };
    g.font = ms.font;
    if ("letterSpacing" in g) g.letterSpacing = ms.spacing;
    const w = g.measureText(d.milestone).width + 44;
    g.fillStyle = C.card;
    g.fillRect(L, 463, w, 54);
    double(g, L, 463, w, 54, C.shaky);
    text(g, d.milestone, L + 22, 500, ms);
  }
  rule(g, 536);
  const foot = { font: `400 24px ${MONO}`, color: C.accent };
  text(g, TAGLINE, L, 578, foot);
  text(g, SITE, R, 578, { ...foot, align: "right" });
}
