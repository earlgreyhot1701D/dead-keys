// Job: the two MCP tools' handlers (validate_pack, run_golden_set), kept apart from the transport so tests run them with no network.
// PRD G12; mcp Req 2, 3. Each handler takes the tool's arguments and returns MCP tool content.
// Neither one ever returns an env value, a token or a credential.
import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { runGolden } from "../evals/run.js";
import { checkFile, packFiles } from "../scripts/check-pack.js";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const PACKS = resolve(ROOT, "packs");

/** MCP tool content: one text block; `isError` marks a refusal or a failure. */
const reply = (text, isError = false) => ({ content: [{ type: "text", text }], isError });

/**
 * A pack path, resolved from the repo root, only if it is a .json file inside packs/.
 * @param {unknown} path
 * @returns {string|null} The absolute path, or null to refuse.
 */
export function packPath(path) {
  if (typeof path !== "string" || path.trim() === "" || path.includes("\0")) return null;
  const abs = resolve(ROOT, path);
  const rel = relative(PACKS, abs);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel) || rel.split(sep).includes("..")) {
    return null;
  }
  return abs.endsWith(".json") ? abs : null;
}

/** One line per file, OK or FAIL, then each problem, as check-pack.js prints them. */
function report(results) {
  const lines = [];
  for (const r of results) {
    const name = relative(ROOT, r.file).split(sep).join("/");
    if (r.problems.length === 0) lines.push(`OK   ${name}: ${r.items} items`);
    else {
      lines.push(`FAIL ${name}: ${r.problems.length} problem(s)`);
      for (const p of r.problems) lines.push(`     ${p.path || "(file)"}: ${p.message}`);
    }
  }
  return lines.join("\n");
}

/**
 * validate_pack: one pack inside packs/, or every pack when no path is given.
 * @param {{ path?: string }} [args]
 */
export function validatePack(args = {}) {
  if (args.path !== undefined) {
    const file = packPath(args.path);
    if (!file) return reply("Refused: path must be a .json file inside packs/.", true);
    const result = checkFile(file);
    return reply(report([result]), result.problems.length > 0);
  }
  const results = packFiles(`${PACKS}${sep}`).map(checkFile);
  return reply(
    report(results),
    results.some((r) => r.problems.length > 0),
  );
}

/**
 * run_golden_set: the golden set against real Bedrock (it costs money), so only with
 * `confirm: true`. Returns evals/run.js's own lines: pass or fail per profile, never drill text.
 * @param {{ confirm?: boolean }} [args]
 * @param {Function} [ask] The Bedrock call; tests pass a fake.
 */
export async function runGoldenSet(args = {}, ask = undefined) {
  if (args.confirm !== true) {
    return reply(
      "Refused: run_golden_set calls real Bedrock. Call it with { confirm: true }.",
      true,
    );
  }
  const { profiles } = JSON.parse(readFileSync(resolve(ROOT, "evals/golden.json"), "utf8"));
  const lines = [];
  const ok = await runGolden(profiles, ask, (s) => lines.push(String(s)));
  return reply(lines.join("\n"), !ok);
}

/** The tool list, with plain JSON Schema inputs. */
export const TOOLS = Object.freeze([
  {
    name: "validate_pack",
    description:
      "Check Dead Keys word packs against the pack format (docs/pack-format.md). With no path, checks every pack in packs/. Returns OK or FAIL per file, with each problem.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string", description: "A .json file inside packs/." } },
      additionalProperties: false,
    },
    handler: validatePack,
  },
  {
    name: "run_golden_set",
    description:
      "Run the AI drill golden set (evals/run.js) against real Amazon Bedrock and return pass or fail per profile. Each run is a small Bedrock charge, so it needs confirm: true.",
    inputSchema: {
      type: "object",
      properties: { confirm: { type: "boolean", description: "Must be true to call Bedrock." } },
      required: ["confirm"],
      additionalProperties: false,
    },
    handler: runGoldenSet,
  },
]);
