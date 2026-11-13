// The round screen (Req 3 to 5): the dialogs' copy word for word, which keys reach the engine,
// Escape's layers (drop the lock, else pause), Backspace clearing a wrong key, keys ignored under a dialog, and the loop driving
// time. A fake window gives the frames, so the round runs under node.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { CAPS_HINT, COACH, PRACTICE_NOTE, WRONG_HINT } from "../../render/playHud.js";
import { findAll, makeFakeDoc, textOf } from "../fakeDom.js";
import { practiceScreen } from "./menuRounds.js";
import { chooseRound } from "./play.js";
import { outOfLivesLines, PAUSE, roundScreen } from "./round.js";

const design = readFileSync(
  new URL("../../../.kiro/specs/play/design.md", import.meta.url),
  "utf8",
);
const row = (prefix) => design.split("\n").find((l) => l.startsWith(prefix));

test("the pause dialog's words are the copy table's", () => {
  assert.ok(
    row("| Pause dialog").includes(
      `Title "${PAUSE.title}". Buttons "${PAUSE.resume}", "${PAUSE.end}".`,
    ),
  );
});

test("the out-of-lives lines are the copy table's, with the round's real numbers", () => {
  const r = row("| Out-of-lives dialog, continue left")
    .replaceAll("<wpm>", "0")
    .replaceAll("<n>", "7")
    .replaceAll("<w>", "3");
  const s = { keystrokes: [], strayKeys: 0, activeMs: 0, cleared: 7, wave: 3 };
  const lines = outOfLivesLines(s);
  assert.equal(lines.length, 4);
  for (const l of lines) assert.ok(r.includes(`"${l}"`), l);
});

/** Start a round on a fake page (falling by default); `frame(dt)` runs one animation frame. */
function start(kind = "falling", screen = roundScreen) {
  const frames = [];
  const listeners = {};
  let now = 0;
  globalThis.window = {
    requestAnimationFrame: (f) => frames.push(f),
    cancelAnimationFrame: () => frames.splice(0),
    addEventListener: (t, f) => {
      listeners[t] = f;
    },
    removeEventListener: () => {},
  };
  const doc = makeFakeDoc();
  doc.addEventListener = () => {};
  doc.removeEventListener = () => {};
  globalThis.document = doc; // the round's dialogs are built later, on key presses
  const log = { go: [], said: [], finished: [] };
  chooseRound(kind);
  const node = screen.render({
    state: { settings: { speed: 1 }, persist: true },
    go: (id) => log.go.push(id),
    replace: (id) => log.go.push(id),
    announce: (t) => log.said.push(t),
    app: {
      finishRound: (result, day) => {
        log.finished.push({ result, day });
        return { recorded: true, saved: true, newBest: null, milestones: [], previous: null };
      },
    },
  });
  doc.body.append(node);
  const frame = (dt) => {
    now += dt;
    frames.shift()?.(now);
  };
  const press = (key) => roundScreen.onKey({}, { key });
  return { node, doc, log, frame, press, listeners, frames };
}
const cleanup = () => {
  delete globalThis.window;
  delete globalThis.document;
};
// The HUD sets textContent each frame (the fake keeps it as a plain property).
const lockWord = (node) =>
  findAll(node, (n) => n.attrs?.class === "stream-target")[0].textContent ?? "";

test("a round draws the HUD, the field and a sr-only title", () => {
  const { node } = start();
  try {
    assert.equal(textOf(findAll(node, (n) => n.tag === "h1")[0]), "Falling words");
    assert.equal(findAll(node, (n) => n.tag === "h1")[0].parent.tag, "main", "Req 10.1");
    const t = textOf(node);
    for (const s of ["TERMINAL 84", "LIVES:", "SECTOR:", "SPEED:", "ACCURACY:", "TIME:"])
      assert.ok(t.includes(s), s);
    assert.ok(t.includes("[ESC] PAUSE"));
  } finally {
    cleanup();
  }
});

test("a typed key locks a word; Escape drops the lock, then pauses", () => {
  const r = start();
  try {
    r.frame(16);
    const cards = findAll(r.node, (n) => n.attrs?.class?.startsWith("fw") && n.tag === "div");
    const first = textOf(findAll(r.node, (n) => n.attrs?.class === "fw-word")[0]);
    assert.ok(cards.length > 0);
    assert.equal(r.press(first[0]), true);
    assert.notEqual(lockWord(r.node), "");
    assert.equal(r.press("Escape"), true);
    assert.equal(lockWord(r.node), "");
    assert.equal(r.doc.querySelector("dialog[open]"), null);
    r.press("Escape");
    const dialog = r.doc.querySelector("dialog[open]");
    assert.ok(dialog);
    assert.ok(textOf(dialog).includes(PAUSE.title));
    assert.ok(!r.log.said.some((l) => l.includes("Paused.")), "the dialog says it (Req 10.3)");
  } finally {
    cleanup();
  }
});

test("strict but clear: a wrong key shows in red, Backspace clears it, Escape lets go", () => {
  const r = start();
  const hint = () => findAll(r.node, (n) => n.attrs?.class === "foot-hint")[0].textContent ?? "";
  try {
    r.frame(16);
    assert.equal(hint(), COACH.pick); // the warm-up coaches every step
    const first = textOf(findAll(r.node, (n) => n.attrs?.class === "fw-word")[0]);
    r.press(first[0]);
    r.frame(16);
    assert.equal(hint(), COACH.finish);
    r.press("~"); // never in a word: a miss
    r.frame(16);
    assert.equal(hint(), WRONG_HINT);
    assert.ok(findAll(r.node, (n) => /\bis-wrong\b/.test(n.attrs?.class ?? "")).length === 1);
    const red = () => findAll(r.node, (n) => n.attrs?.class === "fw-wrong")[0].textContent;
    assert.equal(red(), "~");
    assert.equal(r.press("Backspace"), true);
    r.frame(16);
    assert.equal(red(), "", "Backspace clears the red key");
    assert.equal(hint(), COACH.finish);
    assert.notEqual(lockWord(r.node), "", "and keeps the word");
    r.press("Escape");
    r.frame(16);
    assert.equal(lockWord(r.node), "");
    assert.equal(hint(), COACH.pick);
    assert.equal(r.doc.querySelector("dialog[open]"), null);
  } finally {
    cleanup();
  }
});

test("Caps Lock on shows its hint; off hides it. A space is taken and never a miss", () => {
  const r = start();
  const hint = () => findAll(r.node, (n) => n.attrs?.class === "foot-hint")[0].textContent ?? "";
  const caps = (on) => ({ key: "q", getModifierState: (k) => k === "CapsLock" && on });
  try {
    r.frame(16);
    roundScreen.onKey({}, caps(true));
    assert.equal(hint(), CAPS_HINT);
    roundScreen.onKey({}, caps(false));
    assert.equal(hint(), COACH.pick);
    assert.equal(r.press(" "), true);
    assert.equal(r.doc.querySelector("dialog[open]"), null);
  } finally {
    cleanup();
  }
});

test("keys under an open dialog never reach the engine; End round records it and shows results", () => {
  const r = start();
  try {
    assert.equal(r.press("Shift"), false, "Shift and Tab pass through to the page");
    assert.equal(r.press("Tab"), false);
    r.press("Escape"); // nothing locked: pause
    assert.equal(r.press("a"), false);
    assert.equal(r.press("Escape"), false);
    const end = findAll(r.doc.body, (n) => n.tag === "button" && textOf(n) === PAUSE.end)[0];
    end.click();
    assert.deepEqual(r.log.go, ["results"]);
    assert.equal(r.log.finished.length, 1);
    const { result, day } = r.log.finished[0];
    assert.equal(result.mode, "falling");
    assert.equal(result.packId, "general");
    assert.match(result.id, /^round-\d+$/);
    assert.match(day, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(r.frames.length, 0, "the loop stopped");
  } finally {
    cleanup();
  }
});

test("losing focus pauses the round", () => {
  const r = start();
  try {
    r.listeners.blur();
    assert.ok(r.doc.querySelector("dialog[open]"));
  } finally {
    cleanup();
  }
});

test("four corners draws its own HUD and field", () => {
  const { node } = start("corners");
  try {
    assert.equal(textOf(findAll(node, (n) => n.tag === "h1")[0]), "Four corners");
    for (const s of [
      "WAVE_REGISTER",
      "LIVES",
      "ACCURACY",
      "ACTIVE_BUFFER >",
      "CORE 84",
      "DANGER RING",
    ])
      assert.ok(textOf(node).includes(s), s);
  } finally {
    cleanup();
  }
});

test("Practice opens a practice round: the note in place of lives and waves, ended from pause", () => {
  const r = start("falling", practiceScreen); // the screen itself chooses practice
  try {
    assert.equal(practiceScreen.id, "practice");
    assert.equal(textOf(findAll(r.node, (n) => n.tag === "h1")[0]), "Practice");
    const t = textOf(r.node);
    assert.ok(t.includes(PRACTICE_NOTE));
    assert.equal(PRACTICE_NOTE, "No lives, no clock pressure. End the round from the pause menu.");
    assert.ok(!t.includes("LIVES:") && !t.includes("SECTOR:"));
    r.press("Escape");
    findAll(r.doc.body, (n) => n.tag === "button" && textOf(n) === PAUSE.end)[0].click();
    assert.equal(r.log.finished[0].result.mode, "practice");
    assert.equal(r.log.finished[0].result.wave, 0);
  } finally {
    cleanup();
  }
});
