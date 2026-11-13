// The usage ledger (PRD G8; ai-drills Req 2.7): one JSON line per call to the function log, so the
// first week's real numbers can replace the usage guesses. Only these fields: no weak keys, no IP,
// no visitor id, no lines.

/** The fields of a ledger line, in order. */
export const FIELDS = Object.freeze([
  "at",
  "inputTokens",
  "outputTokens",
  "stopReason",
  "ms",
  "result",
]);

/**
 * @param {{ at: number, inputTokens?: number, outputTokens?: number, stopReason?: string|null, ms?: number, result: string }} e
 * @returns {string} One line of JSON with exactly FIELDS (anything else passed in is dropped).
 */
export function ledgerLine(e) {
  return JSON.stringify({
    at: new Date(e.at).toISOString(),
    inputTokens: e.inputTokens ?? 0,
    outputTokens: e.outputTokens ?? 0,
    stopReason: e.stopReason ?? null,
    ms: e.ms ?? 0,
    result: e.result,
  });
}

/** Write one ledger line; `log` is console.log on Vercel (its function log). */
export const writeLedger = (e, log = console.log) => log(`ledger ${ledgerLine(e)}`);
