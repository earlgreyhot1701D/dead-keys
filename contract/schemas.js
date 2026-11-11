// Loads and vets contract/schemas/*.json. The only file that reads the schema files, so the
// Block 4 swap to static JSON imports (browser support) touches this file alone.
// Throws on any keyword outside the supported subset, so a rule is never silently ignored.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KEYWORDS = new Set([
  "type",
  "required",
  "properties",
  "additionalProperties",
  "items",
  "enum",
  "const",
  "minimum",
  "maximum",
  "minLength",
  "maxLength",
  "minItems",
  "maxItems",
  "$ref",
  "description",
]);
const TYPES = new Set(["string", "number", "integer", "boolean", "object", "array", "null"]);
const DIR = join(dirname(fileURLToPath(import.meta.url)), "schemas");

const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

/** Check one schema node. Throws on anything outside the supported subset. */
function vet(s, file, where, names) {
  if (!isObj(s)) throw new Error(`${file}: ${where} is not a schema object`);
  for (const k of Object.keys(s)) {
    if (!KEYWORDS.has(k)) throw new Error(`${file}: unknown keyword "${k}" at ${where}`);
  }
  for (const t of [].concat(s.type ?? [])) {
    if (!TYPES.has(t)) throw new Error(`${file}: unknown type "${t}" at ${where}`);
  }
  if ("$ref" in s && !names.has(s.$ref))
    throw new Error(`${file}: $ref "${s.$ref}" at ${where} is not a schema file`);
  if ("enum" in s && !Array.isArray(s.enum))
    throw new Error(`${file}: enum at ${where} is not an array`);
  if ("required" in s && !Array.isArray(s.required))
    throw new Error(`${file}: required at ${where} is not an array`);
  for (const [k, v] of Object.entries(s.properties ?? {})) vet(v, file, `${where}.${k}`, names);
  if ("items" in s) vet(s.items, file, `${where}[]`, names);
  const extra = s.additionalProperties;
  if (extra !== undefined && extra !== false) vet(extra, file, `${where}.*`, names);
}

/** @type {Map<string, object> | null} */
let cache = null;

/**
 * Load and vet every schema once, keyed by file name ("item.json").
 * Throws if a file is unreadable, is not JSON, or uses anything outside the subset.
 * @returns {Map<string, object>}
 */
export function loadSchemas() {
  if (cache) return cache;
  const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
  const names = new Set(files);
  const loaded = new Map();
  for (const f of files) {
    try {
      loaded.set(f, JSON.parse(readFileSync(join(DIR, f), "utf8")));
    } catch (e) {
      throw new Error(`${f}: cannot read schema (${e.message})`);
    }
  }
  for (const [f, s] of loaded) vet(s, f, "(root)", names);
  cache = loaded;
  return cache;
}
