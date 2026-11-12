// The settings controls: they show what is saved, offer only valid choices, and save each change.
import assert from "node:assert/strict";
import { test } from "node:test";
import { SPEED_MAX, SPEED_MIN } from "../../engine/config.js";
import { DEFAULTS } from "../../storage/settings.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { settingsScreen } from "./settings.js";

function ctxFor(settings = {}, extra = {}) {
  const log = [];
  return {
    log,
    state: { settings: { ...DEFAULTS, ...settings }, oldData: false, newerSave: false },
    app: {
      setSetting: (k, v) => log.push(["set", k, v]),
      exportBackup: () => ({ ok: true }),
    },
    refresh: () => log.push(["refresh"]),
    go: (id) => log.push(["go", id]),
    back: () => log.push(["back"]),
    announce: (t) => log.push(["say", t]),
    ...extra,
  };
}
const byId = (node, id) => findAll(node, (n) => n.attrs?.id === id)[0];
const fire = (node, type, target) => node.listeners[type]({ target, type });

test("the controls show what is saved", () => {
  withFakeDocument(() => {
    const node = settingsScreen.render(
      ctxFor({ ai: true, sound: "arcade", speed: 1.5, fingerColors: false }),
    );
    assert.equal(byId(node, "st-ai").checked, true);
    assert.equal(byId(node, "st-fingerColors").checked, undefined); // false is left unchecked
    const options = findAll(node, (n) => n.tag === "option");
    assert.deepEqual(options.map(textOf), ["Off", "Typewriter", "Arcade"]);
    assert.equal(options.find((o) => o.selected).value, "arcade");
    const range = byId(node, "st-speed");
    assert.equal(range.attrs.min, String(SPEED_MIN));
    assert.equal(range.attrs.max, String(SPEED_MAX));
    assert.equal(range.value, 1.5);
    assert.equal(textOf(byId(node, "st-speed-out")), "1.5×");
  });
});

test("each change is saved through the app, and only valid values", () => {
  withFakeDocument(() => {
    const ctx = ctxFor();
    const node = settingsScreen.render(ctx);
    fire(byId(node, "st-ai"), "change", { checked: true });
    fire(byId(node, "st-fingerColors"), "change", { checked: false });
    fire(byId(node, "st-sound"), "change", { value: "typewriter" });
    fire(byId(node, "st-speed"), "change", { value: "0.5" });
    fire(byId(node, "st-speed"), "change", { value: "2" });
    assert.deepEqual(ctx.log, [
      ["set", "ai", true],
      ["set", "fingerColors", false],
      ["set", "sound", "typewriter"],
      ["set", "speed", 0.5],
      ["set", "speed", 2],
    ]);
  });
});

test("a value the screen never offers is not saved; the control is put back", () => {
  withFakeDocument(() => {
    const ctx = ctxFor();
    const node = settingsScreen.render(ctx);
    fire(byId(node, "st-sound"), "change", { value: "constructor" });
    fire(byId(node, "st-speed"), "change", { value: "9" });
    fire(byId(node, "st-speed"), "change", { value: "abc" });
    assert.deepEqual(ctx.log, [["refresh"], ["refresh"], ["refresh"]]);
  });
});

test("dragging the slider shows the number without saving", () => {
  withFakeDocument(() => {
    const ctx = ctxFor();
    const node = settingsScreen.render(ctx);
    fire(byId(node, "st-speed"), "input", { value: "1.7" });
    assert.equal(byId(node, "st-speed-out").textContent, "1.7×"); // the fake has no live text
    assert.deepEqual(ctx.log, []);
  });
});

test("the AI switch says what leaves the browser, and Back goes back", () => {
  withFakeDocument(() => {
    const ctx = ctxFor();
    const node = settingsScreen.render(ctx);
    assert.match(textOf(node), /which keys you miss and your recent speed/);
    assert.equal(byId(node, "st-ai").attrs["aria-describedby"], "st-ai-hint");
    findAll(node, (n) => n.tag === "button" && textOf(n) === "Back")[0].click();
    assert.deepEqual(ctx.log, [["back"]]);
  });
});
