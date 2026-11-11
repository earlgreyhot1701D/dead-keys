// Schema-subset checker (design.md). Schemas come from schemas.js, which throws on any
// keyword it does not know, so a rule can never be silently ignored.
import { checkRules, checkVersion } from "./rules.js";
import { loadSchemas } from "./schemas.js";

/** @typedef {{ path: string, message: string }} ContractError */
/** @typedef {{ status: "valid"|"invalid"|"needs-migration", errors: ContractError[] }} ContractResult */

const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const typeOk = (t, v) => {
  if (t === "integer") return Number.isInteger(v);
  if (t === "number") return typeof v === "number" && Number.isFinite(v);
  if (t === "array") return Array.isArray(v);
  if (t === "object") return isObj(v);
  if (t === "null") return v === null;
  return typeof v === t;
};

/** Collect errors for value v against schema s. */
function check(s, v, path, errors) {
  const bad = (message) => errors.push({ path, message });
  if (s.$ref) check(loadSchemas().get(s.$ref), v, path, errors);
  if (s.type !== undefined) {
    const types = [].concat(s.type);
    if (!types.some((t) => typeOk(t, v))) return bad(`expected ${types.join(" or ")}`);
  }
  if ("const" in s && !same(v, s.const)) bad(`must be ${JSON.stringify(s.const)}`);
  if (s.enum && !s.enum.some((e) => same(e, v)))
    bad(`must be one of ${s.enum.map((e) => JSON.stringify(e)).join(", ")}`);
  if (typeof v === "number") {
    if (s.minimum !== undefined && v < s.minimum) bad(`${v} is below the minimum of ${s.minimum}`);
    if (s.maximum !== undefined && v > s.maximum) bad(`${v} is above the maximum of ${s.maximum}`);
  }
  if (typeof v === "string") {
    const n = [...v].length; // characters, not UTF-16 units
    if (s.minLength !== undefined && n < s.minLength) bad(`${n} characters, min is ${s.minLength}`);
    if (s.maxLength !== undefined && n > s.maxLength) bad(`${n} characters, max is ${s.maxLength}`);
  }
  if (Array.isArray(v)) {
    if (s.minItems !== undefined && v.length < s.minItems)
      bad(`${v.length} items, min is ${s.minItems}`);
    if (s.maxItems !== undefined && v.length > s.maxItems)
      bad(`${v.length} items, max is ${s.maxItems}`);
    if (s.items) {
      for (const [i, item] of v.entries()) {
        check(s.items, item, `${path}[${i}]`, errors);
      }
    }
  }
  if (isObj(v)) {
    const at = (k) => (path ? `${path}.${k}` : k);
    for (const k of s.required ?? []) {
      if (!Object.hasOwn(v, k)) errors.push({ path: at(k), message: "is required" });
    }
    for (const k of Object.keys(v)) {
      if (s.properties && Object.hasOwn(s.properties, k))
        check(s.properties[k], v[k], at(k), errors);
      else if (s.additionalProperties === false)
        errors.push({ path: at(k), message: "is not allowed" });
      else if (isObj(s.additionalProperties)) check(s.additionalProperties, v[k], at(k), errors);
    }
  }
}

/**
 * Check a value against a shape. Shape names are the G4 names ("Pack", "KeyStat"...).
 * Throws on an unknown shape or a bad schema file; bad data returns "invalid".
 * @param {string} shape
 * @param {unknown} value
 * @param {{ charset?: string }} [ctx] Pack charset, needed for DrillRequest and DrillResponse.
 * @returns {ContractResult}
 */
export function validate(shape, value, ctx = {}) {
  const file = `${shape.charAt(0).toLowerCase()}${shape.slice(1)}.json`;
  const schema = loadSchemas().get(file);
  if (!schema) throw new Error(`unknown shape "${shape}"`);
  const early = checkVersion(shape, value);
  if (early) return early;
  const errors = [];
  check(schema, value, "", errors);
  if (errors.length === 0) errors.push(...checkRules(shape, value, ctx));
  return { status: errors.length ? "invalid" : "valid", errors };
}

/**
 * Parse JSON text, then validate it. Bad JSON is "invalid", never a throw.
 * @param {string} shape
 * @param {unknown} text
 * @param {{ charset?: string }} [ctx]
 * @returns {ContractResult}
 */
export function parseAndValidate(shape, text, ctx = {}) {
  let value;
  try {
    if (typeof text !== "string") throw new SyntaxError("not text");
    value = JSON.parse(text);
  } catch {
    return { status: "invalid", errors: [{ path: "", message: "not JSON" }] };
  }
  return validate(shape, value, ctx);
}
