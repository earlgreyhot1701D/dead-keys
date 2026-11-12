// The read-only screens and the phone notice in a real browser. The keyboard heat map must tell
// its five bands apart by more than color.
import { expect, test } from "@playwright/test";
import { reach, seed, seededText } from "./helpers.js";

const BIG = "ugly/progress.200-rounds-all-keys.json";

test("Progress with 200 rounds: a legend, five different band looks, and words for a screen reader", async ({
  page,
}) => {
  await seed(page, seededText(BIG));
  await reach(page, "Progress");
  const looks = await page.$$eval(".kb-swatch", (nodes) =>
    nodes.map((n) => {
      const s = getComputedStyle(n);
      return `${s.borderTopStyle}|${s.borderTopWidth}|${s.backgroundImage}|${n.textContent}`;
    }),
  );
  expect(looks).toHaveLength(5);
  expect(new Set(looks).size).toBe(5); // no two bands look the same without color
  const glyphs = await page.$$eval(".kb-grid .kb-glyph", (nodes) => nodes.map((n) => n.textContent));
  expect(glyphs.length).toBeGreaterThan(40);
  expect(glyphs.every((g) => g.trim() !== "")).toBe(true);
  await expect(page.locator(".kb-grid")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("heading", { name: "Heat map in words" })).toBeVisible();
  const sentences = await page.locator("section[aria-labelledby=pg-diag] li").count();
  expect(sentences).toBeLessThanOrEqual(3);
});

test("Progress with nothing saved says so and shows 'Not enough yet' on every key", async ({
  page,
}) => {
  await reach(page, "Progress");
  await expect(page.getByText("Play a round and your keys will show up here.")).toBeVisible();
  await expect(page.getByText("No personal bests yet. A best needs 90% accuracy or better.")).toBeVisible();
  // the stat caps only; TAB, SHIFT and the other inert keys carry no band
  const bands = await page.$$eval(".kb-grid .kb-cap, .kb-grid .kb-space", (n) =>
    n.map((k) => k.className),
  );
  expect(bands.length).toBe(47);
  expect(bands.every((c) => c.includes("band-noData"))).toBe(true);
});

test("How we count and About: sections, safe links, a way back", async ({ page }) => {
  await reach(page, "How we count");
  await expect(page.getByRole("heading", { level: 2 })).toHaveCount(8);
  await expect(page.getByText("Escape drops the lock. If nothing is locked, Escape pauses.")).toBeVisible();
  const source = page.getByRole("link", { name: "Read the source code" });
  await expect(source).toHaveAttribute("rel", /noopener/);
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "About", exact: true }).click();
  const links = page.locator("main a[target=_blank]");
  expect(await links.count()).toBeGreaterThan(5);
  for (const rel of await links.evaluateAll((n) => n.map((a) => a.rel))) {
    expect(rel).toContain("noopener");
  }
  await expect(page.locator('a[href="/licenses/JetBrainsMono-OFL.txt"]')).toBeVisible();
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the notice shows, Got it hides it for the visit, the menus still work", async ({ page }) => {
    await page.goto("/");
    const notice = page.locator("[data-phone-notice]");
    await expect(notice).toContainText("needs a physical keyboard");
    await notice.getByRole("button", { name: "Got it" }).click();
    await expect(notice).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "Dead Keys" })).toBeFocused();
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Main menu" })).toBeVisible();
    await expect(notice).toHaveCount(0); // stays hidden on the next screen
    await page.getByRole("button", { name: "About", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
  });
});
