// Side-by-side screenshots for Shara's visual check (PASS line): each built screen and its screen
// in the locked mock, at 1440x900 (and the built screens at 1366x768), saved to docs/screens/. Opt-in, so a normal e2e run does not
// rewrite the images:  $env:SCREENSHOTS=1; npx playwright test e2e/screenshots.spec.js
// The mock is opened from disk here only; nothing in src/ reads it.
import { fileURLToPath } from "node:url";
import { test } from "@playwright/test";
import {
  endByPause,
  LIVE_WORD,
  reach,
  seed,
  seededText,
  startRound,
  toMenu,
  typeWord,
} from "./helpers.js";

const OUT = fileURLToPath(new URL("../docs/screens/", import.meta.url));
const MOCK = new URL("../mock/index.html", import.meta.url).href;
const BIG = "ugly/progress.200-rounds-all-keys.json";
/** Built screen -> mock screen index (mock keys 1 to 6). Screens with no mock have null. */
const PAIRS = [
  { name: "title", mock: 0 },
  { name: "menu", mock: 1 },
  { name: "progress", mock: 5 },
  { name: "privacy", mock: null },
  { name: "settings", mock: null },
  { name: "how-we-count", mock: null },
  { name: "about", mock: null },
  { name: "picker", mock: null },
  { name: "falling", mock: 2 },
  { name: "corners", mock: 3 },
  { name: "results", mock: 4 },
];

/** Past the warm-up into wave 1, then a word locked with two letters typed, as the mocks show. */
async function midRound(page, mode) {
  await startRound(page, mode);
  for (let i = 0; i < 3; i++) await typeWord(page);
  await page.waitForTimeout(3000);
  const word = await page.locator(LIVE_WORD).last().textContent();
  await page.keyboard.type(word.slice(0, 2));
  await page.waitForTimeout(250);
}
const OPEN = {
  title: (page) => page.goto("/"),
  menu: (page) => toMenu(page),
  progress: (page) => reach(page, "Progress"),
  privacy: async (page) => {
    await toMenu(page);
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await page.keyboard.press("a");
  },
  settings: (page) => reach(page, "Settings"),
  "how-we-count": (page) => reach(page, "How we count"),
  about: (page) => reach(page, "About"),
  picker: (page) => reach(page, "Play"),
  falling: (page) => midRound(page, "Falling words"),
  corners: (page) => midRound(page, "Four corners"),
  results: async (page) => {
    await startRound(page, "Falling words");
    for (let i = 0; i < 5; i++) await typeWord(page);
    await endByPause(page);
  },
};

test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 to refresh docs/screens/");
test.use({ viewport: { width: 1440, height: 900 } });

/** Shara's Chromebook size: the same screens, fitted (fit.js), saved as built-<name>-1366.png. */
const SMALL = { width: 1366, height: 768 };

for (const { name, mock } of PAIRS) {
  test(`built at 1366x768: ${name}`, async ({ page }) => {
    await page.setViewportSize(SMALL);
    if (name !== "privacy") await seed(page, seededText(BIG));
    await OPEN[name](page);
    await page.getByRole("heading", { level: 1 }).waitFor({ state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.activeElement?.blur?.());
    await page.screenshot({ path: `${OUT}built-${name}-1366.png` });
  });
  test(`built: ${name}`, async ({ page }) => {
    if (name !== "privacy") await seed(page, seededText(BIG));
    await OPEN[name](page);
    await page.getByRole("heading", { level: 1 }).waitFor({ state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    if (name === "menu") {
      await page.keyboard.press("ArrowDown"); // the mock shows Play focused
    } else {
      await page.evaluate(() => document.activeElement?.blur?.()); // no focus ring in the picture
    }
    await page.screenshot({ path: `${OUT}built-${name}.png` });
  });
  if (mock === null) continue;
  test(`mock: ${name}`, async ({ page }) => {
    await page.goto(MOCK);
    await page.keyboard.press(String(mock + 1));
    // The mock's own screen switcher is a design-tool overlay, not part of the design.
    await page.addStyleTag({ content: "#nav{display:none!important}" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}mock-${name}.png` });
  });
}
