// Job: register the service worker (public/sw.js) so Dead Keys can be installed and played
// offline (PWA block). Not on this machine (dev, e2e) unless asked, where a cached copy would hide
// fresh code. Never throws: an app that can't install still plays.
import { countsHere } from "../analytics/analytics.js";

export const SW_URL = "/sw.js";

/**
 * @param {{ serviceWorker?: { register: (url: string) => Promise<unknown> } }} nav
 * @param {string} host location.hostname
 * @param {boolean} [force] Register on a local host too (the PWA e2e uses it).
 * @returns {boolean} Whether registration was started.
 */
export function registerSw(nav, host, force = false) {
  try {
    if (!nav?.serviceWorker || !(force || countsHere(host))) return false;
    nav.serviceWorker.register(SW_URL).catch(() => {}); // offline play is a bonus, not a need
    return true;
  } catch {
    return false;
  }
}
