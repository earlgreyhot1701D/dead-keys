// Block 9 built-in drills (drills Req 7): Drill these keys starts a drill with the HUD badge, every
// word has the weak key (drills design decision 5: the pool is weak-key words), ending from pause
// shows the results badge and row, Play again drills again; with no stats the line shows and the
// drill still starts; axe and no scroll. The clock is fixed so screenshots and axe see one seed.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { endByPause, LIVE_WORD, reach, seed, seededText, toMenu } from "./helpers.js";

const FIXED = 1794589252000; // 2026-11-13T17:00:52Z
const Q_WEAK = JSON.stringify({
  ...JSON.parse(seededText("normal/progress.basic.json")),
  keys: [{ key: "q", attempts: 40, misses: 20, lastSeen: 0 }],
});
const BADGE = "[ DRILL: BUILT-IN ]";
const h1 = (page, name) => page.getByRole("heading", { level: 1, name });

/** Progress > Drill these keys, by keyboard; lands on the drill. */
async function startDrill(page) {
  await reach(page, "Progress");
  await page.getByRole("button", { name: "Drill these keys" }).focus();
  await page.keyboard.press("Enter");
  await h1(page, "Drill").waitFor({ state: "attached" });
  await page.locator(".fall-field").waitFor();
}
/** Type `n` words as they come; returns them. */
async function typeWords(page, n) {
  const seen = [];
  for (let i = 0; i < n; i++) {
    const w = page.locator(LIVE_WORD).first();
    await w.waitFor();
    const text = await w.textContent();
    seen.push(text);
    await page.keyboard.type(text);
  }
  return seen;
}
async function audit(page, name) {
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const rest = r.violations.filter((v) => !bad.includes(v)).map((v) => `${v.id} (${v.impact})`);
  console.log(`AXE ${name}: ${r.violations.length} issue(s)${rest.length ? `; minor: ${rest}` : ""}`);
  for (const v of bad) {
    for (const n of v.nodes.slice(0, 4)) console.log(`  ${v.id} ${n.target} :: ${n.failureSummary}`);
  }
  expect.soft(bad.map((v) => `${v.id} x${v.nodes.length}`), name).toEqual([]);
}

test("q weak: a drill with its badge, a q-word early, results badge and row, Play again", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.clock.setFixedTime(FIXED);
  await seed(page, Q_WEAK);
  await startDrill(page);
  await expect(page.locator(".hud-drill")).toHaveText(BADGE);
  await expect(page.locator(".play-hud")).not.toContainText("LIVES:");
  await expect(page.locator("#live")).toHaveText("Drill: built-in.");
  const words = await typeWords(page, 8);
  expect(words.every((w) => w.includes("q")), words.join(" ")).toBe(true); // weak-key words only
  await endByPause(page);
  await expect(page.locator(".rs-mode")).toHaveText("MODE: PRACTICE // PACK: GENERAL");
  await expect(page.locator(".rs-drill")).toHaveText(BADGE);
  await expect(page.locator(".rs-drill-row")).toHaveText(/DRILL SOURCE\s*BUILT-IN/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("deadkeys:v1")));
  const last = saved.rounds.at(-1);
  expect([last.mode, last.drillSource]).toEqual(["practice", "built-in"]);
  await page.keyboard.press("Enter"); // Play again
  await h1(page, "Drill").waitFor({ state: "attached" });
  await expect(page.locator(".hud-drill")).toHaveText(BADGE);
});

test("no stats: the line under Drill these keys, and the drill still starts", async ({ page }) => {
  await seed(page, seededText("ugly/progress.zero-rounds.json"));
  await reach(page, "Progress");
  await expect(page.getByText("Play a few rounds first. Drills aim at the keys you miss.")).toBeVisible();
  await startDrill(page);
  await expect(page.locator(".hud-drill")).toHaveText(BADGE);
  await typeWords(page, 2);
});

test("other rounds show no drill badge, on play or results", async ({ page }) => {
  await seed(page, Q_WEAK);
  await toMenu(page);
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await page.locator(".fall-field").waitFor();
  await expect(page.locator(".hud-drill")).toHaveCount(0);
  await typeWords(page, 1);
  await endByPause(page);
  await expect(page.locator(".rs-drill, .rs-drill-row")).toHaveCount(0);
});

test("axe: the drill HUD and the drill's results", async ({ page }) => {
  await page.clock.setFixedTime(FIXED);
  await seed(page, Q_WEAK);
  await startDrill(page);
  await typeWords(page, 2);
  await page.waitForTimeout(600); // let the clear moment finish: one run caught a word mid-fade
  await audit(page, "drill HUD");
  await endByPause(page);
  await audit(page, "drill results");
});

const fits = (page) =>
  page.evaluate(() => {
    const d = document.documentElement;
    return d.scrollHeight <= window.innerHeight && d.scrollWidth <= window.innerWidth;
  });
for (const size of [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
]) {
  test(`no drill screen scrolls at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await seed(page, Q_WEAK);
    await reach(page, "Progress");
    expect(await fits(page), "progress").toBe(true);
    await page.getByRole("button", { name: "Drill these keys" }).click();
    await page.locator(".fall-field").waitFor();
    expect(await fits(page), "drill").toBe(true);
    await typeWords(page, 2);
    await endByPause(page);
    expect(await fits(page), "drill results").toBe(true);
  });
}
