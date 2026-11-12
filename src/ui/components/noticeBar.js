// The notice line and its button (shell Req 3.3). The wording and button label come from
// storage/notices.js, the approved copy; this file adds only what each button does and a
// "Got it" control. The slot it is drawn in is a polite live region (role="status"), so a screen
// reader speaks a notice when it appears.
import { NOTICES } from "../../storage/notices.js";

/** The quiet button on every notice (approved copy; it replaced "Dismiss"). */
export const QUIET_BUTTON = "Got it";

/**
 * What each notice's button does. `retry` repeats whichever export or download just failed.
 * Every notice id must be here; a test checks it against NOTICES.
 */
export const ACTIONS = Object.freeze({
  blocked: "exportBackup",
  corrupt: "downloadOldData",
  newer: "reload",
  saveFailed: "exportBackup",
  importFailed: "goSettings", // import lives on the Settings screen
  otherTab: "reload",
  exportFailed: "retry",
});

/**
 * Run a notice's button.
 * @param {string} id A notice id.
 * @param {{ app: any, go: (screen: string) => void }} env
 * @returns {string} The action that ran.
 * @throws {RangeError} For an id with no action.
 */
export function runAction(id, { app, go }) {
  // hasOwn, so an inherited name such as "constructor" is never taken for a notice
  if (!Object.hasOwn(ACTIONS, id)) throw new RangeError(`notice "${id}" has no action`);
  const action = ACTIONS[id];
  if (action === "goSettings") go("settings");
  else if (action === "retry")
    (app.state.retry === "downloadOldData" ? app.downloadOldData : app.exportBackup).call(app);
  else app[action]();
  return action;
}

/**
 * The notice, as a node: the line, its button, and Dismiss.
 * @param {Function} mk The `el` function.
 * @param {string} id
 * @param {{ run: (id: string) => void, dismiss: () => void }} handlers
 * @returns {HTMLElement}
 * @throws {RangeError} For an id that is not an approved notice.
 */
export function renderNotice(mk, id, { run, dismiss }) {
  if (!Object.hasOwn(NOTICES, id)) throw new RangeError(`"${id}" is not a notice`);
  const notice = NOTICES[id];
  return mk("div", { class: "notice panel", "data-notice": id }, [
    mk("p", { class: "notice-line" }, notice.line),
    mk("div", { class: "notice-actions" }, [
      mk("button", { type: "button", class: "btn", onClick: () => run(id) }, notice.button),
      mk("button", { type: "button", class: "btn btn-quiet", onClick: dismiss }, QUIET_BUTTON),
    ]),
  ]);
}
