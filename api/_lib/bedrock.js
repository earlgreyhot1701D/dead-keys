// The only file that talks to AWS (PRD G3; ai-drills Req 2.4): one Bedrock Converse call to Nova
// Micro. On Vercel there are no AWS keys: the request's short-lived Vercel OIDC token is traded for
// temporary credentials on the role in AWS_ROLE_ARN (ai-drills Req 6, Nov 13). Locally (the golden
// set) the default AWS profile is used. Nothing here prints or stores a token or a credential.
// Tests pass a fake `send`, so no test reaches AWS.
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { fromWebToken } from "@aws-sdk/credential-provider-web-identity";

export const MODEL_ID = "us.amazon.nova-micro-v1:0";
/** Give up on a call after this long, so a hung call never runs to the function's limit (Req 2.8). */
export const TIMEOUT_MS = 3500;

let local = null; // the local client (default AWS profile), made on the first local call

/**
 * The client for one call: with a Vercel OIDC token and AWS_ROLE_ARN, temporary role credentials
 * (the token lives about two hours, so a new client per call); otherwise the default chain.
 * @param {string|null} token The request's `x-vercel-oidc-token`, never logged.
 */
export function clientFor(token, env = process.env) {
  const region = env.AWS_REGION || "us-east-1";
  if (token && env.AWS_ROLE_ARN) {
    const credentials = fromWebToken({
      roleArn: env.AWS_ROLE_ARN,
      webIdentityToken: token,
      roleSessionName: "dead-keys-drill",
      clientConfig: { region },
    });
    return new BedrockRuntimeClient({ region, credentials });
  }
  local ??= new BedrockRuntimeClient({ region });
  return local;
}

const realSend = (command, options, token) => clientFor(token).send(command, options);

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
 * @param {{ send?: (command: ConverseCommand, options: { abortSignal: AbortSignal }, token?: string|null) => Promise<object>, now?: () => number, timeoutMs?: number, token?: string|null }} [o]
 * @returns {Promise<{ text: string, stopReason: string|null, usage: { inputTokens: number, outputTokens: number }, ms: number }>}
 * @throws {BedrockTimeout} After timeoutMs; otherwise whatever the SDK throws (both become a quiet fallback).
 */
export async function converse(
  prompt,
  { send = realSend, now = Date.now, timeoutMs = TIMEOUT_MS, token = null } = {},
) {
  const start = now();
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), timeoutMs);
  let out;
  try {
    out = await send(
      new ConverseCommand(converseInput(prompt)),
      { abortSignal: abort.signal },
      token,
    );
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
