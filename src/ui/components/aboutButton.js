// The About button in the top right of the title and main menu headers, where people look for it
// (Shara, Nov 13). The menu list keeps its About item too.
import { el } from "../dom.js";

/** @param {{ go: (id: string) => void }} ctx */
export const aboutButton = (ctx) =>
  el(
    "button",
    { type: "button", class: "btn btn-term header-about", onClick: () => ctx.go("about") },
    "About",
  );
