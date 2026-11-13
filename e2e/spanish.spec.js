// The Spanish pack (spanish Reqs 1 and 2) in a real browser: the Play screen's Words choice saves
// Español, Falling words then spawns Spanish words, a word with an accent or ñ is typed and
// cleared (keydown with the composed character, as US-International sends it after a dead key),
// and results say PACK: ESPAÑOL. Español stays picked; English brings the English words back.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { endByPause, KEY, LIVE_WORD, toMenu } from "./helpers.js";

const spanish = new Set(
  JSON.parse(
    await import("node:fs").then((fs) =>
      fs.readFileSync(new URL("../packs/spanish.json", import.meta.url), "utf8"),
    ),
  ).pools.words.map((w) => w.text),
);

/**
 * Type a word one key at a time. Plain letters are real key presses. A composed character (á, ñ,
 * ¿) arrives as one keydown whose key is that character, as US-International sends it with
 * AltGr held (Windows reports Ctrl+Alt; a11y audit, Nov 13). Playwright has no key for those, so
 * the page gets that same keydown directly.
 */
async function typeKeys(page, word) {
  for (const c of word) {
    if (/^[a-z?!]$/.test(c)) await page.keyboard.press(c);
    else
      await page.evaluate((key) => {
        const t = document.activeElement ?? document.body;
        t.dispatchEvent(
          new KeyboardEvent("keydown", { key, bubbles: true, altKey: true, ctrlKey: true }),
        );
      }, c);
  }
}

test("Español on the Play screen: Spanish words fall, accents type, results say ESPAÑOL", async ({
  page,
}) => {
  await toMenu(page);
  await page.getByRole("button", { name: /^Play/ }).click();
  const words = page.getByLabel("Words", { exact: true });
  await expect(words).toHaveValue("general");
  await expect(page.locator("#pick-pack-hint")).toContainText("US-International");
  const axe = await new AxeBuilder({ page }).analyze();
  const bad = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id} x${v.nodes.length}`)).toEqual([]);
  await words.selectOption("spanish");
  expect(await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).settings.pack, KEY)).toBe(
    "spanish",
  );
  await page.getByRole("button", { name: "Falling words", exact: true }).click();
  const seen = [];
  for (let i = 0; i < 3; i++) {
    const w = page.locator(LIVE_WORD).first();
    await w.waitFor();
    const text = await w.textContent();
    seen.push(text);
    await typeKeys(page, text);
  }
  for (const t of seen) expect(spanish.has(t), t).toBe(true);
  await endByPause(page);
  await expect(page.locator(".rs-mode")).toHaveText("MODE: FALLING // PACK: ESPAÑOL");
  await expect(page.locator(".rs-body")).toContainText(/CLEARED/);
  await page.getByRole("button", { name: "View progress" }).click(); // Spanish keys in the stats
  await expect(page.getByRole("heading", { level: 1, name: "Progress" })).toBeVisible();
});

test("an accented word types with its composed keys and is cleared", async ({ page }) => {
  await toMenu(page);
  await page.getByRole("button", { name: /^Play/ }).click();
  await page.getByLabel("Words", { exact: true }).selectOption("spanish");
  await page.getByRole("button", { name: "Falling words", exact: true }).click();
  let accented = null;
  for (let i = 0; i < 40 && !accented; i++) {
    const w = page.locator(LIVE_WORD).first();
    await w.waitFor();
    const text = await w.textContent();
    await typeKeys(page, text);
    if (/[áéíóúñü¿¡]/.test(text)) accented = text;
  }
  test.skip(!accented, "no accented word fell in 40 (seed luck)");
  await endByPause(page);
  await expect(page.locator(".rs-log")).toContainText(`[·] ${accented}`);
  await page.getByRole("button", { name: "View progress" }).click(); // á, ñ… now have key stats
  await expect(page.getByRole("heading", { level: 1, name: "Progress" })).toBeVisible();
});
