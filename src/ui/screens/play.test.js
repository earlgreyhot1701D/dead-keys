// The mode picker (Req 2.1, 2.3): two choices with their lines, the shared rules, the badge and
// the speed slider, all word for word from the play copy table; a choice starts that round, and
// the slider starts at the saved speed and saves a change.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { SPEED_MAX, SPEED_MIN } from "../../engine/config.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import {
  BADGE,
  CHOICES,
  ESCAPE_LINE,
  nextRound,
  PICK_LINE,
  paceLine,
  playScreen,
  RULES,
  SPEED_HINT,
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
      app: { setSetting: (k, v) => log.push(["set", k, v]) },
      go: (id) => log.push(["go", id]),
      back: () => log.push(["back"]),
      refresh: () => log.push(["refresh"]),
    });
  });
  return { node, log, text: textOf(node) };
}
const slider = (node) => findAll(node, (n) => n.attrs?.id === "pick-speed")[0];

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
  assert.ok(row("| Mode picker, speed").includes(`Hint under it: "${SPEED_HINT}"`));
  assert.equal(row("| Mode picker badge"), `| Mode picker badge | ${BADGE} |`);
});

test("h1 Play, the badge, the line, both choices and the rules panel are on the screen", () => {
  const { node, text } = draw();
  assert.equal(textOf(findAll(node, (n) => n.tag === "h1")[0]), "Play");
  for (const s of [BADGE, PICK_LINE, RULES, ESCAPE_LINE, SPEED_HINT])
    assert.ok(text.includes(s), s);
  for (const c of CHOICES) assert.ok(text.includes(c.name) && text.includes(c.how), c.name);
});

test("the speed slider: labelled, Settings' range and steps, starts at the saved speed", () => {
  const { node, text } = draw(0.8);
  const s = slider(node);
  const label = findAll(node, (n) => n.tag === "label" && n.attrs.for === "pick-speed")[0];
  assert.equal(textOf(label).trim(), "Starting speed");
  assert.equal(s.attrs.type, "range");
  assert.equal(s.attrs.min, String(SPEED_MIN));
  assert.equal(s.attrs.max, String(SPEED_MAX));
  assert.equal(s.attrs.step, "0.1");
  assert.equal(s.value, 0.8);
  assert.match(s.attrs["aria-valuetext"], /^0\.8×, about \d+ WPM$/);
  assert.ok(text.includes("0.8×"));
  assert.ok(text.includes(paceLine(0.8)));
  assert.equal(s.attrs["aria-describedby"], "pick-speed-hint");
});

test("the pace line follows the slider while it moves", () => {
  const { node, text } = draw(1);
  const s = slider(node);
  const before = paceLine(1);
  assert.ok(text.includes(before));
  s.listeners.input({ target: { value: "2", setAttribute() {} } });
  const pace = findAll(node, (n) => n.attrs?.class === "pick-speed-pace")[0];
  assert.equal(pace.textContent, paceLine(2));
  assert.notEqual(paceLine(2), before);
});

test("moving the slider saves the speed; a bad value is never saved", () => {
  const { node, log } = draw();
  const s = slider(node);
  s.listeners.change({ target: { value: "1.2" } });
  s.listeners.change({ target: { value: "9" } });
  assert.deepEqual(log, [["set", "speed", 1.2], ["refresh"]]);
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
