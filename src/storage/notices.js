// The five approved notices (requirements.md, "Notice wording"). Each says what happened (no
// blame), what is still safe, and one thing to do, with a button for it. Storage code returns an
// id; the screen looks up the line and button here and draws them with textContent.

/**
 * @typedef {"blocked"|"corrupt"|"newer"|"saveFailed"|"importFailed"|"otherTab"} NoticeId
 * @typedef {{ id: NoticeId, line: string, button: string }} Notice
 */

const notice = (id, line, button) => Object.freeze({ id, line, button });

/** @type {Readonly<Record<NoticeId, Notice>>} */
export const NOTICES = Object.freeze({
  blocked: notice(
    "blocked",
    "This browser isn't saving progress right now. Private browsing or a browser setting can do this. You can still play. To keep today's rounds, download a backup before you close the tab.",
    "Download backup",
  ),
  corrupt: notice(
    "corrupt",
    "We couldn't read your saved progress, so this is a fresh start. You didn't do anything wrong. We kept a copy of the old data.",
    "Download old data",
  ),
  newer: notice(
    "newer",
    "Your progress was saved by a newer version of Dead Keys, so we left it untouched. Refresh to get the latest version. Until then, today's rounds aren't saved.",
    "Refresh",
  ),
  saveFailed: notice(
    "saveFailed",
    "That round didn't save. Your browser's storage may be full. Everything before it is still safe.",
    "Download backup",
  ),
  importFailed: notice(
    "importFailed",
    "That file couldn't be loaded, so nothing changed. Your current progress is safe. Try a backup downloaded from Dead Keys.",
    "Choose another file",
  ),
  // Added in Block 6; the wording is the copy table in .kiro/specs/shell/design.md.
  otherTab: notice(
    "otherTab",
    "Your progress changed in another Dead Keys tab. To keep both tabs from overwriting each other, this one has stopped saving. Reload to pick up the latest.",
    "Reload",
  ),
});
