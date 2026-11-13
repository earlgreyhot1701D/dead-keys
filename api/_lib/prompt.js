// The drill prompt (ai-drills design: Prompt). Built only from a validated DrillRequest: weak keys
// (single pack-charset letters), their miss rates and the typist's speed. No player text ever.
// Hook H5 runs the golden set when this file is saved.

export const TEMPERATURE = 0.7;
export const MAX_TOKENS = 300;

export const SYSTEM =
  "You write typing practice. Output only plain lines of lowercase English words separated by single spaces, nothing else. No numbers, no punctuation. Up to 8 lines, each at most 80 characters. Every word must be a real common English word. Most words must contain at least one of the target keys.";

/**
 * The user message: the target keys with their miss rates, and the speed. Nothing else.
 * @param {{ weakKeys: { key: string, rate: number }[], recentWpm: number }} req A valid DrillRequest.
 * @returns {string} For example "Target keys: q 0.50, z 0.30\nSpeed: about 24 words per minute".
 */
export function userMessage(req) {
  const keys = req.weakKeys.map((k) => `${k.key} ${k.rate.toFixed(2)}`).join(", ");
  return `Target keys: ${keys}\nSpeed: about ${Math.round(req.recentWpm)} words per minute`;
}

/**
 * The whole prompt for one call.
 * @param {{ weakKeys: { key: string, rate: number }[], recentWpm: number }} req
 * @returns {{ system: string, user: string, temperature: number, maxTokens: number }}
 */
export const buildPrompt = (req) => ({
  system: SYSTEM,
  user: userMessage(req),
  temperature: TEMPERATURE,
  maxTokens: MAX_TOKENS,
});
