// What the live region says during a round (play Req 6.3), as a pure function of an engine event
// and the states before and after it. Only six kinds of line, from the approved copy table:
// a cleared word, a lost life, a new wave, the warm-up ending, out of lives, paused. Keystrokes, misses, locks and
// unlocks are never spoken: a screen reader user would hear nothing else.

/**
 * @param {{ type: string, targetId?: number, wave?: number }} event
 * @param {{ targets: { id: number, text: string }[] }} before The state the event came from.
 * @param {{ lives: number }} after The state the event produced.
 * @returns {string | null} The line to speak, or null for nothing.
 */
export function announce(event, before, after) {
  switch (event?.type) {
    case "cleared": {
      const word = before?.targets?.find((t) => t.id === event.targetId)?.text;
      return word ? `Cleared ${word}.` : null;
    }
    case "lifeLost":
      return `Life lost. ${after.lives} left.`;
    case "waveUp":
      return `Wave ${event.wave}.`;
    case "warmupDone":
      return "Warm-up done. Wave 1.";
    case "outOfLives":
      return "Out of lives.";
    case "paused":
      return "Paused.";
    default:
      return null;
  }
}

/**
 * Every line for one engine step, in event order. When one step loses several lives, only the
 * last "Life lost" is kept, so the count spoken is the count left.
 * @param {{ type: string }[]} events
 * @param {object} before
 * @param {object} after
 * @returns {string[]}
 */
export function announceAll(events, before, after) {
  const lines = [];
  for (const e of events) {
    const line = announce(e, before, after);
    if (!line) continue;
    if (e.type === "lifeLost" && lines.at(-1)?.startsWith("Life lost.")) lines.pop();
    lines.push(line);
  }
  return lines;
}
