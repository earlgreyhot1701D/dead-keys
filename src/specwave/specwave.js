// Job: the Spec Wave easter egg's rules (PRD G2: type `kiro` on the title for a bonus wave of
// spec words). Pure: the words, the one-wave limit, and the title's key watcher that tells a
// plain start from the egg. Drawn with our own ghost and game; never Kiro's logo or art.

/** The secret word, typed on the title screen. */
export const EGG = "kiro";
/** After a key that could begin the word, wait this long for the next one before starting. */
export const EGG_WAIT_MS = 600;

/** The bonus wave's words: the spec-driven way of building (PRD G2's list, plus a few). */
export const SPEC_WORDS = Object.freeze(
  [
    "spec",
    "specs",
    "steering",
    "steer",
    "hook",
    "hooks",
    "requirements",
    "design",
    "tasks",
    "task",
    "agent",
    "agentic",
    "prompt",
    "context",
    "acceptance",
    "criteria",
    "build",
    "ship",
    "review",
    "refine",
  ].map((text) => ({ id: `spec-${text}`, text })),
);

/** The Spec Wave's live lines (specwave copy table). */
export const SPEC_SAY = Object.freeze({
  start: "Spec Wave. A bonus wave of words from the spec.",
  end: "Spec Wave cleared.",
});

/**
 * Watch a round with a wave limit: once the round reaches the wave after its last, end it once.
 * @param {number} waves How many waves the round has.
 * @returns {(state: object) => { say: string|null, end: boolean }}
 */
export function createWaveWatch(waves) {
  let done = false;
  return (state) => {
    if (done || state.ended || state.wave <= waves) return { say: null, end: false };
    done = true;
    return { say: SPEC_SAY.end, end: true };
  };
}

/**
 * The title's key watcher. Each start key is "wait" (it could be the egg so far), "egg" (the
 * whole word, just typed) or "start" (anything else: start the game as always).
 * @returns {{ feed: (key: string) => "wait"|"egg"|"start" }}
 */
export function createEggWatch(word = EGG) {
  let i = 0;
  return {
    feed(key) {
      if (typeof key === "string" && key.toLowerCase() === word[i]) {
        i += 1;
        if (i < word.length) return "wait";
        i = 0;
        return "egg";
      }
      i = 0;
      return "start";
    },
  };
}
