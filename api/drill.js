// The AI drill route (PRD G3, G8; ai-drills Req 2). The only Vercel function: POST, JSON, under
// 2 KB, same origin; a valid DrillRequest; the per-visitor limit, then the daily cap; one Nova
// Micro call; the answer checked; one ledger line. Caps and model failures answer 200 with
// { error } so the browser falls back quietly; only the per-visitor limit is a 429. Helpers live
// in api/_lib, which Vercel never serves.
import { validate } from "../contract/validate.js";
import pack from "../packs/general.json" with { type: "json" };
import { checkAnswer } from "./_lib/answer.js";
import { BedrockTimeout, converse } from "./_lib/bedrock.js";
import { writeLedger } from "./_lib/ledger.js";
import { createLimits, visitorId } from "./_lib/limits.js";
import { buildPrompt } from "./_lib/prompt.js";

export const MAX_BODY = 2048;
const limits = createLimits(); // per instance (approximate, PRD G8)

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

/** Same origin only (G15 item 3): the browser's Origin must be this deployment's own. */
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  return origin !== null && origin === new URL(request.url).origin;
}

/** Read the body as text, refusing anything over MAX_BODY bytes. */
async function readBody(request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY) return null;
  const text = await request.text();
  return new TextEncoder().encode(text).length > MAX_BODY ? null : text;
}

/** Parse and validate a DrillRequest for the general pack, or null. */
function parseRequest(text) {
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return null;
  }
  const ok = validate("DrillRequest", body, { charset: pack.charset }).status === "valid";
  return ok && body.packId === pack.id ? body : null;
}

/**
 * Handle one request. Everything outside is passed in, so tests fake AWS, the clock and the log.
 * @param {Request} request
 * @param {{ ask?: typeof converse, limits?: ReturnType<typeof createLimits>, log?: (s: string) => void, now?: () => number }} [deps]
 * @returns {Promise<Response>}
 */
export async function handle(request, deps = {}) {
  const { ask = converse, log = console.log, now = Date.now } = deps;
  const lim = deps.limits ?? limits;
  if (request.method !== "POST") return json(405, { error: "method" });
  if (!sameOrigin(request)) return json(403, { error: "origin" });
  if (!(request.headers.get("content-type") ?? "").startsWith("application/json")) {
    return json(415, { error: "type" });
  }
  const text = await readBody(request);
  if (text === null) return json(413, { error: "size" });
  const req = parseRequest(text);
  if (!req) return json(400, { error: "invalid" });
  const at = now();
  const done = (status, body, e = {}) => {
    writeLedger({ at, ...e, result: body.error ?? "ok" }, log);
    return json(status, body);
  };
  const gate = lim.take(visitorId(request.headers.get("x-forwarded-for")), at);
  if (gate === "rate") return done(429, { error: "rate" });
  if (gate === "cap") return done(200, { error: "cap" });
  let answer;
  try {
    answer = await ask(buildPrompt(req), { token: request.headers.get("x-vercel-oidc-token") });
  } catch (err) {
    const error = err instanceof BedrockTimeout ? "timeout" : "model"; // Req 2.8
    return done(200, { error }, { ms: now() - at });
  }
  const e = { ...answer.usage, stopReason: answer.stopReason, ms: answer.ms };
  const checked = checkAnswer(answer, pack.charset);
  if (!checked.ok) return done(200, { error: checked.code }, e);
  return done(200, { lines: checked.lines, source: "ai" }, e);
}

export default { fetch: (request) => handle(request) };
