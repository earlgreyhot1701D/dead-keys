// Block 14 in a real browser: typing kiro on the title starts the Spec Wave, one wave of spec
// words that ends itself on results (specwave Reqs 1 to 3); and a sound set picked in Settings
// plays synthesized sounds in a round, with Off silent (sound Reqs 1 and 2).
import { expect, test } from "@playwright/test";
import { reach, seed, seededText, typeWord } from "./helpers.js";

/** Count the oscillators and noise bursts the page makes (Web Audio stays real underneath). */
const countAudio = (page) =>
  page.addInitScript(() => {
    window.__audio = 0;
    const AC = window.AudioContext;
    window.AudioContext = class extends AC {
      createOscillator() {
        window.__audio++;
        return super.createOscillator();
      }
      createBufferSource() {
        window.__audio++;
        return super.createBufferSource();
      }
    };
  });

test("kiro on the title: one wave of spec words, then results say Spec Wave", async ({ page }) => {
  await seed(page, seededText("normal/progress.basic.json"));
  await page.goto("/");
  await page.keyboard.type("kiro");
  await expect(page.getByRole("heading", { level: 1, name: "Spec Wave" })).toBeAttached();
  await expect(page.locator("#live")).toContainText("Spec Wave. A bonus wave of words from the spec.");
  const first = await typeWord(page);
  expect(["spec", "specs", "steering", "steer", "hook", "hooks", "requirements", "design", "tasks", "task", "agent", "agentic", "prompt", "context", "acceptance", "criteria", "build", "ship", "review", "refine"]).toContain(first);
  for (let i = 0; i < 9; i++) await typeWord(page);
  await expect(page.getByRole("heading", { level: 1, name: "DEAD KEYS // ROUND RESULTS" })).toBeVisible();
  await expect(page.locator(".rs-mode")).toHaveText("MODE: SPECWAVE // PACK: SPEC WAVE");
});

test("a k then another key starts the game as always", async ({ page }) => {
  await seed(page, seededText("normal/progress.basic.json"));
  await page.goto("/");
  await page.keyboard.press("k");
  await page.keyboard.press("a");
  await expect(page.getByRole("heading", { level: 1, name: "Main menu" })).toBeVisible();
});

test("Typewriter makes sound in a round; Off makes none", async ({ page }) => {
  await countAudio(page);
  await reach(page, "Settings");
  await expect(page.locator("#st-sound-hint")).toContainText("Off by default.");
  await page.getByLabel("Sound").selectOption("typewriter");
  const sample = await page.evaluate(() => window.__audio);
  expect(sample).toBeGreaterThan(0); // the bell sample
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await typeWord(page);
  expect(await page.evaluate(() => window.__audio)).toBeGreaterThan(sample + 3); // clacks
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "Paused" }).waitFor();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Sound").selectOption("off");
  const before = await page.evaluate(() => window.__audio);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await typeWord(page);
  expect(await page.evaluate(() => window.__audio)).toBe(before);
});
