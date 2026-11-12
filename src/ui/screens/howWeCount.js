// "How we count" (shell Req 7.1): plain words, every number from the engine's config. The words
// are built in howWeCountText.js; this file only draws them.
import { el } from "../dom.js";
import { buildSections } from "./howWeCountText.js";

export const SOURCE_URL = "https://github.com/earlgreyhot1701D/dead-keys";
export const SOURCE_LABEL = "Read the source code";

/** @type {import("../router.js").Screen} */
export const howWeCountScreen = {
  id: "howWeCount",
  title: "How we count",
  render(ctx) {
    return el("main", { id: "main", class: "prose-main" }, [
      el("h1", {}, "How we count"),
      ...buildSections().map((s) =>
        el("section", { "aria-labelledby": `hwc-${s.id}` }, [
          el("h2", { id: `hwc-${s.id}` }, s.heading),
          el(
            "div",
            { class: "prose" },
            s.paragraphs.map((p) => el("p", {}, p)),
          ),
        ]),
      ),
      el("p", {}, el("a", { href: SOURCE_URL, target: "_blank" }, SOURCE_LABEL)),
      el("div", { class: "actions" }, [
        el("button", { type: "button", class: "btn", onClick: () => ctx.back() }, "Back"),
      ]),
    ]);
  },
};
