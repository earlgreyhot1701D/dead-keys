// Loads and vets contract/schemas/*.json. The only file that names the schema files. They are
// imported statically (no node:fs), so the same code runs in the browser build and in node --test.
// Throws on any keyword outside the supported subset, so a rule is never silently ignored.
import diagnosis from "./schemas/diagnosis.json" with { type: "json" };
import drillRequest from "./schemas/drillRequest.json" with { type: "json" };
import drillResponse from "./schemas/drillResponse.json" with { type: "json" };
import ghostRun from "./schemas/ghostRun.json" with { type: "json" };
import item from "./schemas/item.json" with { type: "json" };
import keyStat from "./schemas/keyStat.json" with { type: "json" };
import keystroke from "./schemas/keystroke.json" with { type: "json" };
import milestone from "./schemas/milestone.json" with { type: "json" };
import pack from "./schemas/pack.json" with { type: "json" };
import progress from "./schemas/progress.json" with { type: "json" };
import roundResult from "./schemas/roundResult.json" with { type: "json" };

// One entry per file in contract/schemas/, keyed by file name (which `validate` derives from the
// shape name). A new schema file must be added here as well as imported above.
const FILES = {
  "diagnosis.json": diagnosis,
  "drillRequest.json": drillRequest,
  "drillResponse.json": drillResponse,
  "ghostRun.json": ghostRun,
  "item.json": item,
  "keyStat.json": keyStat,
  "keystroke.json": keystroke,
  "milestone.json": milestone,
  "pack.json": pack,
  "progress.json": progress,
  "roundResult.json": roundResult,
};

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
 * Throws if a schema uses anything outside the subset.
 * @returns {Map<string, object>}
 */
export function loadSchemas() {
  if (cache) return cache;
  const loaded = new Map(Object.entries(FILES));
  const names = new Set(loaded.keys());
  for (const [f, s] of loaded) vet(s, f, "(root)", names);
  cache = loaded;
  return cache;
}
