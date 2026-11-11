// Rules a schema can't express (design.md): schema version, misses vs attempts,
// duplicates, and the three charset checks. Called by validate.js.
import { CURRENT_SCHEMA_VERSION } from "./types.js";

/** @typedef {{ path: string, message: string }} ContractError */

const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Version gate for saved Progress. Runs before the schema check.
 * Returns null for other shapes, non-objects, and versions the schema should judge.
 * @param {string} shape
 * @param {unknown} value
 * @returns {{ status: "needs-migration"|"invalid", errors: ContractError[] } | null}
 */
export function checkVersion(shape, value) {
  if (shape !== "Progress" || !isObj(value)) return null;
  const v = value.schemaVersion;
  if (!Number.isInteger(v) || v < 0) return null;
  const at = (message) => [{ path: "schemaVersion", message }];
  if (v < CURRENT_SCHEMA_VERSION) {
    return {
      status: "needs-migration",
      errors: at(`version ${v} is older than ${CURRENT_SCHEMA_VERSION}`),
    };
  }
  if (v > CURRENT_SCHEMA_VERSION) {
    return {
      status: "invalid",
      errors: at(`version ${v} is newer than this build`),
    };
  }
  return null;
}

/** Errors for characters of `text` that are not in `allowed`. */
function charErrors(text, allowed, path) {
  const bad = [...new Set([...text].filter((c) => !allowed.has(c)))];
  return bad.length
    ? [
        {
          path,
          message: `${bad.map((c) => JSON.stringify(c)).join(", ")} not in the pack charset`,
        },
      ]
    : [];
}

/** misses must not exceed attempts. */
function statErrors(stat, path) {
  return stat.misses > stat.attempts
    ? [
        {
          path: `${path}.misses`,
          message: `${stat.misses} misses but only ${stat.attempts} attempts`,
        },
      ]
    : [];
}

/** misses must not exceed attempts for any key in a round's keyDeltas. */
function deltaErrors(round, path) {
  return Object.entries(round.keyDeltas).flatMap(([k, d]) =>
    statErrors(d, `${path}keyDeltas.${JSON.stringify(k)}`),
  );
}

/** Report the second and later entries that repeat an id. */
function dupErrors(list, idOf, path, what) {
  const seen = new Set();
  const errors = [];
  list.forEach((x, i) => {
    const id = idOf(x);
    if (seen.has(id)) errors.push({ path: `${path}[${i}]`, message: `duplicate ${what}` });
    seen.add(id);
  });
  return errors;
}

/**
 * Cross-field and charset rules. Runs after the schema check passes, so types are trusted.
 * @param {string} shape
 * @param {any} value
 * @param {{ charset?: string }} [ctx]
 * @returns {ContractError[]}
 */
export function checkRules(shape, value, ctx = {}) {
  if (shape === "KeyStat") return statErrors(value, "");
  if (shape === "RoundResult") return deltaErrors(value, "");
  if (shape === "Progress") {
    return [
      ...value.rounds.flatMap((r, i) => deltaErrors(r, `rounds[${i}].`)),
      ...value.keys.flatMap((k, i) => statErrors(k, `keys[${i}]`)),
      ...dupErrors(value.keys, (k) => k.key, "keys", "key"),
      ...dupErrors(value.ghosts, (g) => `${g.mode}|${g.packId}`, "ghosts", "mode and pack"),
    ];
  }
  if (shape === "Pack") {
    const allowed = new Set(value.charset);
    return Object.entries(value.pools).flatMap(([name, items]) =>
      items.flatMap((it, i) => charErrors(it.text, allowed, `pools.${name}[${i}].text`)),
    );
  }
  if (shape === "DrillRequest" || shape === "DrillResponse") {
    if (typeof ctx.charset !== "string" || ctx.charset === "") {
      return [{ path: "", message: "no pack given" }];
    }
    const allowed = new Set(ctx.charset);
    return shape === "DrillRequest"
      ? value.weakKeys.flatMap((w, i) => charErrors(w.key, allowed, `weakKeys[${i}].key`))
      : value.lines.flatMap((line, i) => charErrors(line, allowed, `lines[${i}]`));
  }
  return [];
}
