// The Lesson screen (lessons Req 3, 4.5, 7.1, 7.2, 7.5) and the Lesson done card (Req 7.3), run
// under node on a fake page: a whole lesson typed from what the screen shows, a wrong key shown,
// spoken and cleared, the pause dialog, leaving records nothing, and finishing records once.
import assert from "node:assert/strict";
import { test } from "node:test";
import { COACH, DONE, FOOTER_LEFT, LESSON0, PAUSE, SAY } from "../../lessons/copy.js";
import { findAll, makeFakeDoc, textOf } from "../fakeDom.js";
import { chooseLesson, lessonScreen, nextLesson } from "./lesson.js";
import { chooseRound, nextRound, roundItems } from "./play.js";

const cls = (n) => n.attrs?.class ?? "";
const byClass = (root, c) => findAll(root, (n) => cls(n).split(" ").includes(c));

/** A lesson on a fake page. `press(key)` sends a key; `wait()` is the letter the line wants. */
function open(id = "L01", kind = "lesson", progress = { rounds: [] }) {
  const doc = makeFakeDoc();
  globalThis.document = doc;
  chooseLesson(id, kind);
  const log = { said: [], go: [], finished: [] };
  let node = null;
  const ctx = {
    root: { ownerDocument: doc },
    state: {},
    has: () => false,
    announce: (t) => log.said.push(t),
    go: (to) => log.go.push(["go", to]),
    replace: (to) => log.go.push(["replace", to]),
    refresh: () => {
      node = lessonScreen.render(ctx);
    },
    app: {
      state: { progress },
      finishRound: (result, day, pass) => {
        log.finished.push({ result, day, pass });
        return { recorded: true, saved: true, newBest: null, milestones: [], previous: null };
      },
    },
  };
  node = lessonScreen.render(ctx);
  doc.body.append(node);
  const press = (key, target = { tagName: "BODY" }) => lessonScreen.onKey(ctx, { key, target });
  const view = () => node;
  const wait = () => byClass(node, "ch-wait")[0]?.text ?? textOf(byClass(node, "ch-wait")[0] ?? {});
  return { doc, log, press, view, wait, ctx };
}
const cleanup = () => {
  delete globalThis.document;
};
/** Type until the screen shows the done card (at most `max` keys). */
function typeAll(s, max = 2000) {
  for (let i = 0; i < max && byClass(s.view(), "ld-card").length === 0; i++) s.press(s.wait());
}

test("the Lesson screen draws the map's parts, with the pill as its h1", () => {
  const s = open("L03");
  try {
    const h1 = findAll(s.view(), (n) => n.tag === "h1")[0];
    assert.equal(textOf(h1), "LESSON 03 // FULL HOME ROW");
    const steps = byClass(s.view(), "ls-step").map((n) => n.textContent);
    assert.deepEqual(steps, ["[▶] 1. WARM-UP", "2. NEW KEYS", "3. MIX", "4. CHECK"]);
    assert.equal(byClass(s.view(), "ls-count")[0].textContent, "LINE 1 OF 1");
    assert.equal(byClass(s.view(), "ls-k").length, 30);
    assert.ok(textOf(s.view()).includes(FOOTER_LEFT));
    assert.ok(textOf(s.view()).includes("FINGER COLORS: ON"));
    assert.match(s.log.said[0], /^Line 1 of 1: [ ;adfjkls]+$/); // warm-up: keys learned before L03
  } finally {
    cleanup();
  }
});

test("a wrong key shows red with its hint, is spoken once, and Backspace clears only it", () => {
  const s = open("L01");
  try {
    const want = s.wait();
    s.press(want === "q" ? "z" : "q");
    assert.equal(byClass(s.view(), "ch-wrong")[0].children[0].text, want === "q" ? "z" : "q");
    assert.ok(byClass(s.view(), "ls-hint")[0].textContent.startsWith(`TYPE "${want}" TO FIX.`));
    s.press("x"); // a second wrong key: no second announcement
    assert.deepEqual(
      s.log.said.filter((l) => l.startsWith("Wrong key")),
      [SAY.wrong(want)],
    );
    assert.equal(s.press("Backspace"), true);
    assert.equal(byClass(s.view(), "ch-wrong").length, 0);
    assert.equal(byClass(s.view(), "ls-hint")[0].textContent, "");
    assert.equal(s.wait(), want, "Backspace never moves the line back");
    assert.equal(s.press("Shift"), false, "other keys pass through");
  } finally {
    cleanup();
  }
});

test("Escape pauses into a dialog; Leave lesson records nothing", () => {
  const s = open("L02");
  try {
    s.press(s.wait());
    s.press("Escape");
    const dialog = s.doc.querySelector("dialog[open]");
    assert.ok(dialog);
    assert.ok(textOf(dialog).includes(PAUSE.title) && textOf(dialog).includes(PAUSE.body));
    assert.equal(s.press("a"), false, "keys under the dialog never reach the lesson");
    findAll(dialog, (n) => n.tag === "button" && textOf(n) === PAUSE.leave)[0].click();
    assert.deepEqual(s.log.go, [["go", "menu"]]); // the Lessons menu is not built yet: home
    assert.equal(s.log.finished.length, 0);
  } finally {
    cleanup();
  }
});

test("a whole lesson typed right records once, as a pass, and shows Passed", () => {
  const s = open("L01");
  try {
    typeAll(s);
    assert.equal(s.log.finished.length, 1);
    const { result, pass } = s.log.finished[0];
    assert.equal(result.mode, "lesson");
    assert.equal(result.lessonId, "L01");
    assert.deepEqual(pass, { lessonId: "L01", how: "lesson" });
    const card = byClass(s.view(), "ld-card")[0];
    assert.ok(textOf(card).includes(DONE.passed) && textOf(card).includes("100%"));
    assert.ok(textOf(card).includes(DONE.noneSub));
    assert.ok(textOf(card).includes("Next: Lesson 02"));
    assert.ok(s.log.said.includes(SAY.passed(1, 100)));
    assert.equal(s.press("Enter"), true);
    assert.deepEqual(s.log.go.at(-1), ["replace", "lesson"]);
    assert.deepEqual(nextLesson(), { id: "L02", kind: "lesson" });
  } finally {
    cleanup();
  }
});

test("a test out with misses: Not yet, its own line, Again first; Escape goes to all lessons", () => {
  const s = open("L02", "testout");
  try {
    assert.equal(textOf(findAll(s.view(), (n) => n.tag === "h1")[0]), "TEST OUT // LESSON 02");
    assert.deepEqual(
      byClass(s.view(), "ls-step").map((n) => n.textContent),
      ["[▶] CHECK"],
    );
    for (let i = 0; i < 2000 && !byClass(s.view(), "ld-card").length; i++) {
      if (i % 4 === 0) s.press("q"); // a miss every few keys: well under 95%
      s.press(s.wait());
    }
    const { pass, result } = s.log.finished[0];
    assert.equal(result.mode, "testout");
    assert.equal(pass, null);
    const text = textOf(byClass(s.view(), "ld-card")[0]);
    assert.ok(text.includes(DONE.notYet) && text.includes(DONE.testOutNotYetLine));
    const buttons = findAll(s.view(), (n) => n.tag === "button" && cls(n).includes("ld-btn"));
    assert.deepEqual(buttons.map(textOf), [DONE.again, DONE.all]);
    assert.ok(textOf(s.view()).includes("[ENTER] AGAIN"));
    assert.equal(s.press("Escape"), true);
    assert.deepEqual(s.log.go.at(-1), ["go", "menu"]);
  } finally {
    cleanup();
  }
});

test("only built lessons can be chosen, and Lesson 0 has no test out", () => {
  assert.throws(() => chooseLesson("L07"), RangeError);
  assert.throws(() => chooseLesson("L00", "testout"), RangeError);
  assert.throws(() => chooseLesson("L01", "drill"), RangeError);
});

test("Play these keys: after a pass, a practice round of this lesson's words", () => {
  const s = open("L01");
  try {
    typeAll(s);
    const btn = findAll(s.view(), (n) => n.tag === "button" && textOf(n) === DONE.play)[0];
    assert.ok(btn, "the button is on the card");
    btn.click();
    assert.deepEqual(s.log.go.at(-1), ["replace", "round"]);
    const r = nextRound();
    assert.equal(r.mode, "practice");
    assert.ok(r.items.length >= 6 && r.items.every((i) => /^[asdfj]+$/.test(i.text)));
    chooseRound("falling"); // any other way in plays the pack
    assert.equal(roundItems(), null);
    assert.equal(nextRound().items, undefined);
  } finally {
    cleanup();
  }
});

test("Play these keys is not offered on Not yet", () => {
  const s = open("L01", "testout");
  try {
    for (let i = 0; i < 2000 && byClass(s.view(), "ld-card").length === 0; i++) {
      if (i % 3 === 0) s.press("q");
      s.press(s.wait());
    }
    assert.ok(textOf(byClass(s.view(), "ld-card")[0]).includes(DONE.notYet));
    assert.ok(!textOf(s.view()).includes(DONE.play));
  } finally {
    cleanup();
  }
});

test("Lesson 0 (Req 6): the keyboard question, Enter takes Yes, three parts, then a pass", () => {
  const s = open("L00");
  const coach = () => textOf(byClass(s.view(), "ls-coach-text")[0]);
  try {
    const steps = byClass(s.view(), "ls-step").map((n) => n.textContent);
    assert.deepEqual(steps, ["[▶] 1. YOUR KEYBOARD", "2. HOME KEYS", "3. FINGERS", "4. EYES UP"]);
    assert.equal(coach(), LESSON0.question);
    assert.equal(byClass(s.view(), "ls-k").length, 30, "the US keyboard is drawn");
    assert.equal(s.press("f"), false, "typing does nothing during the question");
    assert.equal(s.press("Escape"), true, "Escape pauses, with no line to lose");
    findAll(s.doc.querySelector("dialog[open]"), (n) => textOf(n) === PAUSE.resume)[0].click();
    assert.equal(s.press("Enter"), true);
    assert.equal(coach(), COACH.home);
    assert.deepEqual(s.log.said, [SAY.line(1, 1, "fff jjj fjf jfj")]);
    typeAll(s);
    assert.deepEqual(s.log.finished[0].pass, { lessonId: "L00", how: "lesson" });
    const card = textOf(byClass(s.view(), "ld-card")[0]);
    assert.ok(card.includes(DONE.passed) && card.includes(DONE.lesson0Sub));
    assert.ok(!card.includes(DONE.play), "no Play these keys for Lesson 0");
  } finally {
    cleanup();
  }
});
