// The progress screen (shell Req 6), laid out as the locked mock's screen 6: the keyboard heat
// map with its legend and words on the left, the diagnosis below it; the speed line, personal
// bests and weak keys on the right. Reads only; never saves (the footer's backup link exports).
import { diagnose } from "../../engine/diagnose.js";
import { heatmap } from "../../engine/heatmap.js";
import { MIN_KEY_ATTEMPTS } from "../../engine/progressConfig.js";
import { termPage } from "../components/chrome.js";
import { bestsBlock, diagnosisPanel, keysPanel, weakPanel } from "../components/progressPanels.js";
import { renderSpeedPanel } from "../components/speedChart.js";
import { el } from "../dom.js";

export {
  EMPTY_LINE,
  EVEN_LINE,
  FEW_LINE,
  keyList,
  MODE_NAMES,
  NO_BESTS_LINE,
  NO_GROUP_LINE,
  setOn,
} from "../components/progressText.js";

/** @type {import("../router.js").Screen} */
export const progressScreen = {
  id: "progress",
  title: "Progress",
  render(ctx) {
    const { keys = [], bests = {}, rounds = [] } = ctx.state.progress ?? {};
    const d = diagnose(keys);
    const heat = heatmap(keys);
    const exportBackup = () => {
      if (ctx.app?.exportBackup?.().ok) ctx.announce?.("Backup downloaded.");
    };
    return termPage(ctx, {
      badgeText: "DIAGNOSTIC LOG",
      flavor: "KEYBOARD HEAT MAP",
      title: "Progress",
      meta: `ROUNDS: ${rounds.length} \u00a0•\u00a0 A KEY IS COLORED AFTER ${MIN_KEY_ATTEMPTS} TRIES`,
      body: el("main", { id: "main", class: "term-main progress-main" }, [
        el("div", { class: "progress-left" }, [
          keysPanel(keys, rounds.length),
          diagnosisPanel(d, () => ctx.go("howWeCount"), heat),
        ]),
        el("div", { class: "progress-right" }, [
          renderSpeedPanel(rounds, [bestsBlock(bests)]),
          weakPanel(d.weakKeys, heat, ctx.announce),
        ]),
      ]),
      footerExtra: [
        el(
          "button",
          { type: "button", class: "link-btn", onClick: exportBackup },
          "Download backup",
        ),
      ],
    });
  },
};
