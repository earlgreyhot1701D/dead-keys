// Job: which sound plays when (sound Req 1; PRD G2 sound sets). Pure: the chosen set and a
// round's events in, cue names out. Off plays nothing. Typewriter: a clack per key, a carriage
// return per word, a bell per wave, a thunk when a word lands. Arcade: a laser per word, a thud
// when a word lands, a chime per wave.

/** Each set's cue for each moment. A moment a set leaves out is silent in that set. */
export const CUES = Object.freeze({
  off: {},
  typewriter: { key: "clack", cleared: "carriage", waveUp: "bell", lifeLost: "thunk" },
  arcade: { cleared: "laser", waveUp: "chime", lifeLost: "thud" },
});

/** The sample Settings plays when a set is picked, so the player hears what they chose. */
export const SAMPLE = Object.freeze({ typewriter: "bell", arcade: "chime" });

/**
 * The cues for one step of a round.
 * @param {string} set "off", "typewriter" or "arcade" (anything else is silent).
 * @param {{ type: string }[]} events The engine's events for the step.
 * @param {boolean} [typed] A key was typed this step (the typewriter's clack).
 * @returns {string[]} At most one of each cue, in a fixed order.
 */
export function cuesFor(set, events, typed = false) {
  const cues = CUES[set] ?? {};
  const moments = new Set(events.map((e) => e.type));
  if (typed) moments.add("key");
  return ["key", "cleared", "lifeLost", "waveUp"]
    .filter((m) => moments.has(m) && cues[m])
    .map((m) => cues[m]);
}
