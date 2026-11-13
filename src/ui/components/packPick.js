// Job: the Play screen's Words choice (spanish Req 2): English or Español for Falling words, Four
// corners and Practice, saved at once as the `pack` setting. The hint says what Español needs.
import { PACK_IDS, PACK_LABELS } from "../../packs/registry.js";
import { isValidSetting } from "../../storage/settings.js";
import { el } from "../dom.js";

/** The hint under the choice (spanish copy table). */
export const PACK_HINT =
  "Español needs a layout that types á, ñ, ¿ and ¡, such as US-International.";

/** @param {{ state: { settings: { pack?: string } }, app: { setSetting: Function }, refresh: Function }} ctx */
export function packRow(ctx) {
  const picked = ctx.state.settings.pack ?? "general";
  return el("p", { class: "set-row picker-pack" }, [
    el("label", { for: "pick-pack" }, "Words "),
    el(
      "select",
      {
        id: "pick-pack",
        "data-focus-id": "pick-pack",
        "aria-describedby": "pick-pack-hint",
        onChange: (e) => {
          if (isValidSetting("pack", e.target.value)) ctx.app.setSetting("pack", e.target.value);
          else ctx.refresh(); // put the choice back to what is saved
        },
      },
      PACK_IDS.map((id) => el("option", { value: id, selected: id === picked }, PACK_LABELS[id])),
    ),
    el("span", { id: "pick-pack-hint", class: "hint" }, ` ${PACK_HINT}`),
  ]);
}
