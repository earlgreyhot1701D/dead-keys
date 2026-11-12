// The round screen (Req 3 to 5): the dialogs' copy word for word, which keys reach the engine,
// Escape's layers (drop the lock, else pause), keys ignored under a dialog, and the loop driving
// time. A fake window gives the frames, so the round runs under node.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { findAll, makeFakeDoc, textOf } from "../fakeDom.js";
import { chooseRound } from "./play.js";
import { isTyping, outOfLivesLines, PAUSE, roundScreen } from "./round.js";

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

test("only single characters without a shortcut key are typing", () => {
  for (const k of ["a", "Z", " ", ";", "ñ", "¿"]) assert.ok(isTyping({ key: k }), k);
  for (const k of ["Shift", "Tab", "Backspace", "Enter", "Escape", "ArrowUp", ""])
    assert.ok(!isTyping({ key: k }), k);
  assert.ok(!isTyping({ key: "a", ctrlKey: true }));
  assert.ok(!isTyping({ key: "a", metaKey: true }));
  assert.ok(!isTyping({ key: "a", altKey: true }));
  assert.ok(!isTyping(undefined));
});

/** Start a falling round on a fake page; `frame(dt)` runs one animation frame. */
function start() {
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
  const log = { go: [], said: [] };
  chooseRound("falling");
  const node = roundScreen.render({
    state: { settings: { speed: 1 }, persist: true },
    go: (id) => log.go.push(id),
    announce: (t) => log.said.push(t),
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
    assert.ok(r.log.said.some((l) => l.includes("Paused.")));
  } finally {
    cleanup();
  }
});

test("keys under an open dialog never reach the engine, and End round leaves", () => {
  const r = start();
  try {
    assert.equal(r.press("Shift"), false, "Shift and Tab pass through to the page");
    assert.equal(r.press("Tab"), false);
    r.press("Escape"); // nothing locked: pause
    assert.equal(r.press("a"), false);
    assert.equal(r.press("Escape"), false);
    const end = findAll(r.doc.body, (n) => n.tag === "button" && textOf(n) === PAUSE.end)[0];
    end.click();
    assert.deepEqual(r.log.go, ["play"]);
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
