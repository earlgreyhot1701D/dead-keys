// The privacy card (shell Req 4; PRD G9). Shown before the menu on first launch, and again from
// Settings. The text is the PRD's, word for word, and a test reads the PRD to keep it that way.
// Drawn in the locked mock's panel system (no mock screen of its own).
import { panelHead, termPage } from "../components/chrome.js";
import { el } from "../dom.js";

export const PRIVACY_PARAGRAPHS = Object.freeze([
  "Your progress is saved only in this browser. There's no account. If you clear your browser data, your progress is gone, so export a backup anytime from Settings.",
  "Two things leave your browser. When AI drills are on, we send which keys you miss and your recent speed, nothing else, so the AI can write practice lines for you. You can turn AI drills off in Settings. We also count page visits with Vercel Web Analytics, which uses no cookies and can't identify you. Your typing is never part of it.",
]);

/** @type {import("../router.js").Screen} */
export const privacyScreen = {
  id: "privacy",
  title: "Privacy",
  render(ctx) {
    const first = !ctx.state.settings.privacySeen;
    const action = first
      ? el(
          "button",
          {
            type: "button",
            class: "btn btn-term btn-primary btn-big",
            onClick: () => {
              ctx.app.dismissPrivacy(); // remembered in settings (Req 4.2)
              ctx.replace("menu"); // Escape from the menu skips the card
            },
          },
          "Continue",
        )
      : null; // from Settings, the header's Back is the way out
    return termPage(ctx, {
      badgeText: "NOTICE",
      flavor: "WHAT STAYS, WHAT LEAVES",
      title: "Privacy",
      home: !first,
      body: el("main", { id: "main", class: "term-main page-narrow" }, [
        el("section", { class: "term-panel prose-panel", "aria-label": "Privacy card" }, [
          panelHead(el("span", { class: "panel-title" }, "FIRST-LAUNCH CARD"), null),
          ...PRIVACY_PARAGRAPHS.map((p) => el("p", {}, p)),
          action ? el("div", { class: "actions" }, [action]) : null,
        ]),
      ]),
    });
  },
};
