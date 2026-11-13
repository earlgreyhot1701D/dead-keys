// The share card (share Reqs 1 to 3) in a real browser: the window opens from results with the
// card drawn as a labeled image, Download PNG saves dead-keys-<wpm>wpm.png, Copy text fills the
// clipboard, Escape closes and focus returns, the window fits, and axe finds nothing serious.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { endByPause, startRound, typeWord } from "./helpers.js";

async function openCard(page) {
  await startRound(page, "Falling words");
  await typeWord(page);
  await endByPause(page);
  const btn = page.getByRole("button", { name: "Share card", exact: true });
  await btn.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "SHARE CARD" });
  await dialog.waitFor();
  return { btn, dialog };
}

test("Share card: the card, Download PNG, Copy text, Escape back to the button", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const { btn, dialog } = await openCard(page);
  const img = dialog.getByRole("img", { name: /^Dead Keys round card: \d+ WPM, \d+% accuracy/ });
  await expect(img).toBeVisible();
  const download = dialog.getByRole("button", { name: "Download PNG" });
  await expect(download).toBeFocused();
  // The card is drawn: some pixels are not the background.
  const inked = await page.evaluate(() => {
    const c = document.querySelector(".share-frame canvas");
    const px = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i] !== 10 || px[i + 1] !== 18) n++;
    return n;
  });
  expect(inked).toBeGreaterThan(10_000);
  const [file] = await Promise.all([page.waitForEvent("download"), download.click()]);
  expect(file.suggestedFilename()).toMatch(/^dead-keys-\d+wpm\.png$/);
  await expect(dialog.getByRole("status")).toHaveText("Saved.");
  await dialog.getByRole("button", { name: "Copy text" }).click();
  await expect(dialog.getByRole("status")).toHaveText("Copied.");
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toMatch(/^I typed \d+ WPM at \d+% accuracy in Dead Keys, .+ dead-keys\.vercel\.app$/);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(btn).toBeFocused();
  await expect(page.getByRole("heading", { level: 1, name: "DEAD KEYS // ROUND RESULTS" })).toBeVisible();
});

test("Share card window: fits the screen, and axe finds nothing serious", async ({ page }) => {
  const { dialog } = await openCard(page);
  const box = await dialog.boundingBox();
  const vp = page.viewportSize();
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id} x${v.nodes.length}`)).toEqual([]);
});
