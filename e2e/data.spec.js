// Your data in a real browser: Clear and Import ask first, Escape cancels without going back,
// export downloads, and the notice bar shows up for damaged data and a change in another tab.
import { expect, test } from "@playwright/test";
import { KEY, reach, seed, seededText } from "./helpers.js";

const BIG = "ugly/progress.200-rounds-all-keys.json";

test("Clear asks first; Escape cancels and stays on Settings; Clear everything clears", async ({
  page,
}) => {
  await seed(page, seededText(BIG));
  await reach(page, "Settings");
  const rounds = () =>
    page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? '{"rounds":[]}').rounds.length, KEY);
  expect(await rounds()).toBe(200);
  await page.getByRole("button", { name: "Clear all progress" }).click();
  const dialog = page.getByRole("dialog", { name: "Clear all progress?" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Keep my progress" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  expect(await rounds()).toBe(200);
  await page.getByRole("button", { name: "Clear all progress" }).click();
  await dialog.getByRole("button", { name: "Clear everything" }).click();
  await expect(dialog).toBeHidden();
  expect(await rounds()).toBe(0);
  await expect(page.getByRole("button", { name: "Clear all progress" })).toBeFocused();
});

test("Download backup gives a file, and that file imports after a yes", async ({ page }, info) => {
  await seed(page, seededText(BIG));
  await reach(page, "Settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download backup" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("dead-keys-backup.json");
  const path = info.outputPath("backup.json");
  await download.saveAs(path);
  await page.getByLabel("Import a backup").setInputFiles(path);
  const dialog = page.getByRole("dialog", { name: "Replace your progress?" });
  await expect(dialog).toContainText("This backup has 200 rounds");
  await dialog.getByRole("button", { name: "Keep what I have" }).click();
  await expect(dialog).toBeHidden();
  await page.getByLabel("Import a backup").setInputFiles(path);
  await dialog.getByRole("button", { name: "Replace my progress" }).click();
  await expect(dialog).toBeHidden();
});

test("a file that is not a backup shows its reason and changes nothing", async ({ page }) => {
  await seed(page, seededText(BIG));
  await reach(page, "Settings");
  await page
    .getByLabel("Import a backup")
    .setInputFiles({ name: "nope.json", mimeType: "application/json", buffer: Buffer.from("nope") });
  await expect(page.locator("#import-status")).toContainText("Dead Keys backup");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#notice")).toContainText("That file couldn't be loaded");
});

test("damaged saved data: the notice shows, Got it hides it, old data can be downloaded", async ({
  page,
}) => {
  await seed(page, '{"schemaVersion":1,"rounds":[');
  await page.goto("/");
  const notice = page.locator("#notice");
  await expect(notice).toContainText("We couldn't read your saved progress");
  await expect(notice).toHaveAttribute("role", "status");
  await notice.getByRole("button", { name: "Got it" }).click();
  await expect(notice).toBeEmpty();
});

test("a save from another tab stops this tab from saving and offers a reload", async ({
  context,
  page,
}) => {
  await seed(page, seededText(BIG));
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/");
  await other.evaluate((k) => {
    const p = JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k, JSON.stringify({ ...p, createdAt: p.createdAt + 1 }));
  }, KEY);
  await expect(page.locator("#notice")).toContainText("changed in another Dead Keys tab");
  await expect(page.locator("#notice").getByRole("button", { name: "Reload" })).toBeVisible();
});
