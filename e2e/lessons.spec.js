// Block 8a lessons (lessons Req 11.2 to 11.4), keyboard only: Lesson 0 end to end, Lesson 1 with
// two wrong keys (one cleared by Backspace, one by the right key), the main menu panel moving on,
// a test out of Lesson 2 that is Not yet, Play these keys, axe on every lesson screen, and no
// page scrolls at three sizes. Leaving a lesson records nothing: flows.spec.js.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { endByPause, LIVE_WORD, toMenu } from "./helpers.js";

const h1 = (page, name) => page.getByRole("heading", { level: 1, name });
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("deadkeys:v1")));
const panel = (page) => page.locator(".rec-panel");

/** On the Lessons menu, select lesson `n` by keyboard: to the top first, then down. */
async function pick(page, n, name) {
  for (let i = 0; i < 14; i++) await page.keyboard.press("ArrowUp");
  for (let i = 0; i < n; i++) await page.keyboard.press("ArrowDown");
  await expect(page.locator(".lm-row[aria-current=true]")).toContainText(name);
}
/** Main menu > Lessons, by keyboard. */
async function toLessons(page) {
  await page.getByRole("button", { name: "Lessons", exact: true }).focus();
  await page.keyboard.press("Enter");
  await h1(page, "Lessons").waitFor();
}
/** Type the letter the line waits on until the done card shows; `extra(i)` may press more first. */
async function typeToDone(page, extra = async () => {}) {
  for (let i = 0; i < 800 && !(await page.locator(".ld-card").count()); i++) {
    await extra(i);
    await page.keyboard.press(await page.locator(".ch-wait").textContent());
  }
  await page.locator(".ld-card").waitFor();
}
/** Lesson 0 by keyboard: Enter takes Yes, then every line. Lands on its done card. */
async function lesson0(page) {
  await toLessons(page);
  await expect(page.locator(".lm-row[aria-current=true]")).toContainText("Meet your keyboard");
  await page.keyboard.press("Enter");
  await h1(page, "LESSON 00 // MEET YOUR KEYBOARD").waitFor();
  await expect(page.locator(".ls-coach-text")).toHaveText("Does your keyboard look like this?");
  await page.keyboard.press("Enter"); // Yes
  await typeToDone(page);
}
/** A fresh visit with Lesson 0 and Lesson 1 passed, by keyboard; ends on Lesson 1's card. */
async function passLesson1(page) {
  await toMenu(page);
  await lesson0(page);
  await page.keyboard.press("Escape"); // all lessons
  await h1(page, "Lessons").waitFor();
  await pick(page, 1, "Home row, left hand"); // the list keeps its selection within a visit
  await page.keyboard.press("Enter");
  await h1(page, "LESSON 01 // HOME ROW, LEFT HAND").waitFor();
  await typeToDone(page);
}
const BLOCKING = new Set(["serious", "critical"]);
async function audit(page, name) {
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => BLOCKING.has(v.impact));
  const rest = r.violations.filter((v) => !BLOCKING.has(v.impact)).map((v) => v.id);
  console.log(`AXE ${name}: ${r.violations.length} issue(s)${rest.length ? `; minor: ${rest}` : ""}`);
  for (const v of bad) {
    for (const n of v.nodes.slice(0, 6)) console.log(`  ${v.id} ${n.target} :: ${n.failureSummary}`);
  }
  expect.soft(bad.map((v) => `${v.id} x${v.nodes.length}`), name).toEqual([]); // report them all
}

test("Lesson 0 end to end, then Lesson 1 with two fixed wrong keys; the panel moves on", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await toMenu(page);
  await expect(panel(page)).toContainText("[L00]");
  await expect(panel(page)).toContainText("[WHY] New to typing? Start here.");
  await lesson0(page);
  await expect(page.locator(".ld-title")).toHaveText("Passed.");
  await expect(page.locator(".ld-card")).toContainText("finishing passes Lesson 0");
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape"); // Lessons > main menu
  await h1(page, "Main menu").waitFor();
  await expect(panel(page)).toContainText("[L01]");
  await toLessons(page);
  await pick(page, 1, "Home row, left hand");
  await page.keyboard.press("Enter");
  await h1(page, "LESSON 01 // HOME ROW, LEFT HAND").waitFor();
  await typeToDone(page, async (i) => {
    if (i === 1 || i === 3) await page.keyboard.press("q"); // in the warm-up, not the Check
    if (i === 1) {
      await expect(page.locator(".ch-wrong")).toHaveText("q");
      await page.keyboard.press("Backspace");
      await expect(page.locator(".ch-wrong")).toHaveCount(0);
    }
  });
  await expect(page.locator(".ld-title")).toHaveText("Passed.");
  const s = await saved(page);
  expect(s.lessonsPassed.map((l) => l.lessonId)).toEqual(["L00", "L01"]);
  const l01 = s.rounds.find((r) => r.lessonId === "L01");
  expect(l01.totalKeystrokes - l01.correctChars).toBe(2); // both wrong keys counted
  await page.keyboard.press("Escape");
  await expect(page.locator(".lm-row", { hasText: "Home row, left hand" })).toContainText("✓ PASSED");
  await page.keyboard.press("Escape");
  await h1(page, "Main menu").waitFor();
  await expect(panel(page)).toContainText("[L02]");
  await expect(panel(page)).toContainText("Lesson 2: Home row, right hand");
  await expect(panel(page)).toContainText("[TEST OUT] 95% to skip");
});

test("Lesson 0, No: the US keyboard line, then Go on", async ({ page }) => {
  await toMenu(page);
  await toLessons(page);
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "No", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".ls-coach-text")).toHaveText(
    "Dead Keys teaches the US keyboard for now. Some keys may sit in other places on yours. You can still go on.",
  );
  await expect(page.getByRole("button", { name: "Go on" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".ls-coach-text")).toContainText("Find the two keys with a small bump");
  await expect(page.locator(".ls-step.is-now")).toHaveText("[▶] 2. HOME KEYS");
});

test("a test out of Lesson 2 with misses is Not yet and records no pass", async ({ page }) => {
  test.setTimeout(60_000);
  await toMenu(page);
  await toLessons(page);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".lm-row[aria-current=true]")).toContainText("Home row, right hand");
  await page.keyboard.press("t");
  await h1(page, "TEST OUT // LESSON 02").waitFor();
  await typeToDone(page, async (i) => {
    if (i % 4 === 0) await page.keyboard.press("q");
  });
  await expect(page.locator(".ld-title")).toHaveText("Not yet.");
  await expect(page.locator(".ld-card")).toContainText("The full lesson will get you there.");
  expect((await saved(page)).lessonsPassed).toEqual([]);
});

test("Play these keys: only Lesson 1's keys fall, and Play again keeps them", async ({ page }) => {
  test.setTimeout(120_000);
  await passLesson1(page);
  await page.getByRole("button", { name: "Play these keys" }).focus();
  await page.keyboard.press("Enter");
  const words = async (n) => {
    const seen = [];
    for (let i = 0; i < n; i++) {
      const w = page.locator(LIVE_WORD).first();
      await w.waitFor();
      const text = await w.textContent();
      seen.push(text);
      await page.keyboard.type(text);
    }
    return seen;
  };
  for (const w of await words(4)) expect(w).toMatch(/^[asdfj ]+$/);
  await endByPause(page);
  await expect(page.locator(".rs-mode")).toHaveText("MODE: PRACTICE // PACK: YOUR KEYS");
  await page.keyboard.press("Enter"); // Play again
  for (const w of await words(3)) expect(w).toMatch(/^[asdfj ]+$/);
});

test("axe: Lessons menu, Lesson 0's question, a lesson (normal, wrong key, paused), done", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await toMenu(page);
  await audit(page, "main menu with the lesson panel");
  await toLessons(page);
  await audit(page, "lessons menu");
  await page.keyboard.press("Enter");
  await h1(page, "LESSON 00 // MEET YOUR KEYBOARD").waitFor();
  await audit(page, "lesson 0 question");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "Paused" }).getByRole("button", { name: "Leave lesson" }).click();
  await h1(page, "Lessons").waitFor();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await h1(page, "LESSON 01 // HOME ROW, LEFT HAND").waitFor();
  await audit(page, "lesson");
  await page.keyboard.press("q");
  await page.locator(".ch-wrong").waitFor();
  await audit(page, "lesson, wrong key");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog", { name: "Paused" }).waitFor();
  await audit(page, "lesson, paused");
  await page.keyboard.press("Enter"); // Resume has focus first
  await page.keyboard.press("Backspace");
  await typeToDone(page);
  await audit(page, "lesson done, passed");
  await page.keyboard.press("Escape");
  await pick(page, 2, "Home row, right hand");
  await page.keyboard.press("t");
  await h1(page, "TEST OUT // LESSON 02").waitFor();
  await typeToDone(page, async (i) => {
    if (i % 3 === 0) await page.keyboard.press("q");
  });
  await expect(page.locator(".ld-title")).toHaveText("Not yet.");
  await audit(page, "lesson done, not yet");
});

const fits = (page) =>
  page.evaluate(() => {
    const d = document.documentElement;
    return d.scrollHeight <= window.innerHeight && d.scrollWidth <= window.innerWidth;
  });
for (const size of [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
]) {
  test(`no lesson screen scrolls at ${size.width}x${size.height}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(size);
    await toMenu(page);
    expect(await fits(page), "main menu").toBe(true);
    await toLessons(page);
    expect(await fits(page), "lessons menu").toBe(true);
    await page.keyboard.press("Enter");
    await h1(page, "LESSON 00 // MEET YOUR KEYBOARD").waitFor();
    expect(await fits(page), "lesson 0 question").toBe(true);
    await page.getByRole("button", { name: "No", exact: true }).click();
    expect(await fits(page), "lesson 0 after No").toBe(true);
    await page.keyboard.press("Enter"); // Go on
    expect(await fits(page), "lesson 0 typing").toBe(true);
    await typeToDone(page);
    expect(await fits(page), "lesson done").toBe(true);
    await page.keyboard.press("Escape");
    await pick(page, 1, "Home row, left hand");
    await page.keyboard.press("Enter");
    await h1(page, "LESSON 01 // HOME ROW, LEFT HAND").waitFor();
    await page.keyboard.press("q");
    expect(await fits(page), "lesson, wrong key").toBe(true);
    await page.keyboard.press("Escape");
    expect(await fits(page), "lesson, paused").toBe(true);
  });
}
