// The speed line panel (locked mock, screen 6, right column): WPM over the last 14 saved rounds,
// drawn with the safe SVG builder, gridline labels as text beside it, and the same numbers in
// words for a screen reader. The gain pill shows only a rise, never a drop (PRD G5: the early
// speed dip is never punished).
import { el } from "../dom.js";
import { svg } from "../svg.js";
import { panelHead, pill } from "./chrome.js";
import { BOX, SPEED_ROUNDS, speedLine, speedWords } from "./speedLine.js";

export const SPEED_TITLE = `SPEED // LAST ${SPEED_ROUNDS} ROUNDS`;
export const NO_ROUNDS = "No rounds yet.";

function chart(s) {
  const grid = [0, 1, 2, 3, 4].map((i) => {
    const y = BOX.yLow - (i * (BOX.yLow - BOX.yHigh)) / 4;
    return svg("path", { d: `M40 ${y} H420`, stroke: "#1E2C2F", "stroke-dasharray": "3 3" });
  });
  const dots = s.points.map((p, i) =>
    svg("circle", {
      cx: p.x,
      cy: p.y,
      r: i === s.points.length - 1 ? 5 : 3,
      fill: i === s.points.length - 1 ? "#7AFFED" : "#4FE3D1",
    }),
  );
  return el("div", { class: "chart" }, [
    svg(
      "svg",
      {
        viewBox: `0 0 ${BOX.width} ${BOX.height}`,
        width: BOX.width,
        height: BOX.height,
        "aria-hidden": "true",
      },
      [
        ...grid,
        svg("path", { d: `M40 ${BOX.base} H420`, stroke: "#3CA89C", "stroke-width": 1.5 }),
        svg("path", { d: s.area, fill: "rgba(79,227,209,0.08)" }),
        svg("path", { d: s.line, fill: "none", stroke: "#4FE3D1", "stroke-width": 2.5 }),
        ...dots,
      ],
    ),
    ...s.ticks.map((t, i) =>
      el("span", { class: `chart-y y-${i}`, "aria-hidden": "true" }, String(t)),
    ),
    el("span", { class: "chart-x x-first", "aria-hidden": "true" }, "OLDEST"),
    el("span", { class: "chart-x x-last", "aria-hidden": "true" }, "LATEST"),
  ]);
}

/**
 * @param {{ wpm: number }[]} rounds Saved rounds, oldest first.
 * @param {HTMLElement[]} [after] More of the panel (personal bests go here).
 */
export function renderSpeedPanel(rounds, after = []) {
  const s = speedLine(rounds);
  return el("section", { class: "term-panel speed-panel", "aria-labelledby": "pg-speed" }, [
    panelHead(
      el("span", { class: "speed-head" }, [
        el("h2", { id: "pg-speed" }, SPEED_TITLE),
        el("span", { class: "speed-sub" }, "WPM BY ROUND"),
      ]),
      s && s.gain > 0 ? pill(`+${s.gain} WPM`, "pill-gain") : null,
    ),
    s
      ? el("div", { class: "chart-well" }, [
          chart(s),
          el("p", { class: "sr-only" }, speedWords(s.wpms)),
        ])
      : el("p", { class: "chart-empty" }, NO_ROUNDS),
    ...after,
  ]);
}
