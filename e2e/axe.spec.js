// axe-core on every built screen (shell Req 8.1). Serious and critical issues fail the test. Every
// other finding (moderate, minor) and every "needs review" item is printed, so the gate report can
// say exactly what axe saw. Uses axe's full default rule set, best practices included.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openFromMenu, reach, seed, seededText, toMenu } from "./helpers.js";

const BIG = "ugly/progress.200-rounds-all-keys.json";
const FEW = "normal/progress.basic.json";
const BLOCKING = new Set(["serious", "critical"]);

/** Run axe, print a one-line summary per issue, fail on serious or critical. */
async function audit(page, name) {
  const r = await new AxeBuilder({ page }).analyze();
  const line = (v) => `${v.id} (${v.impact ?? "n/a"}) x${v.nodes.length}`;
  const bad = r.violations.filter((v) => BLOCKING.has(v.impact));
  const rest = r.violations.filter((v) => !BLOCKING.has(v.impact));
  console.log(
    `AXE ${name}: ${r.violations.length} issue(s), ${r.incomplete.length} to review` +
      (rest.length ? `; minor: ${rest.map(line).join(", ")}` : "") +
      (r.incomplete.length ? `; review: ${r.incomplete.map((v) => v.id).join(", ")}` : ""),
  );
  expect(bad.map(line), `${name}: serious or critical`).toEqual([]);
}

test("title", async ({ page }) => {
  await page.goto("/");
  await audit(page, "title");
});

test("privacy card (first run)", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("a");
  await page.getByRole("heading", { level: 1, name: "Privacy" }).waitFor();
  await audit(page, "privacy");
});

test("main menu", async ({ page }) => {
  await toMenu(page);
  await audit(page, "menu");
});

for (const [label, seedPath] of [
  ["progress, nothing saved", null],
  ["progress, a few rounds", FEW],
  ["progress, 200 rounds", BIG],
]) {
  test(label, async ({ page }) => {
    if (seedPath) await seed(page, seededText(seedPath));
    await reach(page, "Progress");
    await audit(page, label);
  });
}

test("settings", async ({ page }) => {
  await reach(page, "Settings");
  await audit(page, "settings");
});

test("settings with the Clear dialog open", async ({ page }) => {
  await seed(page, seededText(BIG));
  await reach(page, "Settings");
  await page.getByRole("button", { name: "Clear all progress" }).click();
  await page.getByRole("dialog").waitFor();
  await audit(page, "settings + clear dialog");
});

test("How we count", async ({ page }) => {
  await reach(page, "How we count");
  await audit(page, "how we count");
});

test("About", async ({ page }) => {
  await reach(page, "About");
  await audit(page, "about");
});

test("with a notice showing (damaged saved data)", async ({ page }) => {
  await seed(page, '{"schemaVersion":1,"rounds":[');
  await page.goto("/");
  await page.locator("#notice").getByRole("button", { name: "Got it" }).waitFor();
  await audit(page, "title + notice");
  await page.keyboard.press("a");
  await page.getByRole("heading", { level: 1, name: "Privacy" }).waitFor();
  await page.getByRole("button", { name: "Continue" }).click();
  await openFromMenu(page, "Settings");
  await audit(page, "settings + notice + old data button");
});

test.describe("phone width", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("title and menu with the phone notice", async ({ page }) => {
    await page.goto("/");
    await audit(page, "title + phone notice");
    await page.getByRole("button", { name: "Start" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("heading", { level: 1, name: "Main menu" }).waitFor();
    await audit(page, "menu + phone notice");
    await openFromMenu(page, "Progress");
    await audit(page, "progress at phone width");
  });
});
