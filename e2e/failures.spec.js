// The two failures a player can hit in the shell, in a real browser: storage the browser blocks,
// and a backup download the browser refuses. Each shows its approved notice and nothing crashes.
import { expect, test } from "@playwright/test";
import { openFromMenu, seed, seededText, toMenu } from "./helpers.js";

test("blocked storage: the blocked notice, menus still work, nothing claims a save", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.getByText("This browser isn't saving progress right now.", { exact: false })).toBeVisible();
  await expect(page.getByText("Progress isn't being saved right now.", { exact: false })).toBeVisible();
  await expect(page.getByText("Your progress stays in this browser.", { exact: false })).toHaveCount(0);
  await toMenu(page);
  await openFromMenu(page, "Settings");
  await expect(page.getByText("NOT SAVING")).toBeVisible();
});

test("a refused download shows exportFailed, and Try again tries again", async ({ page }) => {
  await seed(page, seededText("normal/progress.basic.json"));
  await page.addInitScript(() => {
    URL.createObjectURL = () => {
      throw new Error("refused");
    };
  });
  await toMenu(page);
  await openFromMenu(page, "Settings");
  await page.getByRole("button", { name: "Download backup" }).click();
  const line = page.getByText("We couldn't make a backup file just now.", { exact: false });
  await expect(line).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(line).toBeVisible(); // still refused, still told, no crash
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
});
