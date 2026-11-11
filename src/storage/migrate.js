// Old saves to the current version, one step per version (design decision 3), then the final
// contract and vet checks. An `ok` result is always safe to use. Pure; never throws on bad data.

import { loadSchemas } from "../../contract/schemas.js";
import { CURRENT_SCHEMA_VERSION } from "../../contract/types.js";
import { validate } from "../../contract/validate.js";
import { vet } from "./vet.js";

const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
/** Why an upgrade failed, as a code callers can rely on (the `reason` text is only for logs). */
const fail = (code, reason) => ({ ok: false, code, reason });
const maxRounds = () => loadSchemas().get("progress.json").properties.rounds.maxItems;

/**
 * A new, empty Progress (design decision 5). The one place the fresh shape is written; store.js
 * re-exports it and the version 0 upgrade starts from it.
 * @param {number} now Milliseconds, for `createdAt`.
 * @returns {import("../../contract/types.js").Progress}
 * @throws {TypeError} If `now` is not a whole number (programmer error).
 */
export function freshProgress(now) {
  if (!Number.isInteger(now) || now < 0) throw new TypeError("now must be a whole number");
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: now,
    rounds: [],
    keys: [],
    bests: {},
    dayStreak: { lastDay: null, count: 0 },
    lessonsPassed: [],
    milestones: [],
    settings: {},
    ghosts: [],
  };
}

/**
 * Version 0 to 1. Keeps the rounds that pass the RoundResult contract and the vet checks (the
 * newest 200), and fills every other field fresh. Anything else in the old save is dropped.
 * No real player has a version 0 save; the step exists so the path is tested before it is needed.
 */
function zeroToOne(old, now) {
  const rounds = (Array.isArray(old.rounds) ? old.rounds : []).filter(
    (r) => validate("RoundResult", r).status === "valid" && vet({ rounds: [r] }).length === 0,
  );
  return { ...freshProgress(now), rounds: structuredClone(rounds.slice(-maxRounds())) };
}

/** One entry per version step. `run(old, now)` returns the next version. */
export const STEPS = Object.freeze([Object.freeze({ from: 0, to: 1, run: zeroToOne })]);

/**
 * Bring a saved value up to the current version and check it. A value already at the current
 * version is only checked. A newer version, a missing step, a step that throws, or a result that
 * fails the contract or the vet checks all give `{ ok: false, code, reason }` (the caller treats it as
 * corrupt). Never changes `value`.
 * @param {unknown} value Parsed JSON.
 * @param {number} now Milliseconds, for the fresh `createdAt` of an upgraded save.
 * @param {readonly { from: number, to: number, run: (old: any, now: number) => unknown }[]} [steps]
 *   The step table. Only tests pass this.
 * @returns {{ ok: true, progress: import("../../contract/types.js").Progress } | { ok: false, code: "notASave"|"newer"|"noPath"|"badStep"|"stepFailed"|"format"|"unsafe", reason: string }}
 * @throws {TypeError} If `now` is not a whole number (programmer error).
 */
export function migrate(value, now, steps = STEPS) {
  if (!Number.isInteger(now) || now < 0) throw new TypeError("now must be a whole number");
  if (!isObj(value) || !Number.isInteger(value.schemaVersion) || value.schemaVersion < 0) {
    return fail("notASave", "this is not a Dead Keys save");
  }
  let version = value.schemaVersion;
  if (version > CURRENT_SCHEMA_VERSION)
    return fail("newer", `saved by a newer version (${version})`);
  let current = value;
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = steps.find((s) => s.from === version);
    if (!step) return fail("noPath", `no upgrade path from version ${version}`);
    if (!(step.to > version)) return fail("badStep", `bad upgrade step from version ${version}`);
    try {
      current = step.run(current, now);
    } catch {
      return fail("stepFailed", `upgrading from version ${version} failed`);
    }
    version = step.to;
  }
  const checked = validate("Progress", current);
  if (checked.status !== "valid") {
    const first = checked.errors[0];
    return fail(
      "format",
      `does not match the save format (${first ? `${first.path || "(root)"}: ${first.message}` : "unknown"})`,
    );
  }
  const problems = vet(current);
  if (problems.length > 0)
    return fail(
      "unsafe",
      `failed a safety check (${problems[0].path || "(root)"}: ${problems[0].message})`,
    );
  return { ok: true, progress: current };
}
