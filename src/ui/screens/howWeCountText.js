// The words of the "How we count" page, built from the engine's config so the page and the code
// cannot disagree (shell Req 7.1). Pure: no DOM, no storage. `buildSections` takes the config as
// an argument, so a test can change a number and see the page change with it.
//
// Numbers that are not in any config file, and so are written here: five characters to a word
// (score.js divides by 5 inline), three sentences and six practice keys (diagnose.js slices them
// inline). Rules whose code is not built yet (lesson pass, drills, daily drill, the speed dip
// notice) are left out until their block adds both the config and the text.

import {
  BANDS,
  BEST_ACCURACY,
  ENOUGH_DATA,
  GROUP_FLOOR,
  GROUP_MIN_ATTEMPTS,
  GROUP_RATIO,
  GROUPS,
  HIGH_RATIO,
  MIN_KEY_ATTEMPTS,
  STREAK_ACCURACY,
  STREAK_DAYS,
  STREAK_ROUNDS,
  WPM_BAND,
} from "../../engine/progressConfig.js";
import { MAX_ROUNDS } from "../../engine/record.js";
import { PRIVACY_PARAGRAPHS } from "./privacy.js";

/** Everything the page reads. */
export const CONFIG = Object.freeze({
  BANDS,
  BEST_ACCURACY,
  ENOUGH_DATA,
  GROUP_FLOOR,
  GROUP_MIN_ATTEMPTS,
  GROUP_RATIO,
  GROUPS,
  HIGH_RATIO,
  MAX_ROUNDS,
  MIN_KEY_ATTEMPTS,
  STREAK_ACCURACY,
  STREAK_DAYS,
  STREAK_ROUNDS,
  WPM_BAND,
});

const pct = (x) => `${Math.round(x * 100)}%`;

/** One line per heat band, worst first, with its glyph and where it starts. */
function bandLines(bands) {
  const real = bands.filter((b) => b.min !== null);
  return real.map((b, i) => {
    const above = i > 0 ? pct(real[i - 1].min) : null;
    let how = `${pct(b.min)} up to ${above}`;
    if (above === null) how = `a miss rate of ${pct(b.min)} or more`;
    else if (b.min === 0) how = `under ${above}`;
    return `${b.label} (${b.glyph}): ${how}.`;
  });
}

/**
 * @param {typeof CONFIG} [c]
 * @returns {{ id: string, heading: string, paragraphs: string[] }[]}
 */
export function buildSections(c = CONFIG) {
  const noData = c.BANDS.find((b) => b.min === null);
  const groups = c.GROUPS.map((g) => g.phrase).join(", ");
  return [
    {
      id: "speed",
      heading: "Speed",
      paragraphs: [
        "Words per minute is the characters you typed correctly, divided by five, divided by the minutes you played. Time spent paused is left out.",
      ],
    },
    {
      id: "accuracy",
      heading: "Accuracy",
      paragraphs: [
        "Accuracy is the keystrokes you got right divided by all your keystrokes. Backspace is not counted as a keystroke.",
      ],
    },
    {
      id: "misses",
      heading: "What counts as a miss",
      paragraphs: [
        "A miss is a typed character that doesn't match the character the game expected next. It is counted against the key you should have pressed, not the one you hit. Case and punctuation count, so A is not a.",
        "In a round, the first character you type locks the target closest to danger that starts with it. If two are equally close, the one that appeared first is locked. Escape drops the lock. If nothing is locked, Escape pauses.",
      ],
    },
    {
      id: "heat",
      heading: "The heat map",
      paragraphs: [
        `A key's miss rate is its misses divided by its attempts. A key needs ${c.MIN_KEY_ATTEMPTS} attempts before it gets a band. Until then it shows "${noData.label}" (${noData.glyph}) with a hatched pattern.`,
        ...bandLines(c.BANDS),
        "Every band has its own pattern and symbol as well as its color, so color is never the only signal.",
      ],
    },
    {
      id: "notice",
      heading: "What we notice",
      paragraphs: [
        `We say nothing about your typing until you have made ${c.ENOUGH_DATA} keystrokes. After that we look at groups of keys: ${groups}.`,
        `A group is mentioned when you have at least ${c.GROUP_MIN_ATTEMPTS} attempts on it, it misses at least ${c.GROUP_RATIO} times as often as you do overall, and its own miss rate is at least ${pct(c.GROUP_FLOOR)}. At ${c.HIGH_RATIO} times or more we say so. You see at most three sentences, worst first.`,
        `Keys to practice are up to six keys with at least ${c.MIN_KEY_ATTEMPTS} attempts and at least one miss, worst first.`,
      ],
    },
    {
      id: "bests",
      heading: "Bests and milestones",
      paragraphs: [
        `A personal best only counts at ${pct(c.BEST_ACCURACY)} accuracy or better, so speed never beats accuracy.`,
        `Milestones are a speed band every ${c.WPM_BAND} words per minute, ${c.STREAK_ROUNDS} rounds in a row at ${pct(c.STREAK_ACCURACY)} accuracy or better, ${c.STREAK_DAYS} days in a row with a round, and each lesson passed. We never tell you that you got slower.`,
      ],
    },
    {
      id: "stored",
      heading: "What is stored",
      paragraphs: [
        `Your last ${c.MAX_ROUNDS} rounds, how often you hit and miss each key, your personal bests, milestones and settings are saved in this browser only. There is no account.`,
      ],
    },
    {
      id: "leaves",
      heading: "What leaves your browser",
      paragraphs: [PRIVACY_PARAGRAPHS[1]],
    },
  ];
}
