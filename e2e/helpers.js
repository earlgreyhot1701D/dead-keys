// Shared by the e2e specs. Fixtures are read here, in tests only; nothing in src/ imports them.
import { readFileSync } from "node:fs";

export const KEY = "deadkeys:v1";

/** A fixture's `value`, parsed. */
export function fixture(path) {
  return JSON.parse(readFileSync(new URL(`../fixtures/${path}`, import.meta.url), "utf8")).value;
}

/** Saved-progress text for a fixture, with the privacy card already seen. */
export function seededText(path) {
  const p = fixture(path);
  return JSON.stringify({ ...p, settings: { ...(p.settings ?? {}), privacySeen: true } });
}

/** Put text in storage before the page loads, but only if nothing is saved yet (so reloads keep edits). */
export async function seed(page, text) {
  await page.addInitScript(
    ([k, v]) => {
      if (!localStorage.getItem(k)) localStorage.setItem(k, v);
    },
    [KEY, text],
  );
}

/** Start the app and get to the main menu, through the privacy card if it shows. */
export async function toMenu(page) {
  await page.goto("/");
  await page.keyboard.press("a");
  const heading = page.getByRole("heading", { level: 1 });
  await heading.waitFor();
  if ((await heading.textContent()) === "Privacy") {
    await page.getByRole("button", { name: "Continue" }).click();
  }
  await page.getByRole("heading", { level: 1, name: "Main menu" }).waitFor();
}

/** From the menu, open a screen by its menu label. */
export async function openFromMenu(page, label, title = label) {
  await page.getByRole("navigation", { name: "Main menu" }).getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("heading", { level: 1, name: title }).waitFor();
}

/** Menu, then a screen. */
export async function reach(page, label, title = label) {
  await toMenu(page);
  await openFromMenu(page, label, title);
}

/** Every step a key press: the menu's Play, the picker (top speed if `fast`), then a choice. */
export async function startRound(page, name, { fast = false } = {}) {
  await seed(page, seededText("normal/progress.basic.json"));
  await toMenu(page);
  await page.getByRole("button", { name: /^Play/ }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { level: 1, name: "Play" }).waitFor();
  if (fast) {
    await page.getByLabel("Starting speed").focus();
    await page.keyboard.press("End"); // 2×, so words land sooner
  }
  await page.getByRole("button", { name, exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.locator(".fall-field, .cn-field").waitFor();
}

/** A word card still in play (not one shrinking away after a clear). */
export const LIVE_WORD = ':is(.fw, .cw):not([data-moment="clear"]) :is(.fw-word, .cw-word)';

/** Wait for a word, type all of it, and return it. */
export async function typeWord(page) {
  const w = page.locator(LIVE_WORD).first();
  await w.waitFor();
  const text = await w.textContent();
  await page.keyboard.type(text);
  return text;
}

/** End the round from the pause dialog, by keyboard, and land on results. */
export async function endByPause(page) {
  await page.keyboard.press("Escape"); // nothing locked: pause
  await page.getByRole("dialog", { name: "Paused" }).waitFor();
  await page.keyboard.press("Tab"); // Resume has focus first; End round is next
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { level: 1, name: "DEAD KEYS // ROUND RESULTS" }).waitFor();
}
