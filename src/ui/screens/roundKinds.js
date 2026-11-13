// Job: every round the game can start, by name (play design decision 5; moved from play.js at the
// line cap in Block 14). A kind's extra fields: `limitMs` (the daily clock), `waves` (Spec Wave's
// one wave), `items` and `packId` (its own words), `say` (its start line, live region).
import { DAILY_MS, DAILY_SAY } from "../../drills/daily.js";
import { SPEC_SAY, SPEC_WORDS } from "../../specwave/specwave.js";

export const ROUND_KINDS = Object.freeze({
  falling: { mode: "falling", mechanic: "falling", title: "Falling words" },
  corners: { mode: "corners", mechanic: "corners", title: "Four corners" },
  practice: { mode: "practice", mechanic: "falling", title: "Practice" },
  drill: { mode: "practice", mechanic: "falling", title: "Drill", drillSource: "built-in" },
  daily: {
    mode: "daily",
    mechanic: "falling",
    title: "Daily drill",
    limitMs: DAILY_MS,
    say: DAILY_SAY.start,
  },
  specwave: {
    mode: "specwave",
    mechanic: "falling",
    title: "Spec Wave",
    items: SPEC_WORDS,
    packId: "specwave",
    waves: 1,
    say: SPEC_SAY.start,
  },
});
