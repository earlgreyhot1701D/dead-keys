// An on-page confirm (shell Req 5.3: Clear and Import ask first). It is a native <dialog> opened
// with showModal(), so the browser traps focus, makes the page behind inert, and sends Escape to
// the dialog. Cancel has focus when it opens (these are destructive choices). Escape cancels, and
// does not also send the player back a screen. `buildConfirm` makes the node and is tested under
// node; `openConfirm` puts it on the page and is covered by the browser flows.

/** Added to the Clear confirm when a newer-version save is present (the approved copy). */
export const NEWER_SAVE_WARNING =
  "This also deletes progress saved by a newer version of Dead Keys.";

/**
 * The lines of a confirm, with the newer-save warning added when it applies.
 * @param {string[]} lines
 * @param {boolean} newerSave
 */
export function confirmLines(lines, newerSave) {
  return newerSave ? [...lines, NEWER_SAVE_WARNING] : [...lines];
}

/**
 * @param {Function} mk The `el` function.
 * @param {object} o
 * @param {string} [o.id]
 * @param {string} o.title
 * @param {string[]} o.lines
 * @param {string} o.confirmLabel
 * @param {string} [o.cancelLabel]
 * @param {() => void} o.onConfirm
 * @param {() => void} o.onCancel
 */
export function buildConfirm(
  mk,
  { id = "confirm", title, lines, confirmLabel, cancelLabel = "Cancel", onConfirm, onCancel },
) {
  const titleId = `${id}-title`;
  const textId = `${id}-text`;
  return mk(
    "dialog",
    {
      id,
      class: "confirm panel",
      "aria-labelledby": titleId,
      "aria-describedby": textId,
      // The browser's own Escape: stay in charge of closing, so focus can go back to the opener.
      onCancel: (e) => {
        e.preventDefault?.();
        onCancel();
      },
      // Keep Escape from also reaching the router's "go back".
      onKeydown: (e) => {
        if (e.key === "Escape") e.stopPropagation?.();
      },
    },
    [
      mk("h2", { id: titleId }, title),
      mk(
        "div",
        { id: textId },
        lines.map((line) => mk("p", {}, line)),
      ),
      mk("div", { class: "confirm-actions" }, [
        mk(
          "button",
          { type: "button", class: "btn", autofocus: true, onClick: onCancel },
          cancelLabel,
        ),
        mk("button", { type: "button", class: "btn btn-danger", onClick: onConfirm }, confirmLabel),
      ]),
    ],
  );
}

/**
 * Show a confirm. Closing it (any way) removes it and returns focus to what had it before.
 * Only one can be open; a second call returns null.
 * @returns {{ close: () => void } | null}
 */
export function openConfirm(doc, mk, opts) {
  if (doc.querySelector("dialog[open]")) return null;
  const opener = doc.activeElement;
  let dialog = null;
  const close = () => {
    try {
      dialog?.close?.();
    } catch {
      // already closed
    }
    dialog?.remove();
    try {
      opener?.focus?.();
    } catch {
      // the opener is gone; focus stays where the browser puts it
    }
  };
  dialog = buildConfirm(mk, {
    ...opts,
    onConfirm: () => {
      close();
      opts.onConfirm?.();
    },
    onCancel: () => {
      close();
      opts.onCancel?.();
    },
  });
  doc.body.append(dialog);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", ""); // an old browser: no focus trap, but still usable
  return { close };
}
