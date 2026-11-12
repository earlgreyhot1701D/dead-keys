// "How we count" (shell Req 7.1): plain words, every number from the engine's config. The words
// are built in howWeCountText.js; this file only draws them, in the locked mock's panel system.
import { panelHead, termPage } from "../components/chrome.js";
import { el } from "../dom.js";
import { buildSections } from "./howWeCountText.js";

export const SOURCE_URL = "https://github.com/earlgreyhot1701D/dead-keys";
export const SOURCE_LABEL = "Read the source code";

/** @type {import("../router.js").Screen} */
export const howWeCountScreen = {
  id: "howWeCount",
  title: "How we count",
  render(ctx) {
    return termPage(ctx, {
      badgeText: "RULEBOOK",
      flavor: "THE NUMBERS, IN PLAIN WORDS",
      title: "How we count",
      body: el("main", { id: "main", class: "term-main page-grid" }, [
        ...buildSections().map((s) =>
          el("section", { class: "term-panel prose-panel", "aria-labelledby": `hwc-${s.id}` }, [
            panelHead(el("h2", { id: `hwc-${s.id}` }, s.heading), null),
            ...s.paragraphs.map((p) => el("p", {}, p)),
          ]),
        ),
        el(
          "p",
          { class: "source-line" },
          el("a", { href: SOURCE_URL, target: "_blank" }, SOURCE_LABEL),
        ),
      ]),
    });
  },
};
