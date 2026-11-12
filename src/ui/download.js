// Save a text file to the player's disk: a Blob, a temporary link, a click. The browser API comes
// in as an argument so the logic runs under node --test. Nothing is sent anywhere.

const NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}\.(json|txt)$/;

/** What the browser provides. */
export const browserApi = () => ({
  Blob,
  createObjectURL: (blob) => URL.createObjectURL(blob),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
  doc: document,
});

/**
 * Download `text` as a file called `name`.
 * @param {string} name Letters, digits, dots, dashes and underscores, ending .json or .txt.
 * @param {string} text
 * @param {ReturnType<typeof browserApi>} [api]
 * @throws {TypeError} For a name that could be a path, or text that is not a string. Anything the
 *   browser refuses also throws; `app.js` turns every throw into the exportFailed notice.
 */
export function downloadText(name, text, api = browserApi()) {
  if (!NAME.test(name)) throw new TypeError(`"${name}" is not a safe file name`);
  if (typeof text !== "string") throw new TypeError("text must be a string");
  const type = name.endsWith(".json") ? "application/json" : "text/plain";
  const url = api.createObjectURL(new api.Blob([text], { type }));
  try {
    const link = api.doc.createElement("a");
    link.href = url;
    link.download = name;
    link.rel = "noopener";
    api.doc.body.append(link);
    try {
      link.click();
    } finally {
      link.remove();
    }
  } finally {
    api.revokeObjectURL(url); // always release the file, even if the click threw
  }
}
