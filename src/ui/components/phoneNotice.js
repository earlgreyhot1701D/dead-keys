// The one-line notice for visitors who probably have no keyboard (shell Req 1.5, design 5). Menus
// still work. The wording is approved and sits in the shell design's copy table.

/** The wording. Says plainly that a keyboard is needed, and what the visitor can still do. */
export const PHONE_NOTICE =
  "Dead Keys needs a physical keyboard to play. You can still look around the menus here. To type, open this page on a computer.";

/** Narrower than this and the game does not fit (design decision 5). */
export const MIN_WIDTH = 900;

/**
 * Should the phone notice show? Yes for a touch-only device that has not yet been used with a
 * hardware keyboard, and for any viewport too narrow for the game.
 * @param {{ coarse: boolean, width: number, keyboardSeen: boolean }} o
 */
export function showPhoneNotice({ coarse, width, keyboardSeen }) {
  return (
    (coarse === true && keyboardSeen !== true) || (Number.isFinite(width) && width < MIN_WIDTH)
  );
}

/**
 * Was this key press from a hardware keyboard? A phone's on-screen keyboard reports the key as
 * "Unidentified" (keyCode 229), a real key never does. Not perfect, and only ever hides a notice.
 * @param {{ key?: string, keyCode?: number, isTrusted?: boolean }} e
 */
export function isHardwareKey(e) {
  return (
    e?.isTrusted !== false &&
    typeof e?.key === "string" &&
    e.key !== "Unidentified" &&
    e.keyCode !== 229
  );
}

/** @param {Function} mk The `el` function. */
export function renderPhoneNotice(mk) {
  return mk("p", { class: "phone-notice panel", "data-phone-notice": true }, PHONE_NOTICE);
}
