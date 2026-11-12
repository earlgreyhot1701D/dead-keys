// Shara's rule: no page scrolls. Every screen fits at the design size, on her 1366x768
// Chromebook, and on a 1280x720 laptop (fit.js zooms the design down to fit). Also the way home:
// every page has a Main menu button and a wordmark that goes to the menu.
import { expect, test } from "@playwright/test";
import { openFromMenu, seed, seededText, toMenu } from "./helpers.js";

const SIZES = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
];
const PAGES = ["Progress", "Settings", "How we count", "About"];

const fits = (page) =>
  page.evaluate(() => {
    const d = document.documentElement;
    return d.scrollHeight <= window.innerHeight && d.scrollWidth <= window.innerWidth;
  });

for (const size of SIZES) {
  test(`no screen scrolls at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await seed(page, seededText("ugly/progress.200-rounds-all-keys.json"));
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    expect(await fits(page), "title").toBe(true);
    await toMenu(page);
    expect(await fits(page), "menu").toBe(true);
    for (const label of PAGES) {
      await openFromMenu(page, label);
      expect(await fits(page), label).toBe(true);
      await page.keyboard.press("Escape");
      await page.getByRole("heading", { level: 1, name: "Main menu" }).waitFor();
    }
  });
}

test("the first-launch privacy card fits at 1366x768 too", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page.keyboard.press("a");
  await page.getByRole("heading", { level: 1, name: "Privacy" }).waitFor();
  expect(await fits(page)).toBe(true);
});

test("Main menu and the wordmark both go home from a page two screens deep", async ({ page }) => {
  await seed(page, seededText("normal/progress.basic.json"));
  await toMenu(page);
  await openFromMenu(page, "Settings");
  await page.getByRole("button", { name: "Read the privacy card" }).click();
  await page.getByRole("heading", { level: 1, name: "Privacy" }).waitFor();
  await page.getByRole("button", { name: "Main menu" }).first().click();
  await page.getByRole("heading", { level: 1, name: "Main menu" }).waitFor();
  await openFromMenu(page, "About");
  await page.locator(".term-home").click();
  await expect(page.getByRole("heading", { level: 1, name: "Main menu" })).toBeVisible();
});
