// Job: the Share card window (share Req 2; mock approved Nov 13). A native <dialog> like the
// confirm: the browser traps focus and sends Escape here, and closing returns focus to the
// opener. `buildShare` makes the node and is tested under node; `openShare` draws the card and
// puts it on the page, covered by the browser flows. The canvas is made with createElement,
// not `el`, since the safe tag list has no canvas; it carries role="img" and the card's words.
import { drawCard, H, W } from "../../share/drawCard.js";
import {
  canShareFiles,
  copyText,
  downloadPng,
  shareApi,
  shareCard,
} from "../../share/shareActions.js";

/** The copy table (share spec). */
export const SHARE_COPY = {
  title: "SHARE CARD",
  note: "Made in your browser. Nothing is uploaded.",
  download: "Download PNG",
  copy: "Copy text",
  share: "Share",
  close: "Close",
  copied: "Copied.",
  copyFailed: "Couldn't copy here. Try Download PNG.",
  saved: "Saved.",
  saveFailed: "Couldn't make the image here.",
  shareFailed: "Couldn't open sharing here. Try Download PNG.",
};

/**
 * @param {Function} mk The `el` function.
 * @param {{ frame: object, status: object, showShare: boolean, onDownload: Function, onCopy: Function, onShare: Function,
 *   onClose: Function }} o
 */
export function buildShare(mk, { frame, status, showShare, onDownload, onCopy, onShare, onClose }) {
  const btn = (label, onClick, cls = "btn", extra = {}) =>
    mk("button", { type: "button", class: cls, onClick, ...extra }, label);
  return mk(
    "dialog",
    {
      id: "share",
      class: "confirm panel share",
      "aria-labelledby": "share-title",
      "aria-describedby": "share-note",
      onCancel: (e) => {
        e.preventDefault?.();
        onClose();
      },
      onKeydown: (e) => {
        if (e.key === "Escape") e.stopPropagation?.(); // not also the router's "go back"
      },
    },
    [
      mk("h2", { id: "share-title" }, SHARE_COPY.title),
      frame, // the canvas goes here
      mk("p", { id: "share-note", class: "share-note" }, SHARE_COPY.note),
      status, // a live line inside the window, since the page behind it is inert
      mk("div", { class: "confirm-actions" }, [
        btn(SHARE_COPY.download, onDownload, "btn btn-primary", { autofocus: true }),
        btn(SHARE_COPY.copy, onCopy),
        showShare ? btn(SHARE_COPY.share, onShare) : null,
        btn(SHARE_COPY.close, onClose),
      ]),
    ],
  );
}

let opening = false;

/** Wait for the app's fonts so the card draws in them, not a fallback. Never blocks for long. */
async function fontsReady(doc) {
  try {
    await Promise.race([
      Promise.all([
        doc.fonts.load('700 200px "Roboto Condensed"'),
        doc.fonts.load('400 26px "JetBrains Mono"'),
      ]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    // no FontFace API: draw with what is there
  }
}

/**
 * Open the window for a card. Only one window can be open; a second call returns null.
 * @param {{ data: object, text: string, alt: string }} card From cardData, shareText, cardAlt.
 * @returns {Promise<{ close: () => void } | null>}
 */
export async function openShare(doc, mk, { data, text, alt }, api = shareApi()) {
  if (opening || doc.querySelector("dialog[open]")) return null;
  opening = true; // a second click while the fonts load opens nothing
  const opener = doc.activeElement;
  const canvas = doc.createElement("canvas");
  Object.assign(canvas, { width: W, height: H });
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", alt);
  let dialog = null;
  const frame = mk("div", { class: "share-frame" });
  const status = mk("p", { class: "share-status", role: "status", "aria-live": "polite" });
  const say = (line) => status.replaceChildren(doc.createTextNode(line));
  const close = () => {
    try {
      dialog?.close?.();
    } catch {
      // already closed
    }
    dialog?.remove();
    opener?.focus?.();
  };
  dialog = buildShare(mk, {
    frame,
    status,
    showShare: canShareFiles(api),
    onDownload: async () =>
      say((await downloadPng(canvas, data, api)) ? SHARE_COPY.saved : SHARE_COPY.saveFailed),
    onCopy: async () =>
      say((await copyText(text, api)) ? SHARE_COPY.copied : SHARE_COPY.copyFailed),
    onShare: async () => {
      if ((await shareCard(canvas, data, text, api)) === "failed") say(SHARE_COPY.shareFailed);
    },
    onClose: close,
  });
  await fontsReady(doc).finally(() => {
    opening = false;
  });
  const g = canvas.getContext?.("2d");
  if (g) drawCard(g, data);
  frame.append(canvas);
  doc.body.append(dialog);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  return { close };
}
