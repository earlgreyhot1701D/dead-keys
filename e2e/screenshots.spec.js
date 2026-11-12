// Side-by-side screenshots for Shara's visual check (PASS line): each built screen and its screen
// in the locked mock, at 1440x900, saved to docs/screens/. Opt-in, so a normal e2e run does not
// rewrite the images:  $env:SCREENSHOTS=1; npx playwright test e2e/screenshots.spec.js
// The mock is opened from disk here only; nothing in src/ reads it.
import { fileURLToPath } from "node:url";
import { test } from "@playwright/test";
import { reach, seed, seededText, toMenu } from "./helpers.js";

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
];
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
};

test.skip(!process.env.SCREENSHOTS, "set SCREENSHOTS=1 to refresh docs/screens/");
test.use({ viewport: { width: 1440, height: 900 } });

for (const { name, mock } of PAIRS) {
  test(`built: ${name}`, async ({ page }) => {
    if (name !== "privacy") await seed(page, seededText(BIG));
    await OPEN[name](page);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.activeElement?.blur?.()); // no focus ring in the picture
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
