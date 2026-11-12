// About (shell Req 7.2): the PRD G2 About list. Links open in a new tab with rel="noopener"
// (dom.js adds it). The Tally feedback link is missing on purpose: the form has no URL yet, and
// a link with no target would be worse than none. Add it to LINKS when Shara has the address.
import { el } from "../dom.js";

/** Where to find the maker and the code. */
export const LINKS = Object.freeze([
  { label: "clewlabs.org", href: "https://clewlabs.org" },
  { label: "X: @clewlabs", href: "https://x.com/clewlabs" },
  { label: "dev.to/earlgreyhot1701d", href: "https://dev.to/earlgreyhot1701d" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/la-shara-cordero-a0017a11",
  },
  { label: "GitHub: the source code", href: "https://github.com/earlgreyhot1701D/dead-keys" },
  { label: "Buy Me a Coffee", href: "https://buymeacoffee.com/earlgreyhot1701d" },
]);

/** Font licenses ship with the site, so these open on our own origin. */
export const FONT_LICENSES = Object.freeze([
  { label: "JetBrains Mono license", href: "/licenses/JetBrainsMono-OFL.txt" },
  { label: "Roboto Condensed license", href: "/licenses/RobotoCondensed-OFL.txt" },
]);

/** Plain paragraphs, in the order they appear. */
export const ABOUT_PARAGRAPHS = Object.freeze([
  "A dead key types nothing until you press the next one. Yours have been asleep. Let's wake them up.",
  "Built with Kiro for Kiroween 2026. Dead Keys is open source under the MIT license.",
  "The typing games that taught a generation are what this one grew from: MasterType (1981) and Type Attack (1982).",
  "Dead Keys also grew from Office Keys, my first Lovable build (August 2025), a typing practice app. This game carries over its ideas, not its code.",
  "The English word list comes from top-english-wordlists (github.com/david47k/top-english-wordlists), built from Google Books Ngrams, 1950 to 2012, under CC BY 3.0.",
  "Dead Keys uses JetBrains Mono and Roboto Condensed, both under the SIL Open Font License.",
  "Dead Keys is for a QWERTY keyboard in this version.",
]);

const link = ({ label, href }) =>
  el("li", {}, el("a", { href, target: href.startsWith("/") ? null : "_blank" }, label));

/** @type {import("../router.js").Screen} */
export const aboutScreen = {
  id: "about",
  title: "About",
  render(ctx) {
    return el("main", { id: "main", class: "prose-main" }, [
      el("h1", {}, "About"),
      el(
        "div",
        { class: "prose" },
        ABOUT_PARAGRAPHS.map((p) => el("p", {}, p)),
      ),
      el("h2", {}, "Links"),
      el("ul", { class: "plain-list" }, [...LINKS, ...FONT_LICENSES].map(link)),
      el("div", { class: "actions" }, [
        el("button", { type: "button", class: "btn", onClick: () => ctx.back() }, "Back"),
      ]),
    ]);
  },
};
