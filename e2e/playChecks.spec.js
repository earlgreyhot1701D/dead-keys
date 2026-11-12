// Play checks (play Req 9.1, 9.3): axe on every new screen and dialog (serious or critical fail),
// the warm-up never costing a life, and no page scrolling at three sizes on the picker, both
// play screens and results.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { endByPause, LIVE_WORD, startRound } from "./helpers.js";

const BLOCKING = new Set(["serious", "critical"]);
async function audit(page, name) {
  const r = await new AxeBuilder({ page }).analyze();
  const line = (v) => `${v.id} (${v.impact ?? "n/a"}) x${v.nodes.length}`;
  console.log(`AXE ${name}: ${r.violations.length} issue(s); ${r.violations.map(line).join(", ")}`);
  expect(r.violations.filter((v) => BLOCKING.has(v.impact)).map(line), name).toEqual([]);
}
const h1 = (page, name) => page.getByRole("heading", { level: 1, name });

test("axe: picker, Falling words (locked, wrong key), pause dialog, results", async ({ page }) => {
  await startRound(page, "Falling words");
  await audit(page, "falling, warm-up");
  const w = page.locator(LIVE_WORD).first();
  const word = await w.textContent();
  await page.keyboard.press(word[0]);
  await page.keyboard.press(word[1] === "z" ? "q" : "z");
  await expect(page.locator(".fw.is-wrong")).toBeVisible();
  await audit(page, "falling, wrong key");
  await page.keyboard.press("Escape"); // let go
  await page.keyboard.press("Escape"); // pause
  await page.getByRole("dialog", { name: "Paused" }).waitFor();
  await audit(page, "pause dialog");
  await page.keyboard.press("Escape");
  await endByPause(page);
  await audit(page, "results");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Play/ }).focus();
  await page.keyboard.press("Enter");
  await h1(page, "Play").waitFor();
  await audit(page, "mode picker");
});

test("axe: Four corners and Practice", async ({ page }) => {
  await startRound(page, "Four corners");
  await audit(page, "corners");
  await endByPause(page);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Practice", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.locator(".fall-field").waitFor();
  await audit(page, "practice");
});

test("the warm-up never costs a life; out of lives opens a real dialog, Escape continues", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await startRound(page, "Falling words", { fast: true }); // type nothing: every word lands
  const lives = page.locator(".hud-lives");
  await expect(page.locator(".play-hud")).toContainText("· 2 LEFT", { timeout: 20_000 });
  await expect(page.locator(".play-hud")).toContainText("WARM-UP");
  await expect(lives).toHaveAttribute("aria-label", "5 of 5 lives left");
  const out = page.getByRole("dialog", { name: "Out of lives" });
  await out.waitFor({ timeout: 90_000 });
  await expect(out).toContainText("That's the arcade part. Nothing is lost.");
  await expect(out.getByRole("button", { name: "Continue" })).toBeFocused();
  await audit(page, "out-of-lives dialog");
  await page.keyboard.press("Escape"); // Continue (approved by Shara)
  await expect(out).toBeHidden();
  await expect(lives).toHaveAttribute("aria-label", "5 of 5 lives left");
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
  test(`no scroll at ${size.width}x${size.height}: picker, both play screens, results`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await startRound(page, "Falling words");
    expect(await fits(page), "falling").toBe(true);
    await endByPause(page);
    expect(await fits(page), "results").toBe(true);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /^Play/ }).focus();
    await page.keyboard.press("Enter");
    await h1(page, "Play").waitFor();
    expect(await fits(page), "picker").toBe(true);
    await page.getByRole("button", { name: "Four corners", exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.locator(".cn-field").waitFor();
    expect(await fits(page), "corners").toBe(true);
  });
}
