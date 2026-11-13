// The golden set's own checks (ai-drills Req 5), with Bedrock faked: the six profiles are valid
// requests of the kinds Req 5.1 names, the pass rule, and output that never holds drill text.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validate } from "../contract/validate.js";
import { runGolden, score } from "./run.js";

const { profiles } = JSON.parse(readFileSync(new URL("./golden.json", import.meta.url), "utf8"));
const AZ = "abcdefghijklmnopqrstuvwxyz";
const end = (text) => ({ text, stopReason: "end_turn" });

test("six profiles, each a valid DrillRequest for the general pack", () => {
  assert.equal(profiles.length, 6);
  for (const p of profiles) {
    assert.equal(validate("DrillRequest", p.request, { charset: AZ }).status, "valid", p.name);
  }
  assert.ok(
    profiles.some((p) => p.request.weakKeys.some((k) => k.key === "q")),
    "a rare key",
  );
  assert.ok(
    profiles.some((p) => p.request.recentWpm >= 80),
    "high WPM",
  );
});

test("the pass rule: normal end, at least 8 different weak-key words after cleaning", () => {
  const q = { weakKeys: [{ key: "q", rate: 0.5 }] };
  const many = "quiet queen equal squad quote quiz aqua quilt tree house dog cat sun sky map road";
  assert.equal(score(q, end(many)).pass, true); // 8 q-words, 50% share: the share doesn't matter
  assert.equal(score(q, end("quiet quiet quiet quiet quiet quiet quiet quiet")).pass, false); // 1 different
  assert.equal(score(q, end("quiet tree house dog cat sun sky map")).pass, false); // 1 of 8
  assert.equal(score(q, end("quiet queen")).reason, "too few weak-key words");
  assert.equal(score(q, end("quiet queen")).share, 1);
  assert.deepEqual(score(q, { text: "quiet", stopReason: "max_tokens" }).reason, "stop");
  assert.equal(score(q, end("1. 2, !")).reason, "empty");
});

test("the run prints one line per profile and a total, never the drill text", async () => {
  const out = [];
  const ask = async (p) =>
    p.user.includes(" q ") ? end("quiet queen equal squad quote quiz aqua quilt") : end("dog");
  const ok = await runGolden(profiles, ask, (s) => out.push(s));
  assert.equal(out.length, profiles.length + 1);
  assert.match(out.at(-1), /^TOTAL \d of 6 passed$/);
  assert.equal(
    ok,
    out.slice(0, -1).every((l) => l.startsWith("PASS")),
  );
  assert.ok(
    out.some((l) => l.startsWith("FAIL")),
    "this fake fails at least one profile",
  );
  for (const line of out) assert.ok(!/quiet|queen|dog/.test(line), line);
});

test("a failed call is a failed profile, not a crash", async () => {
  const out = [];
  const ok = await runGolden(
    profiles.slice(0, 1),
    async () => {
      throw Object.assign(new Error("x"), { name: "AccessDeniedException" });
    },
    (s) => out.push(s),
  );
  assert.equal(ok, false);
  assert.match(out[0], /^FAIL .*call failed \(AccessDeniedException\)/);
});
