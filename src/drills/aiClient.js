// The browser side of AI drills (ai-drills Req 1, 3.1 to 3.3; PRD G8): the DrillRequest (weak keys,
// their miss rates, recent speed: nothing else), one POST with a 4-second timeout inside
// try/catch, the answer validated again here, and its words. Any failure returns null, and the
// caller runs the built-in drill. The app's only fetch (here, per the ai-drills design).
import { validate } from "../../contract/validate.js";
import { aiWords } from "./aiWords.js";
import { DRILL_MIN_WORDS, missRates } from "./weights.js";

export const TIMEOUT_MS = 4000;
export const ROUTE = "/api/drill";

/**
 * The request for these weak keys, or null when none can be sent (AI never sees other keys).
 * @param {{ id: string, charset: string }} pack
 * @param {string[]} weakKeys Progress's up-to-6 weak keys, worst first.
 * @param {{ key: string, attempts: number, misses: number }[]} keyStats
 * @param {{ wpm: number }[]} rounds Saved rounds, oldest first; the last one's speed is sent.
 * @returns {{ packId: string, weakKeys: { key: string, rate: number }[], recentWpm: number } | null}
 */
export function drillRequest(pack, weakKeys, keyStats, rounds) {
  const rates = missRates(keyStats);
  const keys = (weakKeys ?? [])
    .filter((k) => pack.charset.includes(k) && k !== " " && rates.has(k)) // the contract's charset rule
    .slice(0, 6)
    .map((key) => ({ key, rate: Math.round(rates.get(key) * 100) / 100 }));
  if (keys.length === 0) return null;
  const wpm = Number(rounds?.at(-1)?.wpm);
  const recentWpm = Number.isFinite(wpm) ? Math.min(250, Math.max(0, Math.round(wpm))) : 0;
  const req = { packId: pack.id, weakKeys: keys, recentWpm };
  return validate("DrillRequest", req, { charset: pack.charset }).status === "valid" ? req : null;
}

/**
 * Ask the route for a drill. Never throws: null on any error, timeout, cap, refusal or a bad
 * answer, and when there are fewer than DRILL_MIN_WORDS words.
 * @param {object} req From drillRequest.
 * @param {string} charset The pack charset.
 * @param {{ fetch?: typeof fetch, timeoutMs?: number }} [o]
 * @returns {Promise<string[]|null>} The drill's words.
 */
export async function fetchAiWords(
  req,
  charset,
  { fetch = globalThis.fetch, timeoutMs = TIMEOUT_MS } = {},
) {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  try {
    const res = await fetch(ROUTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal: abort.signal,
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (validate("DrillResponse", body, { charset: `${charset} ` }).status !== "valid") return null;
    const words = aiWords(body.lines, charset);
    return words.length >= DRILL_MIN_WORDS ? words : null;
  } catch {
    return null; // offline, timed out, not JSON: the built-in drill runs instead
  } finally {
    clearTimeout(timer);
  }
}
