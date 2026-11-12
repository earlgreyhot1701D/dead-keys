// Basic flows in a real browser: first run, keyboard-only menu, settings that persist.
import { expect, test } from "@playwright/test";
import { KEY, reach, toMenu } from "./helpers.js";

test("first run: title, any key, privacy card, Continue, menu; the card does not return", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Dead Keys" })).toBeVisible();
  await page.keyboard.press("a");
  await expect(page.getByRole("heading", { level: 1, name: "Privacy" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Main menu" })).toBeVisible();
  await page.reload();
  await page.keyboard.press("a");
  await expect(page.getByRole("heading", { level: 1, name: "Main menu" })).toBeVisible();
});

test("the menu works by keyboard alone, with a visible focus ring", async ({ page }) => {
  await toMenu(page);
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
  expect(outline).not.toBe("none");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("End");
  await expect(page.getByRole("button", { name: "About", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("button", { name: /^Play/ })).toBeFocused(); // its name ends "Not built yet"
  await page.getByRole("button", { name: "Settings", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { level: 1, name: "Main menu" })).toBeVisible();
});

test("a screen that is not built says so and does not open", async ({ page }) => {
  await toMenu(page);
  const play = page.getByRole("button", { name: /^Play/ });
  await expect(play).toHaveAttribute("aria-disabled", "true");
  await expect(play).toContainText("Not built yet");
  await play.click({ force: true }); // aria-disabled, not disabled: it stays focusable on purpose
  await expect(page.getByRole("heading", { level: 1, name: "Main menu" })).toBeVisible();
});

test("settings are saved and come back after a reload", async ({ page }) => {
  await reach(page, "Settings");
  await page.getByLabel("AI drills").check();
  await page.getByLabel("Sound").selectOption("arcade");
  await page.getByLabel("Finger colors").uncheck();
  await page.getByLabel("Speed").focus();
  await page.keyboard.press("ArrowRight");
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).settings, KEY);
  expect(saved).toMatchObject({ ai: true, sound: "arcade", fingerColors: false });
  expect(saved.speed).toBeGreaterThan(1);
  await page.reload();
  await page.keyboard.press("a");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByLabel("AI drills")).toBeChecked();
  await expect(page.getByLabel("Sound")).toHaveValue("arcade");
  await expect(page.getByLabel("Finger colors")).not.toBeChecked();
});

test("a screen change is announced once: the heading takes focus, the live region stays quiet", async ({
  page,
}) => {
  await toMenu(page);
  await expect(page.getByRole("heading", { level: 1, name: "Main menu" })).toBeFocused();
  await page.waitForTimeout(200); // longer than the live region's own delay
  await expect(page.locator("#live")).toHaveText("");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { level: 1, name: "Dead Keys" })).toBeFocused();
  await expect(page.locator("#live")).toHaveText("");
});
