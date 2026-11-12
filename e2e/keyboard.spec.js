// Keyboard only, no mouse (shell Req 1.2): the title, a notice, the menu, Settings and the Clear
// dialog. Every step is a key press; nothing here calls click().
import { expect, test } from "@playwright/test";
import { KEY, seed, seededText } from "./helpers.js";

const BIG = "ugly/progress.200-rounds-all-keys.json";
const DAMAGED = '{"schemaVersion":1,"rounds":[';
const h1 = (page, name) => page.getByRole("heading", { level: 1, name });

/** Press Tab (or Shift+Tab) until `locator` has focus, at most `max` times. */
async function tabTo(page, locator, { back = false, max = 40 } = {}) {
  for (let i = 0; i < max; i++) {
    if (await locator.evaluate((n) => n === document.activeElement)) return;
    await page.keyboard.press(back ? "Shift+Tab" : "Tab");
  }
  throw new Error("could not reach it with Tab");
}

test("title: Tab to Start and press Enter; the privacy card's Continue by Enter", async ({
  page,
}) => {
  await page.goto("/");
  await expect(h1(page, "Dead Keys")).toBeFocused();
  await tabTo(page, page.getByRole("button", { name: "Start" }));
  await page.keyboard.press("Enter");
  await expect(h1(page, "Privacy")).toBeFocused();
  await tabTo(page, page.getByRole("button", { name: "Continue" }));
  await page.keyboard.press("Enter");
  await expect(h1(page, "Main menu")).toBeFocused();
});

test("a notice on the title: Enter and Space press its buttons and do not start the game", async ({
  page,
}) => {
  await seed(page, DAMAGED);
  await page.goto("/");
  const notice = page.locator("#notice");
  await expect(notice).toContainText("couldn't read your saved progress");
  await tabTo(page, notice.getByRole("button", { name: "Got it" }), { back: true });
  await page.keyboard.press("Enter");
  await expect(notice).toBeEmpty();
  await expect(h1(page, "Dead Keys")).toBeFocused(); // still on the title, focus not lost
});

test("a notice button works with Space too, and the download it offers happens", async ({
  page,
}) => {
  await seed(page, DAMAGED);
  await page.goto("/");
  const button = page.locator("#notice").getByRole("button", { name: "Download old data" });
  await tabTo(page, button, { back: true });
  const [download] = await Promise.all([page.waitForEvent("download"), page.keyboard.press(" ")]);
  expect(download.suggestedFilename()).toBe("dead-keys-old-data.json");
  await expect(h1(page, "Dead Keys")).toBeVisible();
});

test("menu: arrows move through it, Enter opens, Escape comes back; arrows on a notice stay put", async ({
  page,
}) => {
  await seed(page, DAMAGED);
  await page.goto("/");
  await page.keyboard.press("a"); // the damaged save means a fresh start, so the card comes first
  await expect(h1(page, "Privacy")).toBeFocused();
  await tabTo(page, page.getByRole("button", { name: "Continue" }));
  await page.keyboard.press("Enter");
  await expect(h1(page, "Main menu")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: /^Play/ })).toBeFocused();
  await page.keyboard.press("End");
  await expect(page.getByRole("button", { name: "About", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(h1(page, "Settings")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(h1(page, "Main menu")).toBeFocused();
  const gotIt = page.locator("#notice").getByRole("button", { name: "Got it" });
  await tabTo(page, gotIt, { back: true });
  await page.keyboard.press("ArrowDown");
  await expect(gotIt).toBeFocused(); // the menu did not take the key
});

test("settings by keyboard: switch, sound, speed; each is saved", async ({ page }) => {
  await seed(page, seededText(BIG));
  await page.goto("/");
  await page.keyboard.press("a");
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(h1(page, "Settings")).toBeFocused();
  await tabTo(page, page.getByLabel("AI drills"));
  await page.keyboard.press(" ");
  await expect(page.getByLabel("AI drills")).toBeChecked();
  await expect(page.getByLabel("AI drills")).toBeFocused(); // not rebuilt under the player
  await tabTo(page, page.getByLabel("Speed"));
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Speed")).toBeFocused();
  await expect(page.getByLabel("Speed")).toHaveAttribute("aria-valuetext", "1.1×");
  const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).settings, KEY);
  expect(saved).toMatchObject({ ai: true, speed: 1.1 });
});

test("the Clear dialog by keyboard: opens on Enter, Cancel first, Escape keeps everything", async ({
  page,
}) => {
  await seed(page, seededText(BIG));
  await page.goto("/");
  await page.keyboard.press("a");
  await page.keyboard.press("End");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  const clear = page.getByRole("button", { name: "Clear all progress" });
  await tabTo(page, clear);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Clear all progress?" });
  await expect(dialog.getByRole("button", { name: "Keep my progress" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(clear).toBeFocused();
  await expect(h1(page, "Settings")).toBeVisible();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Clear everything" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  // Clear removes the save itself, so nothing (or an empty save) is left.
  const rounds = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) ?? '{"rounds":[]}').rounds.length,
    KEY,
  );
  expect(rounds).toBe(0);
});
