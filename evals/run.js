// The golden set (PRD G8, G12; ai-drills Req 5.2): each profile in golden.json goes through the
// same prompt, Bedrock call and answer check the route uses. A profile passes only when the answer
// ends normally and, after the route's cleaning, has at least DRILL_MIN_WORDS different words with
// a weak key: the words a drill actually keeps (drills decision 5). Prints one line per profile and a total, never the drill text.
// Run: node evals/run.js (AWS_REGION=us-east-1, the default AWS profile). Hook H5 runs it.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { checkAnswer } from "../api/_lib/answer.js";
import { converse } from "../api/_lib/bedrock.js";
import { buildPrompt } from "../api/_lib/prompt.js";
import { validate } from "../contract/validate.js";
import { DRILL_MIN_WORDS } from "../src/drills/weights.js";

const pack = JSON.parse(readFileSync(new URL("../packs/general.json", import.meta.url), "utf8"));

/**
 * Score one answer for one request. Returns only counts and a reason, never the text.
 * @param {{ weakKeys: { key: string }[] }} req
 * @param {{ text: string, stopReason: string|null }} answer
 * @param {string} [charset]
 * @returns {{ pass: boolean, reason: string, lines: number, words: number, share: number }}
 */
export function score(req, answer, charset = pack.charset) {
  const checked = checkAnswer(answer, charset);
  if (!checked.ok) return { pass: false, reason: checked.code, lines: 0, words: 0, share: 0 };
  const keys = req.weakKeys.map((k) => k.key);
  const words = checked.lines.flatMap((l) => l.split(" ")).filter(Boolean);
  const aimed = new Set(words.filter((w) => keys.some((k) => w.includes(k)))); // what a drill keeps
  const share = words.length
    ? words.filter((w) => keys.some((k) => w.includes(k))).length / words.length
    : 0;
  // The game keeps only weak-key words when there are DRILL_MIN_WORDS of them (drills decision 5),
  // so a profile passes on that count, not on the share; the share is reported for watching.
  const pass = aimed.size >= DRILL_MIN_WORDS;
  const why = "too few weak-key words";
  return {
    pass,
    reason: pass ? "ok" : why,
    aimed: aimed.size,
    lines: checked.lines.length,
    words: words.length,
    share,
  };
}

/** Run every profile once, in order. `ask` is the Bedrock call (tests pass a fake). */
export async function runGolden(profiles, ask = converse, log = console.log) {
  let passed = 0;
  for (const p of profiles) {
    if (validate("DrillRequest", p.request, { charset: pack.charset }).status !== "valid") {
      log(`FAIL  ${p.name}: not a valid DrillRequest`);
      continue;
    }
    let r;
    try {
      r = score(p.request, await ask(buildPrompt(p.request)));
    } catch (err) {
      r = {
        pass: false,
        reason: `call failed (${err?.name ?? "error"})`,
        lines: 0,
        words: 0,
        share: 0,
      };
    }
    if (r.pass) passed += 1;
    const pct = Math.round(r.share * 100);
    log(
      `${r.pass ? "PASS" : "FAIL"}  ${p.name}: ${r.reason}, ${r.lines} lines, ${r.words} words, ${r.aimed ?? 0} different weak-key words, ${pct}% with a weak key`,
    );
  }
  log(`TOTAL ${passed} of ${profiles.length} passed`);
  return passed === profiles.length;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { profiles } = JSON.parse(readFileSync(new URL("./golden.json", import.meta.url), "utf8"));
  const ok = await runGolden(profiles);
  process.exitCode = ok ? 0 : 1;
}
