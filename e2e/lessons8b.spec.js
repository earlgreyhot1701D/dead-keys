// Block 8b lessons (lessons-8b Req 10), keyboard only: Lessons 7, 9 and 12 typed to Passed; a
// test out of Lesson 11 with misses is Not yet; each glossary dialog opens and closes by
// keyboard; Finger colors off shows Lesson 8 without colors; axe on Lessons 7 to 13, a glossary
// dialog and Settings; and no lesson screen scrolls with the number row at three sizes.
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { toMenu } from "./helpers.js";

const h1 = (page, name) => page.getByRole("heading", { level: 1, name });
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("deadkeys:v1")));
const NAMES = {
  3: "Full home row",
  7: "Capitals",
  8: "Punctuation",
  9: "Numbers, left",
  10: "Numbers, right",
  11: "Symbols",
  12: "Real-world strings",
  13: "Common pairs",
};

async function toLessons(page) {
  await page.getByRole("button", { name: "Lessons", exact: true }).focus();
  await page.keyboard.press("Enter");
  await h1(page, "Lessons").waitFor();
}
/** Select lesson `n` by keyboard and press `key` (Enter starts it, t tests out). */
async function open(page, n, key = "Enter") {
  for (let i = 0; i < 14; i++) await page.keyboard.press("ArrowUp");
  for (let i = 0; i < n; i++) await page.keyboard.press("ArrowDown");
  await expect(page.locator(".lm-row[aria-current=true]")).toContainText(NAMES[n]);
  await page.keyboard.press(key);
  await page.locator(".ls-kb").waitFor();
}
/** Type the waiting character until the done card shows; `extra(i)` may press more first. */
async function typeToDone(page, extra = async () => {}) {
  for (let i = 0; i < 900 && !(await page.locator(".ld-card").count()); i++) {
    await extra(i);
    await page.keyboard.press(await page.locator(".ch-wait").textContent());
  }
  await page.locator(".ld-card").waitFor();
}
async function audit(page, name) {
  const r = await new AxeBuilder({ page }).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  console.log(`AXE ${name}: ${r.violations.length} issue(s)`);
  for (const v of bad) for (const n of v.nodes.slice(0, 4)) console.log(`  ${v.id} ${n.target}`);
  expect.soft(bad.map((v) => `${v.id} x${v.nodes.length}`), name).toEqual([]);
}

for (const n of [7, 9, 12]) {
  test(`Lesson ${n} typed right is Passed and recorded`, async ({ page }) => {
    test.setTimeout(90_000);
    await toMenu(page);
    await toLessons(page);
    await open(page, n);
    await h1(page, new RegExp(`^LESSON ${String(n).padStart(2, "0")} //`)).waitFor();
    await typeToDone(page);
    await expect(page.locator(".ld-title")).toHaveText("Passed.");
    const id = `L${String(n).padStart(2, "0")}`;
    expect((await saved(page)).lessonsPassed.map((l) => l.lessonId)).toContain(id);
  });
}

test("a test out of Lesson 11 with misses is Not yet and records no pass", async ({ page }) => {
  test.setTimeout(60_000);
  await toMenu(page);
  await toLessons(page);
  await open(page, 11, "t");
  await h1(page, "TEST OUT // LESSON 11").waitFor();
  await typeToDone(page, async (i) => {
    if (i % 4 === 0) await page.keyboard.press("q");
  });
  await expect(page.locator(".ld-title")).toHaveText("Not yet.");
  expect((await saved(page)).lessonsPassed).toEqual([]);
});

test("Lesson 7's keyboard: both Shift keys, and a capital lights the other hand's Shift", async ({
  page,
}) => {
  await toMenu(page);
  await toLessons(page);
  await open(page, 7);
  await expect(page.locator(".ls-k.is-shift")).toHaveCount(2);
  await expect(page.locator(".ls-row-num")).toHaveCount(0);
  for (let i = 0; i < 60; i++) {
    const c = await page.locator(".ch-wait").textContent();
    if (/[A-Z]/.test(c)) {
      await expect(page.locator(".ls-k.is-shift.is-next")).toHaveCount(1);
      return;
    }
    await page.keyboard.press(c);
  }
  throw new Error("no capital came up");
});

test("each glossary dialog opens and closes by keyboard, and focus comes back", async ({ page }) => {
  await toMenu(page);
  const check = async (name, words) => {
    const btn = page.getByRole("button", { name: `What's this: ${name}` });
    await btn.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name });
    await expect(dialog).toContainText(words);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(btn).toBeFocused();
  };
  await check("WPM", "Words per minute.");
  await toLessons(page);
  await check("home row", "The middle row of letters");
  await audit(page, "Lessons menu");
  await page.getByRole("button", { name: "What's this: home row" }).click();
  await audit(page, "glossary dialog");
  await page.getByRole("button", { name: "Close" }).click();
  await page.keyboard.press("Escape");
  await h1(page, "Main menu").waitFor();
  await page.getByRole("button", { name: /^Play/ }).click();
  await check("dead key", "A key that types nothing");
});

test("Finger colors off: Lesson 8 has no colors and says so; Lessons 0 to 6 keep them", async ({
  page,
}) => {
  await toMenu(page);
  await page.getByRole("navigation", { name: "Main menu" }).getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Finger colors").uncheck();
  await audit(page, "Settings");
  await page.keyboard.press("Escape");
  await toLessons(page);
  await open(page, 8);
  await expect(page.locator(".ls-kb")).toHaveClass(/no-colors/);
  await expect(page.locator(".ls-foot")).toContainText("FINGER COLORS: OFF");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Leave lesson" }).click();
  await h1(page, "Lessons").waitFor();
  await open(page, 3);
  await expect(page.locator(".ls-kb")).not.toHaveClass(/no-colors/);
});

test("axe on Lessons 7 to 13, and none scrolls at three sizes with the number row", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await toMenu(page);
  await toLessons(page);
  for (const n of [7, 8, 9, 10, 11, 12, 13]) {
    await open(page, n);
    await audit(page, `Lesson ${n}`);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Leave lesson" }).click();
    await h1(page, "Lessons").waitFor();
  }
  await open(page, 11);
  for (const [w, h] of [
    [1440, 900],
    [1366, 768],
    [1280, 720],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await expect // fit.js rescales on resize; give it a moment
      .poll(
        () =>
          page.evaluate(
            () =>
              document.documentElement.scrollHeight > innerHeight ||
              document.documentElement.scrollWidth > innerWidth,
          ),
        { message: `${w}x${h}` },
      )
      .toBe(false);
  }
});
