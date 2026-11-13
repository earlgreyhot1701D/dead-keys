// Job: the "What's this?" buttons and their dialog (PRD G2 glossary taps; lessons-8b Req 8).
// A small text button after a term opens a native <dialog>: the term, plain words, and Close.
// Escape or Close puts focus back on the button. Words from the lessons-8b copy table.
import { el } from "../dom.js";

export const WHATS_THIS = "What's this?";
export const CLOSE = "Close";
/** The four terms PRD G2 names, and their words (lessons-8b design copy table). */
export const GLOSSARY = Object.freeze({
  "home row":
    "The middle row of letters: A S D F for your left hand, J K L ; for your right. Your fingers rest there and come back after each reach.",
  WPM: "Words per minute. Every five characters you type correctly count as one word, and time spent paused is left out.",
  accuracy:
    "The keys you got right out of every key you pressed. Backspace doesn't count as a key.",
  "dead key":
    "A key that types nothing until you press the next one. On US-International, ' then e types é.",
});

const slug = (term) => term.toLowerCase().replace(/[^a-z]+/g, "-");

/**
 * The dialog for one term. Tested under node; `openGlossary` puts it on the page.
 * @param {Function} mk The `el` function.
 * @param {string} term
 * @param {() => void} onClose
 */
export function buildGlossary(mk, term, onClose) {
  const id = `gl-${slug(term)}`;
  return mk(
    "dialog",
    {
      id,
      class: "confirm panel glossary",
      "aria-labelledby": `${id}-title`,
      "aria-describedby": `${id}-text`,
      onCancel: (e) => {
        e.preventDefault?.();
        onClose();
      },
      onKeydown: (e) => {
        if (e.key === "Escape") e.stopPropagation?.(); // not also the router's "go back"
      },
    },
    [
      mk("h2", { id: `${id}-title` }, term),
      mk("p", { id: `${id}-text` }, GLOSSARY[term]),
      mk("div", { class: "confirm-actions" }, [
        mk("button", { type: "button", class: "btn", autofocus: true, onClick: onClose }, CLOSE),
      ]),
    ],
  );
}

/** Open a term's dialog; closing it removes it and puts focus back on the opener. */
export function openGlossary(doc, term) {
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
    opener?.focus?.();
  };
  dialog = buildGlossary(el, term, close);
  doc.body.append(dialog);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  return { close };
}

/**
 * The "What's this?" button for a term. Its accessible name names the term.
 * @param {string} term One of GLOSSARY's keys.
 */
export function whatsThis(term) {
  if (!GLOSSARY[term]) throw new RangeError(`no glossary entry for "${term}"`);
  return el(
    "button",
    {
      type: "button",
      class: "link-btn glossary-btn",
      "aria-label": `${WHATS_THIS.slice(0, -1)}: ${term}`,
      onClick: (e) => {
        e?.stopPropagation?.();
        openGlossary(e?.currentTarget?.ownerDocument ?? globalThis.document, term);
      },
    },
    WHATS_THIS,
  );
}
