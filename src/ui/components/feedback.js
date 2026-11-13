// The feedback form (Block 16): a Tally form that asks no name and no email. Linked from About
// and from results. Opens in a new tab; dom.js adds rel="noopener noreferrer".
import { el } from "../dom.js";

export const FEEDBACK_URL = "https://tally.so/r/8NaVJP";
export const FEEDBACK_LABEL = "Tell us how it felt (a short form)";

/**
 * The link, ready to place.
 * @param {string} [cls] A class for the link.
 */
export const feedbackLink = (cls = "") =>
  el("a", { href: FEEDBACK_URL, target: "_blank", class: cls || null }, FEEDBACK_LABEL);
