// The privacy card (shell Req 4; PRD G9). Shown before the menu on first launch, and again from
// Settings. The text is the PRD's, word for word, and a test reads the PRD to keep it that way.
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
    return el("main", { id: "main", class: "privacy-main" }, [
      el("h1", {}, "Privacy"),
      el(
        "div",
        { class: "panel prose" },
        PRIVACY_PARAGRAPHS.map((p) => el("p", {}, p)),
      ),
      el("div", { class: "actions" }, [
        first
          ? el(
              "button",
              {
                type: "button",
                class: "btn",
                onClick: () => {
                  ctx.app.dismissPrivacy(); // remembered in settings (Req 4.2)
                  ctx.go("menu");
                },
              },
              "Continue",
            )
          : el("button", { type: "button", class: "btn", onClick: () => ctx.back() }, "Back"),
      ]),
    ]);
  },
};
