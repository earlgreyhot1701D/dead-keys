// Job: load Vercel Web Analytics on Vercel hosts only, page views only.
// Vercel Web Analytics, page views only (PRD G9; the Privacy page already says so). One script
// tag, same origin, no cookies, no custom events: nothing about typing is ever passed to it. Not
// loaded on this machine (dev, e2e), where the path does not exist. Turned on in the Vercel
// dashboard by Shara; until then the script 404s quietly on Vercel and nothing is counted.

/** The plain-HTML path from Vercel's quickstart. If the dashboard shows another path, swap it. */
export const ANALYTICS_SRC = "/_vercel/insights/script.js";

/** Hosts where nothing is counted. */
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|.*\.localhost|.*\.test)$/;

/**
 * Should page views be counted on this host?
 * @param {string} host location.hostname
 */
export const countsHere = (host) => typeof host === "string" && host !== "" && !LOCAL.test(host);

/**
 * Add the analytics script once. Never throws: analytics must not stop the game.
 * @param {Document} doc
 * @param {string} host
 * @returns {boolean} Whether the script was added.
 */
export function loadAnalytics(doc, host) {
  try {
    if (!countsHere(host)) return false;
    if (doc.querySelector(`script[src="${ANALYTICS_SRC}"]`)) return false;
    const s = doc.createElement("script");
    s.defer = true;
    s.src = ANALYTICS_SRC;
    doc.head.appendChild(s);
    return true;
  } catch {
    return false;
  }
}
