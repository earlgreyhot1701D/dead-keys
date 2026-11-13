// Job: the share dialog's three jobs, Download PNG, Copy text and Share, each with the browser
// API passed in so the logic runs under node --test. Everything happens in the browser: the PNG
// is drawn here and saved here. Nothing is uploaded (share Req 3).

/** The PNG's file name: dead-keys-42wpm.png. */
export const fileName = (d) => `dead-keys-${d.wpm}wpm.png`;

/** How long the file's address stays alive after the click (as download.js). */
const REVOKE_DELAY_MS = 10_000;

/** What the browser provides. */
export const shareApi = () => ({
  doc: document,
  nav: navigator,
  File,
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
  later: (fn, ms) => setTimeout(fn, ms),
});

/** The canvas as a PNG Blob, or null when the browser can't make one. */
export const toPng = (canvas) =>
  new Promise((done) => {
    try {
      canvas.toBlob((b) => done(b ?? null), "image/png");
    } catch {
      done(null); // a tainted or zero-size canvas
    }
  });

/** Save the card. @returns {Promise<boolean>} */
export async function downloadPng(canvas, d, api = shareApi()) {
  const blob = await toPng(canvas);
  if (!blob) return false;
  const url = api.createObjectURL(blob);
  try {
    const link = api.doc.createElement("a");
    link.href = url;
    link.download = fileName(d);
    link.rel = "noopener";
    api.doc.body.append(link);
    link.click();
    link.remove();
  } catch {
    api.revokeObjectURL(url);
    return false;
  }
  api.later(() => api.revokeObjectURL(url), REVOKE_DELAY_MS);
  return true;
}

/** Put the share line on the clipboard. @returns {Promise<boolean>} */
export async function copyText(text, api = shareApi()) {
  try {
    await api.nav.clipboard.writeText(text);
    return true;
  } catch {
    return false; // no clipboard (http, an old browser, or permission refused)
  }
}

/** True when this browser can hand a PNG to the system share sheet (most phones). */
export function canShareFiles(api = shareApi()) {
  try {
    const probe = new api.File([""], "x.png", { type: "image/png" });
    return typeof api.nav.share === "function" && !!api.nav.canShare?.({ files: [probe] });
  } catch {
    return false;
  }
}

/**
 * Open the system share sheet with the card and the line.
 * @returns {Promise<"shared" | "cancelled" | "failed">}
 */
export async function shareCard(canvas, d, text, api = shareApi()) {
  const blob = await toPng(canvas);
  if (!blob) return "failed";
  try {
    const file = new api.File([blob], fileName(d), { type: "image/png" });
    await api.nav.share({ files: [file], text });
    return "shared";
  } catch (err) {
    return err?.name === "AbortError" ? "cancelled" : "failed";
  }
}
