// Play, keyboard only (play Req 9.2): every step is a key press; nothing here clicks. Falling
// words and Four corners through the warm-up, a cleared word announced, a wrong key shown red
// with 'TYPE "<letter>" TO FIX' and cleared by Backspace, the ship under the locked word, unique
// first letters on screen, pause and resume with Escape, results and its Main menu button, and
// Practice ended from the pause dialog.
import { expect, test } from "@playwright/test";
import { endByPause, KEY, LIVE_WORD, startRound, typeWord } from "./helpers.js";

const h1 = (page, name) => page.getByRole("heading", { level: 1, name });
/** A letter that is not `next`, so it is a wrong key (a space would be ignored, Req 8.2). */
const wrongFor = (next) => (next === "z" ? "q" : "z");

for (const [mode, card, bar, wrong] of [
  ["Falling words", ".fw", ".fw-lock-bar", ".fw-wrong"],
  ["Four corners", ".cw", ".cw-lock-bar", ".cw-wrong"],
]) {
  test(`${mode}: lock, a wrong key shown red, Backspace clears it, finish, announced`, async ({
    page,
  }) => {
    await startRound(page, mode);
    await expect(page.locator(".play-hud")).toContainText("WARM-UP");
    await expect(page.locator(".foot-hint")).toHaveText("TYPE A WORD'S FIRST LETTER TO LOCK IT");
    const w = page.locator(LIVE_WORD).first();
    await w.waitFor();
    const word = await w.textContent();
    await page.keyboard.press(word[0]);
    const locked = page.locator(`${card}.is-locked`);
    await expect(locked).toBeVisible();
    await expect(page.locator(".foot-hint")).toHaveText("FINISH IT BEFORE IT LANDS. [ESC] LETS GO");
    const bad = wrongFor(word[1]);
    await page.keyboard.press(bad);
    await expect(locked).toHaveClass(/is-wrong/);
    await expect(locked.locator(wrong)).toHaveText(bad);
    await expect(locked.locator(bar)).toContainText(`TYPE "${word[1]}" TO FIX`);
    await expect(page.locator(".foot-hint")).toHaveText("TYPE THE AMBER LETTER. [ESC] LETS GO");
    await page.keyboard.press("Backspace");
    await expect(locked).not.toHaveClass(/is-wrong/);
    await expect(locked.locator(bar)).not.toContainText("TO FIX");
    await expect(locked).toBeVisible(); // Backspace cleared the red key, never the word
    await page.keyboard.type(word.slice(1));
    await expect(page.locator("#live")).toContainText(`Cleared ${word}.`);
    await expect(page.locator(".play-hud")).toContainText("· 2 LEFT");
  });
}

test("Falling words: the ship slides under the locked word's lane and stays there", async ({
  page,
}) => {
  await startRound(page, "Falling words");
  const w = page.locator(LIVE_WORD).first();
  await w.waitFor();
  await page.keyboard.press((await w.textContent())[0]);
  const center = (sel) =>
    page.locator(sel).evaluate((n) => {
      const r = n.getBoundingClientRect();
      return r.left + r.width / 2;
    });
  const card = ".fw.is-locked .fw-lock";
  await expect.poll(async () => Math.abs((await center(".fall-station")) - (await center(card))))
    .toBeLessThan(3); // after the 180 ms slide
  const shipAt = await center(".fall-station");
  await page.keyboard.press("Escape"); // let go: the ship stays put
  await expect(page.locator(".fw.is-locked")).toHaveCount(0);
  await page.waitForTimeout(300);
  expect(Math.abs((await center(".fall-station")) - shipAt)).toBeLessThan(1);
});

test("after the warm-up, the words on screen never share a first letter", async ({ page }) => {
  test.setTimeout(60_000);
  await startRound(page, "Falling words", { fast: true });
  for (let i = 0; i < 3; i++) await typeWord(page); // the three warm-up words
  await expect(page.locator(".play-hud")).toContainText("WAVE 01");
  for (let look = 0; look < 6; look++) {
    await page.waitForTimeout(500);
    const words = await page.locator(LIVE_WORD).allTextContents();
    const firsts = words.map((x) => x[0]);
    expect(new Set(firsts).size, words.join(" ")).toBe(firsts.length);
  }
  expect((await page.locator(LIVE_WORD).allTextContents()).length).toBeGreaterThan(1);
});

test("Escape pauses and resumes; End round saves it; results' Main menu goes home", async ({
  page,
}) => {
  await startRound(page, "Falling words");
  const before = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).rounds.length, KEY);
  await typeWord(page);
  await page.keyboard.press("Escape"); // nothing locked: pause
  const paused = page.getByRole("dialog", { name: "Paused" });
  await expect(paused.getByRole("button", { name: "Resume" })).toBeFocused();
  await expect(page.locator("#live")).toContainText("Paused.");
  await page.keyboard.press("Escape"); // Escape in the dialog resumes
  await expect(paused).toBeHidden();
  await endByPause(page);
  await expect(h1(page, "DEAD KEYS // ROUND RESULTS")).toBeFocused();
  await expect(page.locator(".rs-body")).toContainText("1"); // one word cleared
  const after = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).rounds.length, KEY);
  expect(after).toBe(Math.min(before + 1, 200));
  await page.locator(".rs-head").getByRole("button", { name: "Main menu" }).focus();
  await page.keyboard.press("Enter");
  await expect(h1(page, "Main menu")).toBeFocused();
});

test("results: Enter plays the same mode again, Escape goes to the main menu", async ({ page }) => {
  await startRound(page, "Four corners");
  await endByPause(page);
  await expect(page.locator(".rs-mode")).toHaveText("MODE: CORNERS // PACK: GENERAL");
  await page.keyboard.press("Enter");
  await expect(h1(page, "Four corners")).toBeAttached();
  await page.locator(".cn-field").waitFor();
  await endByPause(page);
  await page.keyboard.press("Escape");
  await expect(h1(page, "Main menu")).toBeFocused();
});

test("Practice: no lives, coaching in the footer, ended from the pause dialog", async ({ page }) => {
  await startRound(page, "Falling words"); // reach the menu first, then leave the round
  await endByPause(page);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Practice", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(h1(page, "Practice")).toBeAttached();
  await expect(page.locator(".play-hud")).toContainText(
    "No lives, no clock pressure. End the round from the pause menu.",
  );
  await expect(page.locator(".play-hud")).not.toContainText("LIVES:");
  await expect(page.locator(".foot-hint")).toHaveText("TYPE A WORD'S FIRST LETTER TO LOCK IT");
  await typeWord(page);
  await endByPause(page);
  await expect(page.locator(".rs-over")).toContainText("ROUND_OVER // PRACTICE");
});
