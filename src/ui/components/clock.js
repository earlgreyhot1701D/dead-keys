// The menu header's live local clock ("14:03:22 LOCAL"), as in the locked mock. It stops itself
// when its screen is gone. It is plain text, not a live region, so it is never spoken.
import { el } from "../dom.js";

const two = (n) => String(n).padStart(2, "0");

/** "HH:MM:SS LOCAL" for a Date, in the player's own time. */
export const clockText = (d) =>
  `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())} LOCAL`;

/**
 * @param {() => Date} [now]
 * @returns {HTMLElement}
 */
export function liveClock(now = () => new Date()) {
  const text = el("span", { class: "clock-text" }, clockText(now()));
  const node = el("span", { class: "pill clock" }, [
    el("span", { class: "clock-dot", "aria-hidden": "true" }),
    text,
  ]);
  const timer = setInterval(() => {
    if (node.isConnected === false) clearInterval(timer);
    else text.textContent = clockText(now());
  }, 1000);
  timer?.unref?.(); // never keeps a test run alive
  return node;
}
