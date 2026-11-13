// Job: the word packs a player can pick (spanish Req 2), by id, with the names the screens show.
// The pick is the `pack` setting; it applies to Falling words, Four corners and Practice. Drills,
// lessons, the daily drill and Spec Wave keep their own words.
import general from "../../packs/general.json" with { type: "json" };
import spanish from "../../packs/spanish.json" with { type: "json" };

export const PACKS = Object.freeze({ general, spanish });
/** The ids the `pack` setting allows, in the order the Play screen offers them. */
export const PACK_IDS = Object.freeze(["general", "spanish"]);
/** What the Play screen calls each pack. */
export const PACK_LABELS = Object.freeze({ general: "English", spanish: "Español" });
/** The modes the pick applies to. */
export const PACK_MODES = Object.freeze(["falling", "corners", "practice"]);

/** The pack a round of `kind` plays, for these settings: the pick, or English. */
export const packFor = (kind, settings) =>
  PACK_MODES.includes(kind.mode) && !kind.drillSource && !kind.items
    ? (PACKS[settings?.pack] ?? general)
    : general;
