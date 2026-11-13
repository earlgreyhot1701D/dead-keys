// The ghost race (ghost Reqs 1 to 4) in a real browser: a first best saves a ghost, the next
// round shows it in the HUD and results race it, and the menu's daily panel races the daily ghost.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { endByPause, KEY, toMenu, typeWord } from "./helpers.js";

async function playFalling(page, words) {
  await page.getByRole("button", { name: /^Play/ }).click();
  await page.getByRole("button", { name: "Falling words", exact: true }).click();
  await page.locator(".fall-field").waitFor();
  for (let i = 0; i < words; i++) await typeWord(page);
  await endByPause(page);
}

test("a first best saves a ghost; the next round races it in the HUD and on results", async ({
  page,
}) => {
  await toMenu(page);
  await playFalling(page, 2);
  await expect(page.locator(".rs-ghost")).toHaveText("New ghost saved. Race it next time.");
  const ghosts = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).ghosts, KEY);
  expect(ghosts.map((g) => g.mode)).toEqual(["falling"]);
  expect(ghosts[0].keystrokes.length).toBeGreaterThan(5);
  await page.keyboard.press("Enter"); // Play again
  await expect(page.locator(".hud-ghost")).toContainText(/GHOST:\s*\d+ WPM/);
  await expect(page.locator(".hud-ghost-lead")).toHaveText(/AHEAD|BEHIND|LEVEL/);
  const axe = await new AxeBuilder({ page }).analyze();
  const bad = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id} x${v.nodes.length}`)).toEqual([]);
  await typeWord(page);
  await endByPause(page);
  await expect(page.locator(".rs-ghost")).toContainText(/ghost/);
});

test("the daily panel races your daily ghost, with its pace", async ({ page }) => {
  await toMenu(page);
  await page.getByRole("button", { name: "Start daily drill" }).click();
  await typeWord(page);
  await typeWord(page);
  await endByPause(page);
  await page.keyboard.press("Escape");
  const panel = page.getByRole("region", { name: "DAILY DRILL" });
  await expect(panel).toContainText(/Race your ghost: \d+ WPM/);
  await expect(panel).toContainText(/TARGET PACE: \d+ CPM \/\/ SAME WORDS FOR EVERYONE TODAY/);
});
