// Every word the Lesson screen and Lesson done card say is the copy table's (lessons design.md,
// binding), word for word (lessons Req 11.1).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  COACH,
  cardLabel,
  coachParts,
  DONE,
  FOOTER_LEFT,
  FOOTER_RIGHT,
  fixHint,
  lineCount,
  nextLabel,
  PAUSE,
  pillText,
  SAY,
  STEP_NAMES,
  stepText,
} from "./copy.js";

const design = readFileSync(
  new URL("../../.kiro/specs/lessons/design.md", import.meta.url),
  "utf8",
);
/** Every row named `where` (the map and the copy table can both have one), joined. */
const row = (where) => {
  const rows = design.split("\n").filter((l) => l.startsWith(`| ${where} |`));
  assert.ok(rows.length, where);
  return rows.map((r) => r.split("|").slice(2).join("|").trim()).join(" ");
};
const has = (where, text) => assert.ok(row(where).includes(text), `${where}: ${text}`);

test("steps, pill, line counter, hint, meta and footer", () => {
  has("Step names, Lessons 1 to 6", STEP_NAMES.lesson.map((s) => `\`${s}\``).join(", "));
  has("Step names, Lesson 0", STEP_NAMES.lesson0.map((s) => `\`${s}\``).join(", "));
  assert.equal(stepText("2. NEW KEYS", "now"), "[▶] 2. NEW KEYS");
  assert.equal(stepText("1. WARM-UP", "done"), "[✓] 1. WARM-UP");
  assert.equal(stepText("3. MIX", "todo"), "3. MIX");
  assert.equal(pillText("L03", "lesson"), "LESSON 03 // FULL HOME ROW");
  assert.equal(pillText("L03", "testout"), "TEST OUT // LESSON 03");
  has("Pill", "`LESSON {nn} // {NAME}`, `TEST OUT // LESSON {nn}`");
  has("Line counter", `\`${lineCount("{n}", "{m}")}\``);
  has("Wrong-key hint", `\`${fixHint("{key}").replace('"{key}"', '"{key}"')}\``);
  assert.equal(fixHint(" "), "TYPE SPACE TO FIX. Backspace clears the red key.");
  has("Meta", "`ACCURACY {n}%`, `KEYS {a} / {b}`");
  has("Lesson footer", `\`${FOOTER_LEFT}\` / ${FOOTER_RIGHT.map((s) => `\`${s}\``).join(", ")}`);
});

test("the coach lines, and their key letters drawn bold", () => {
  has("Coach, Warm-up", `\`${COACH.warmup}\``);
  has("Coach, Mix", `\`${COACH.mix}\``);
  has("Coach, Check", `\`${COACH.check}\``);
  for (const [id, line] of Object.entries(COACH.new)) has(`Coach, New keys, ${id}`, `\`${line}\``);
  const bold = (l) =>
    coachParts(l)
      .filter(([, k]) => k)
      .map(([s]) => s.trim());
  assert.deepEqual(bold(COACH.new.L01), ["A", "S", "D", "F"]);
  assert.deepEqual(bold(COACH.new.L02), ["J", "K", "L", ";"]);
  assert.deepEqual(bold(COACH.new.L05), ["Q", "W", "E", "I", "O", "P"]);
  assert.equal(
    coachParts(COACH.new.L03)
      .map(([s]) => s)
      .join(""),
    COACH.new.L03,
  );
});

test("the pause dialog and the live region", () => {
  has("Pause dialog", `Title \`${PAUSE.title}\`. Body \`${PAUSE.body}\``);
  has("Pause dialog", `\`[ ${PAUSE.resume} ]\`, \`[ ${PAUSE.leave} ]\``);
  const live = row("Live region");
  for (const s of [
    SAY.line("{n}", "{m}", "{text}"),
    SAY.wrong("{key}"),
    SAY.passed("{n}", "{a}"),
    SAY.notYet("{a}"),
    SAY.testedOut("{n}"),
  ])
    assert.ok(live.includes(`\`${s}\``) || live.includes(s), s);
});

test("the Lesson done card", () => {
  has("Done titles", `\`${DONE.passed}\`, \`${DONE.notYet}\`, \`${DONE.testedOut}\``);
  const stats = row("Done stats");
  for (const s of [DONE.checkAcc, DONE.passLine, DONE.speed, "{n} WPM", DONE.speedSub, DONE.keep])
    assert.ok(stats.includes(`\`${s}\``), s);
  assert.ok(stats.includes(`\`${DONE.keepSub}\``) && stats.includes(`\`${DONE.none}\``));
  assert.ok(stats.includes(`\`${DONE.noneSub}\``));
  has("Done, Lesson 0 accuracy sub-line", `\`${DONE.lesson0Sub}\``);
  has("Done, Not yet line", `\`${DONE.notYetLine}\``);
  has("Done, test out Not yet line", `\`${DONE.testOutNotYetLine}\``);
  has("Dip line", `\`${DONE.dip}\``);
  has("Done buttons", `\`[ ${nextLabel(4).replace("04", "{nn}")} ]\`, \`[ ${DONE.again} ]\``);
  has("Done buttons", `\`[ ${DONE.all} ]\``);
  has("Done footers", `\`${DONE.footNext.join("  ")}\``);
  has("Done footers", `\`${DONE.footAgain.join("  ")}\``);
  has("Card labels", "`LESSON {nn}`");
  assert.equal(cardLabel(3), "LESSON 03");
  assert.equal(nextLabel(4), "Next: Lesson 04");
});
