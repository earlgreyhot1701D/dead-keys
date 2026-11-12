// The mode picker (Req 2.1): two choices with their lines, the shared rules, the real speed, all
// word for word from the play copy table; a choice starts that round.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import {
  CHOICES,
  ESCAPE_LINE,
  nextRound,
  PICK_LINE,
  playScreen,
  RULES,
  speedLine,
} from "./play.js";

const design = readFileSync(
  new URL("../../../.kiro/specs/play/design.md", import.meta.url),
  "utf8",
);
const row = (prefix) => design.split("\n").find((l) => l.startsWith(prefix));

function draw(speed = 1) {
  const log = [];
  let node;
  withFakeDocument(() => {
    node = playScreen.render({
      state: { settings: { speed }, persist: true },
      go: (id) => log.push(["go", id]),
      back: () => log.push(["back"]),
    });
  });
  return { node, log, text: textOf(node) };
}

test("the copy is the play copy table's, word for word", () => {
  assert.ok(row("| Mode picker h1 and line").includes(`"${PICK_LINE}"`));
  for (const c of CHOICES) {
    const r = row(`| Mode picker, ${c.name}`);
    assert.ok(r.includes(`Name "${c.name}"`), c.name);
    assert.ok(r.includes(`"${c.how}"`), c.name);
  }
  const both = row("| Mode picker, both");
  assert.ok(both.includes(`"${RULES}"`));
  assert.ok(both.includes(`"${ESCAPE_LINE}"`));
  assert.ok(both.includes(`"${speedLine(1)}"`));
  assert.equal(speedLine(1), "Speed: 1× (change it in Settings).");
});

test("h1 Play, the line, both choices and the rules panel are on the screen", () => {
  const { node, text } = draw();
  assert.equal(textOf(findAll(node, (n) => n.tag === "h1")[0]), "Play");
  for (const s of [PICK_LINE, RULES, ESCAPE_LINE, ...CHOICES.flatMap((c) => [c.name, c.how])]) {
    assert.ok(text.includes(s), s);
  }
});

test("the speed shown is the real setting", () => {
  assert.ok(draw(0.8).text.includes("Speed: 0.8× (change it in Settings)."));
});

test("each choice is a button, described by its line, that starts its round", () => {
  for (const c of CHOICES) {
    const { node, log } = draw();
    const b = findAll(node, (n) => n.tag === "button" && textOf(n) === c.name)[0];
    const how = findAll(node, (n) => n.attrs?.id === b.attrs["aria-describedby"])[0];
    assert.equal(textOf(how), c.how);
    b.click();
    assert.deepEqual(log, [["go", "round"]]);
    assert.equal(nextRound().mode, c.kind);
  }
});
