// The only file that talks to AWS (PRD G3; ai-drills Req 2.4): one Bedrock Converse call to Nova
// Micro. Credentials and region come from the environment (Vercel env vars Shara enters); nothing
// here reads, prints or stores them. Tests pass a fake `send`, so no test reaches AWS.
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

export const MODEL_ID = "us.amazon.nova-micro-v1:0";
/** Give up on a call after this long, so a hung call never runs to the function's limit (Req 2.8). */
export const TIMEOUT_MS = 3500;

let client = null; // one client per instance, made on the first call
const realSend = (command, options) => {
  client ??= new BedrockRuntimeClient({});
  return client.send(command, options);
};

/** Thrown when the call took longer than TIMEOUT_MS; the route answers { error: "timeout" }. */
export class BedrockTimeout extends Error {
  name = "BedrockTimeout";
}

/**
 * The Converse input for a prompt (see prompt.js).
 * @param {{ system: string, user: string, temperature: number, maxTokens: number }} p
 */
export const converseInput = (p) => ({
  modelId: MODEL_ID,
  system: [{ text: p.system }],
  messages: [{ role: "user", content: [{ text: p.user }] }],
  inferenceConfig: { maxTokens: p.maxTokens, temperature: p.temperature },
});

/**
 * Ask the model once.
 * @param {{ system: string, user: string, temperature: number, maxTokens: number }} prompt
 * @param {{ send?: (command: ConverseCommand, options: { abortSignal: AbortSignal }) => Promise<object>, now?: () => number, timeoutMs?: number }} [o]
 * @returns {Promise<{ text: string, stopReason: string|null, usage: { inputTokens: number, outputTokens: number }, ms: number }>}
 * @throws {BedrockTimeout} After timeoutMs; otherwise whatever the SDK throws (both become a quiet fallback).
 */
export async function converse(
  prompt,
  { send = realSend, now = Date.now, timeoutMs = TIMEOUT_MS } = {},
) {
  const start = now();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  let out;
  try {
    out = await send(new ConverseCommand(converseInput(prompt)), { abortSignal: abort.signal });
  } catch (err) {
    throw abort.signal.aborted ? new BedrockTimeout(`no answer in ${timeoutMs} ms`) : err;
  } finally {
    clearTimeout(timer);
  }
  const parts = out?.output?.message?.content ?? [];
  return {
    text: parts.map((c) => (typeof c?.text === "string" ? c.text : "")).join(""),
    stopReason: typeof out?.stopReason === "string" ? out.stopReason : null,
    usage: {
      inputTokens: Number(out?.usage?.inputTokens) || 0,
      outputTokens: Number(out?.usage?.outputTokens) || 0,
    },
    ms: now() - start,
  };
}
