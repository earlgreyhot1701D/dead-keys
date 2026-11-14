// PWA block: the manifest and icons load, the service worker installs, and after one visit the
// game opens and starts a round offline. The AI route is never cached: offline, a drill falls
// back to the built-in one (aiDrills.spec covers the fallback itself).
import { expect, test } from "@playwright/test";

test("installable: the manifest and its icons load", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const m = await (await request.get(href)).json();
  expect(m.display).toBe("standalone");
  for (const icon of m.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200);
});

test("after one visit, Dead Keys opens and plays offline", async ({ page, context }) => {
  await page.goto("/?sw");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".title-panel")).toBeVisible(); // the game's own screen: its code ran
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Dead Keys");
  const cached = await page.evaluate(async () => (await caches.keys()).join(","));
  expect(cached).toBe("deadkeys-v1");
  await context.setOffline(false);
});
