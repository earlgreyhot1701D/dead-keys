// Job: the ghost race's rules (PRD G4 GhostRun; ghost Reqs 1 and 2). Pure: a saved run in, the
// ghost's progress at any moment out. A ghost is your own best run in a mode, saved key by key;
// racing it compares how many letters each of you had typed right at the same moment of play.
import { CHARS_PER_WORD } from "../engine/config.js";

/** The modes with a ghost: the two games and the daily drill (not practice, lessons or drills). */
export const GHOST_MODES = Object.freeze(["falling", "corners", "daily"]);
/** The contract's cap on a ghost's keystrokes (contract/schemas/ghostRun.json). */
export const GHOST_MAX_KEYS = 2000;

/** The words the ghost race uses (ghost copy table). */
export const GHOST_COPY = Object.freeze({
  passed: "You passed your ghost.",
  saved: "New ghost saved. Race it next time.",
  hint: "Beat your best at 90% accuracy or better and it becomes your ghost. Next round, you race it.",
});

/** One run as a GhostRun, or null when the mode has no ghost. */
export function ghostFrom(result, keystrokes) {
  if (!GHOST_MODES.includes(result?.mode) || !Array.isArray(keystrokes)) return null;
  return {
    mode: result.mode,
    packId: result.packId,
    wpm: result.wpm,
    keystrokes: keystrokes.slice(0, GHOST_MAX_KEYS).map(({ t, expected, typed, ok }) => ({
      t,
      expected,
      typed,
      ok,
    })),
  };
}

/** The saved ghost for a mode and pack, or null. */
export const findGhost = (progress, mode, packId) =>
  (progress?.ghosts ?? []).find((g) => g.mode === mode && g.packId === packId) ?? null;

/** Progress with this ghost in place of any old one for the same mode and pack (one each). */
export function saveGhost(progress, ghost) {
  const others = (progress.ghosts ?? []).filter(
    (g) => !(g.mode === ghost.mode && g.packId === ghost.packId),
  );
  return { ...progress, ghosts: [...others, ghost] };
}

/**
 * Letters the ghost had typed right by `ms` of active play. Keystrokes are in time order, so this
 * is a binary search: cheap enough to run every frame.
 */
export function ghostChars(ghost, ms) {
  const ok = ghost.okTimes ?? ghost.keystrokes.filter((k) => k.ok).map((k) => k.t);
  let lo = 0;
  let hi = ok.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ok[mid] <= ms) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** A ghost ready to race: its right-letter times worked out once, not every frame. */
export const prepareGhost = (ghost) =>
  ghost && { ...ghost, okTimes: ghost.keystrokes.filter((k) => k.ok).map((k) => k.t) };

/** Your lead over the ghost in letters typed right: positive ahead, negative behind. */
export const lead = (ghost, state) =>
  state.keystrokes.filter((k) => k.ok).length - ghostChars(ghost, state.activeMs);

/** The HUD's words for a lead: "+12 AHEAD", "5 BEHIND" or "LEVEL". */
export const leadText = (n) => (n > 0 ? `+${n} AHEAD` : n < 0 ? `${-n} BEHIND` : "LEVEL");

/** The results line for a raced ghost (wpm values already rounded by the caller). */
export function raceLine(you, ghost) {
  if (you > ghost) return `You beat your ghost: ${you} WPM to ${ghost}.`;
  if (you === ghost) return `You tied your ghost at ${you} WPM.`;
  return `Your ghost was faster: ${ghost} WPM to your ${you}.`;
}

/** "Race your ghost: 36 WPM" and its pace, "TARGET PACE: 180 CPM" (5 letters a word). */
export const raceIt = (wpm) => `Race your ghost: ${Math.round(wpm)} WPM`;
export const paceText = (wpm) => `TARGET PACE: ${Math.round(wpm * CHARS_PER_WORD)} CPM`;
