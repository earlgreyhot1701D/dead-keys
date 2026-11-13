// The daily drill (daily Reqs 1 to 3) in a real browser: the menu panel's Start and the menu item
// both open today's round, the HUD counts down from 2:00, the start line is announced, and the
// round lands on results as a daily round. The menu with the panel stays clean under axe.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { endByPause, seed, seededText, toMenu, typeWord } from "./helpers.js";

const h1 = (page, name) => page.getByRole("heading", { level: 1, name });

test("Start on the menu panel opens today's daily drill; it counts down and ends on results", async ({
  page,
}) => {
  await seed(page, seededText("normal/progress.basic.json"));
  await toMenu(page);
  const panel = page.getByRole("region", { name: "DAILY DRILL" });
  await expect(panel).toContainText("LIMIT: 02:00");
  await expect(panel).toContainText("SAME WORDS FOR EVERYONE TODAY");
  await panel.getByRole("button", { name: "Start daily drill" }).click();
  await expect(h1(page, "Daily drill")).toBeAttached();
  await expect(page.locator("#live")).toContainText("Daily drill: two minutes.");
  await expect(page.locator(".play-hud")).toContainText("TIME LEFT:");
  await typeWord(page);
  await expect(page.locator(".play-hud")).toContainText(/1:5\d/);
  await endByPause(page);
  await expect(page.locator(".rs-mode")).toHaveText("MODE: DAILY // PACK: GENERAL");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "DAILY DRILL" })).toContainText("Today's best:");
});

test("the menu item Daily drill is built and opens the same round", async ({ page }) => {
  await toMenu(page);
  const item = page.locator("nav").getByRole("button", { name: /^Daily drill/ });
  await expect(item).not.toHaveAttribute("aria-disabled", "true");
  await item.click();
  await expect(h1(page, "Daily drill")).toBeAttached();
});

test("the menu with the daily panel: axe finds nothing serious", async ({ page }) => {
  await toMenu(page);
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id} x${v.nodes.length}`)).toEqual([]);
});
