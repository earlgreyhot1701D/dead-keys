// Attract mode (attract Reqs 1 to 3) in a real browser, with Playwright's clock so the 3-second
// idle wait takes no real time: the still frame, the live demo with its Pause demo button, Tab
// back to the still frame, nothing under reduced motion, and axe on the playing demo. Plus the
// ghost race's two "how would I know" lines (ghost Req 5): Play's hint and How we count's section.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { reach, toMenu } from "./helpers.js";

test("after 3 idle seconds the game plays itself; Pause demo works; Tab stops it", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const controls = page.locator(".demo-controls");
  await expect(controls).toBeHidden();
  await expect(page.locator(".title-scene")).toBeVisible();
  await page.clock.fastForward(4_000);
  await page.clock.runFor(3_000);
  await expect(controls).toBeVisible();
  await expect(controls).toContainText("[Demo playing]");
  await expect(page.locator(".attract-field .fw-word").first()).toBeAttached(); // a live word
  // A cleared word fades out over 250 ms (playMoments.css); caught mid-fade it reads as low
  // contrast. That was the attract test's occasional failure (Nov 13), so it's left out here.
  const axe = await new AxeBuilder({ page }).exclude('[data-moment="clear"]').analyze();
  const bad = axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of bad) for (const n of v.nodes) console.log(`AXE ${v.id} ${n.target}`);
  expect(bad.map((v) => `${v.id} x${v.nodes.length}`)).toEqual([]);
  const pause = page.getByRole("button", { name: "Pause demo" });
  await pause.click();
  const resumeBtn = page.getByRole("button", { name: "Resume demo" });
  await expect(resumeBtn).not.toHaveAttribute("aria-pressed"); // the label carries the state
  await expect(controls).toContainText("[Demo paused]");
  await page.getByRole("button", { name: "Resume demo" }).click();
  await expect(controls).toContainText("[Demo playing]");
  await page.keyboard.press("Tab"); // keys on the demo's own button never stop it...
  await expect(controls).toBeVisible();
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press("Tab"); // ...any other input brings the still frame back
  await expect(controls).toBeHidden();
  await expect(page.locator(".title-scene")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Dead Keys" })).toBeVisible();
});

test("under reduced motion the demo never starts", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await page.clock.fastForward(20_000);
  await expect(page.locator(".demo-controls")).toBeHidden();
  await expect(page.locator(".attract-field")).toHaveCount(0);
});

test("the ghost race says how it works before it happens: Play's hint and How we count", async ({
  page,
}) => {
  await toMenu(page);
  await page.getByRole("button", { name: /^Play/ }).click();
  await expect(page.locator(".picker-rules")).toContainText(
    "Beat your best at 90% accuracy or better and it becomes your ghost. Next round, you race it.",
  );
  await reach(page, "How we count");
  await expect(page.locator("#main")).toContainText("Each new best becomes your ghost");
});
