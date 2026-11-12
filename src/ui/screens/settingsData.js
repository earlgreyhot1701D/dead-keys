// The "Your data" half of Settings (shell Req 5.3, 5.4): backup, import, clear, damaged-copy
// download and the privacy card. Split from settings.js at the line cap. Every action goes through
// app.js, which wraps it; a failure is a notice, never a crash. Clear and Import ask first.
import { MAX_IMPORT_BYTES } from "../../storage/exportImport.js";
import { panelHead } from "../components/chrome.js";
import { confirmLines, openConfirm } from "../components/confirmDialog.js";
import { el } from "../dom.js";

// Approved wording (shell design copy table).
export const CLEAR_TITLE = "Clear all progress?";
export const CLEAR_LINE =
  "This deletes your rounds, heat map, personal bests and milestones from this browser. It can't be undone, so download a backup first if you might want them back.";
export const CLEAR_CONFIRM = "Clear everything";
export const CLEAR_CANCEL = "Keep my progress";
// Approved wording (shell design copy table).
export const IMPORT_TITLE = "Replace your progress?";
export const IMPORT_CONFIRM = "Replace my progress";
export const IMPORT_CANCEL = "Keep what I have";

/** The import preview, as plain lines: what the backup holds, what is here now, what happens. */
export function importLines({ incoming, current }) {
  const n = (count, one, many) => `${count} ${count === 1 ? one : many}`;
  const has = (s) =>
    `${n(s.rounds, "round", "rounds")} and ${n(s.lessonsPassed, "lesson", "lessons")} passed`;
  return [
    `This backup has ${has(incoming)}.`,
    `You have ${has(current)} now.`,
    "Importing replaces what you have in this browser.",
  ];
}

// data-focus-id lets the router put focus back after the screen redraws (a clear or an import).
const button = (label, onClick, extra = "") =>
  el(
    "button",
    { type: "button", class: `btn btn-term ${extra}`.trim(), "data-focus-id": label, onClick },
    label,
  );

/** Start the clear flow: ask first, then clear. */
export function askClear(ctx) {
  openConfirm(document, el, {
    id: "clear",
    title: CLEAR_TITLE,
    lines: confirmLines([CLEAR_LINE], ctx.state.newerSave === true),
    confirmLabel: CLEAR_CONFIRM,
    cancelLabel: CLEAR_CANCEL,
    onConfirm: () => {
      ctx.app.clear();
      ctx.announce("Progress cleared.");
    },
  });
}

/** Read a chosen file (at most one byte past the limit, so a huge file is never loaded). */
async function readFile(file) {
  try {
    return await file.slice(0, MAX_IMPORT_BYTES + 1).text();
  } catch {
    return null; // previewImport treats this as "not a backup file"
  }
}

/** Check the chosen file, then ask before replacing anything. */
export async function chooseFile(ctx, input, status) {
  const file = input.files?.[0];
  if (!file) return;
  const r = ctx.app.previewImport(await readFile(file));
  input.value = ""; // so choosing the same file again still fires
  if (!r.ok) {
    // Shown here; the importFailed notice is what a screen reader hears, so it is said once.
    status.textContent = r.reason;
    return;
  }
  status.textContent = "";
  openConfirm(document, el, {
    id: "import",
    title: IMPORT_TITLE,
    lines: importLines(r),
    confirmLabel: IMPORT_CONFIRM,
    cancelLabel: IMPORT_CANCEL,
    onConfirm: () => {
      if (ctx.app.confirmImport().ok) ctx.announce("Backup imported.");
    },
    onCancel: () => ctx.app.cancelImport(),
  });
}

/** @param {object} ctx The router's ctx. */
export function renderDataSection(ctx) {
  const status = el("p", { id: "import-status", class: "hint" });
  const input = el("input", {
    type: "file",
    id: "import-file",
    "data-focus-id": "import-file",
    accept: ".json,application/json",
    onChange: () => chooseFile(ctx, input, status),
  });
  return el("section", { class: "term-panel", "aria-labelledby": "st-data" }, [
    panelHead(
      el("h2", { id: "st-data" }, "Your data"),
      el("span", { class: "flavor" }, "THIS BROWSER"),
    ),
    el("div", { class: "actions" }, [
      button("Download backup", () => {
        if (ctx.app.exportBackup().ok) ctx.announce("Backup downloaded.");
      }),
      ctx.state.oldData ? button("Download old data", () => ctx.app.downloadOldData()) : null,
      button("Clear all progress", () => askClear(ctx), "btn-danger"),
    ]),
    el("div", { class: "set-row" }, [
      el("label", { for: "import-file" }, "Import a backup"),
      input,
    ]),
    status,
    el("div", { class: "actions" }, [button("Read the privacy card", () => ctx.go("privacy"))]),
  ]);
}
