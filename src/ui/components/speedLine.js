// The speed line's numbers (pure, no DOM): WPM over the last rounds, scaled into the mock's
// 430 x 290 chart. Five gridlines in the mock's places, so the labels can sit in fixed spots.
// Only saved rounds are used; nothing is smoothed or guessed.

/** How many rounds the line shows. */
export const SPEED_ROUNDS = 14;

/** The mock's chart box: points run from x 44 to 408; gridlines at y 217 (lowest) to 37. */
export const BOX = Object.freeze({
  width: 430,
  height: 290,
  x0: 44,
  x1: 408,
  yLow: 217,
  yHigh: 37,
  base: 262,
});

const STEPS = [5, 10, 20, 25, 50, 100];

/**
 * The gridline values: five evenly spaced, nice numbers that cover the speeds shown.
 * @param {number[]} wpms
 * @returns {number[]} Lowest first.
 */
export function ticks(wpms) {
  const lo = Math.min(...wpms);
  const hi = Math.max(...wpms);
  for (const step of STEPS) {
    const start = Math.max(0, Math.floor(lo / step) * step);
    if (start + 4 * step >= hi) return [0, 1, 2, 3, 4].map((i) => start + i * step);
  }
  const step = Math.ceil((hi - lo) / 4 / 100) * 100;
  const start = Math.floor(lo / step) * step;
  return [0, 1, 2, 3, 4].map((i) => start + i * step);
}

/**
 * Everything the chart draws, or null when there are no rounds.
 * @param {{ wpm: number }[]} rounds Saved rounds, oldest first.
 * @returns {null | { wpms: number[], ticks: number[], points: {x:number,y:number}[], line: string, area: string, gain: number }}
 */
export function speedLine(rounds) {
  // Whole words per minute, as the results screen shows them.
  const wpms = (rounds ?? [])
    .map((r) => r?.wpm)
    .filter((w) => Number.isFinite(w) && w >= 0)
    .slice(-SPEED_ROUNDS)
    .map((w) => Math.round(w));
  if (wpms.length === 0) return null;
  const t = ticks(wpms);
  const span = t[4] - t[0];
  const y = (w) => BOX.yLow - ((w - t[0]) / span) * (BOX.yLow - BOX.yHigh);
  const n = wpms.length;
  const x = (i) => (n === 1 ? (BOX.x0 + BOX.x1) / 2 : BOX.x0 + (i * (BOX.x1 - BOX.x0)) / (n - 1));
  const r1 = (v) => Math.round(v * 10) / 10;
  const points = wpms.map((w, i) => ({ x: r1(x(i)), y: r1(y(w)) }));
  const line = points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
  const last = points.at(-1);
  const area = `${line} L${last.x} ${BOX.base} L${points[0].x} ${BOX.base} Z`;
  return { wpms, ticks: t, points, line, area, gain: wpms.at(-1) - wpms[0] };
}

/** The same line in words, for a screen reader. */
export function speedWords(wpms) {
  return `Speed over your last ${wpms.length} ${wpms.length === 1 ? "round" : "rounds"}, oldest first: ${wpms.join(", ")} words per minute.`;
}
