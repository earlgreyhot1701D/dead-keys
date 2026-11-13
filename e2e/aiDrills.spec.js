// Block 10 AI drills (ai-drills Req 7.2) with /api/drill faked by Playwright's route, so no test
// reaches AWS: AI on gives the waiting line, the AI badge and the AI's words, and Play again
// replays them with no second request; a timeout, a 429, an error answer and a bad character each
// give the built-in drill; AI off makes no request and shows the nudge.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { endByPause, LIVE_WORD, reach, seed, seededText } from "./helpers.js";

const WORDS = "quiet queen quote equal square quilt quick quest aqua quiz".split(" ");
const LINES = ["quiet queen quote equal", "square quilt quick quest", "aqua quiz"];
const AI_BADGE = "[ DRILL: AI-GENERATED ]";
const BUILT_IN = "[ DRILL: BUILT-IN ]";

/** Saved progress with q weak, and AI drills on or off. */
const progress = (ai) => {
  const p = JSON.parse(seededText("normal/progress.basic.json"));
  return JSON.stringify({
    ...p,
    keys: [{ key: "q", attempts: 40, misses: 20, lastSeen: 0 }],
    settings: { ...p.settings, ai },
  });
};
/** Fake the route; `answer(route)` fulfils or stalls. Returns the list of request bodies. */
async function fakeRoute(page, answer) {
  const bodies = [];
  await page.route("**/api/drill", async (route) => {
    bodies.push(route.request().postDataJSON());
    await answer(route);
  });
  return bodies;
}
const json = (body, status = 200) => (route) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

async function pressDrill(page) {
  await reach(page, "Progress");
  await page.getByRole("button", { name: "Drill these keys" }).focus();
  await page.keyboard.press("Enter");
}
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

test("AI on: waiting line, AI badge and words, results label; Play again replays them, no new request", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await seed(page, progress(true));
  const bodies = await fakeRoute(page, async (route) => {
    await new Promise((r) => setTimeout(r, 400)); // long enough to see the waiting line
    await json({ lines: LINES, source: "ai" })(route);
  });
  await pressDrill(page);
  await expect(page.getByText("Writing your drill...")).toBeVisible();
  await page.locator(".fall-field").waitFor();
  await expect(page.locator(".hud-drill")).toHaveText(AI_BADGE);
  await expect(page.locator("#live")).toHaveText("Drill: AI-generated.");
  for (const w of await typeWords(page, 4)) expect(WORDS).toContain(w);
  expect(bodies).toEqual([
    { packId: "general", weakKeys: [{ key: "q", rate: 0.5 }], recentWpm: expect.any(Number) },
  ]);
  await endByPause(page);
  await expect(page.locator(".rs-mode")).toHaveText("MODE: PRACTICE // PACK: AI WORDS");
  await expect(page.locator(".rs-drill")).toHaveText(AI_BADGE);
  await expect(page.locator(".rs-drill-row")).toHaveText(/DRILL SOURCE\s*AI-GENERATED/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("deadkeys:v1")));
  expect(saved.rounds.at(-1).drillSource).toBe("ai");
  await page.keyboard.press("Enter"); // Play again
  await page.locator(".fall-field").waitFor();
  await expect(page.locator(".hud-drill")).toHaveText(AI_BADGE);
  for (const w of await typeWords(page, 3)) expect(WORDS).toContain(w);
  expect(bodies.length).toBe(1);
});

for (const [name, answer] of [
  ["a timeout", () => new Promise(() => {})], // never answers: the browser gives up at 4 s
  ["a 429", json({ error: "rate" }, 429)],
  ["an error answer", json({ error: "cap" })],
  ["a bad character", json({ lines: ["quiet, queen quote", ...LINES], source: "ai" })],
]) {
  test(`${name} gives the built-in drill, labeled built-in`, async ({ page }) => {
    test.setTimeout(30_000);
    await seed(page, progress(true));
    const bodies = await fakeRoute(page, answer);
    await pressDrill(page);
    await page.locator(".fall-field").waitFor({ timeout: 10_000 });
    await expect(page.locator(".hud-drill")).toHaveText(BUILT_IN);
    await expect(page.locator("#live")).toHaveText("Drill: built-in.");
    expect(bodies.length).toBe(1);
  });
}

test("AI off: the nudge under the button, no request, the built-in drill", async ({ page }) => {
  await seed(page, progress(false));
  const bodies = await fakeRoute(page, json({ lines: LINES, source: "ai" }));
  await reach(page, "Progress");
  await expect(page.getByText("Want fresh words? Turn on AI drills in Settings.")).toBeVisible();
  await page.getByRole("button", { name: "Drill these keys" }).click();
  await page.locator(".fall-field").waitFor();
  await expect(page.locator(".hud-drill")).toHaveText(BUILT_IN);
  expect(bodies).toEqual([]);
});

test("Settings: the AI drills switch is off by default and turns on", async ({ page }) => {
  await reach(page, "Settings");
  const box = page.getByLabel("AI drills");
  await expect(box).not.toBeChecked();
  await box.check();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("deadkeys:v1")));
  expect(saved.settings.ai).toBe(true);
  await expect(page.locator("#st-ai-later")).toHaveCount(0);
});

test("axe: the AI drill HUD and its results", async ({ page }) => {
  await seed(page, progress(true));
  await fakeRoute(page, json({ lines: LINES, source: "ai" }));
  await pressDrill(page);
  await page.locator(".fall-field").waitFor();
  await typeWords(page, 2);
  await page.waitForTimeout(600); // let the clear moment finish
  for (const name of ["AI drill HUD", "AI drill results"]) {
    if (name === "AI drill results") await endByPause(page);
    const r = await new AxeBuilder({ page }).analyze();
    const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    console.log(`AXE ${name}: ${r.violations.length} issue(s)`);
    expect.soft(bad.map((v) => `${v.id} x${v.nodes.length}`), name).toEqual([]);
  }
});
