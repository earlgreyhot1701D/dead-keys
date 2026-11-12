// What the page does on its own (shell Req 2.2, 2.3): it asks no other origin for anything, and
// under reduced motion the scanlines are off and nothing animates. Checked in a real browser,
// not by reading the CSS.
import { expect, test } from "@playwright/test";
import { openFromMenu, seed, seededText, toMenu } from "./helpers.js";

const SCREENS = ["Progress", "Settings", "How we count", "About"];

test("no request goes to any other origin, on any screen (Req 2.2)", async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const others = [];
  page.on("request", (r) => {
    const url = r.url();
    if (!url.startsWith("data:") && !url.startsWith("blob:") && new URL(url).origin !== origin) {
      others.push(url);
    }
  });
  await seed(page, seededText("ugly/progress.200-rounds-all-keys.json"));
  await toMenu(page);
  for (const label of SCREENS) {
    await openFromMenu(page, label);
    await page.keyboard.press("Escape");
    await page.getByRole("heading", { level: 1, name: "Main menu" }).waitFor();
  }
  await page.waitForLoadState("networkidle");
  expect(others).toEqual([]);
});

test("the font files come from our own origin", async ({ page, baseURL }) => {
  const fonts = [];
  page.on("response", (r) => {
    if (/\.woff2?$/.test(new URL(r.url()).pathname)) fonts.push(r.url());
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(fonts.length).toBeGreaterThan(0);
  for (const f of fonts) expect(new URL(f).origin).toBe(new URL(baseURL).origin);
});

const scanlines = (page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundImage);

test("reduced motion: no scanlines and nothing animating (Req 2.3)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("heading", { level: 1, name: "Dead Keys" }).waitFor();
  expect(await scanlines(page)).toBe("none");
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  const panel = await page.evaluate(() => {
    const p = document.querySelector(".panel, .title-panel");
    return p ? getComputedStyle(p).backgroundImage : "none";
  });
  expect(panel).not.toContain("repeating-linear-gradient");
});

test("without reduced motion the scanlines are on (so the test above can tell)", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("heading", { level: 1, name: "Dead Keys" }).waitFor();
  expect(await scanlines(page)).toContain("repeating-linear-gradient");
});
