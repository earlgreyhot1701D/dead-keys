// The settings controls: they show what is saved, offer only valid choices, and save each change.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { SPEED_MAX, SPEED_MIN } from "../../engine/config.js";
import { DEFAULTS } from "../../storage/settings.js";
import { findAll, textOf, withFakeDocument } from "../fakeDom.js";
import { AI_HINT, SPEED_SETTING_HINT, settingsScreen } from "./settings.js";

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

test("the slider says its value with the unit, once: the visible readout is hidden from a reader", () => {
  withFakeDocument(() => {
    const node = settingsScreen.render(ctxFor({ speed: 1.2 }));
    const range = byId(node, "st-speed");
    assert.equal(range.attrs["aria-valuetext"], "1.2×");
    const out = byId(node, "st-speed-out");
    assert.equal(out.tag, "span"); // not <output>, which would be a second live region
    assert.equal(out.attrs["aria-hidden"], "true");
    const target = { value: "1.7", setAttribute: (k, v) => range.setAttribute(k, v) };
    fire(range, "input", target);
    assert.equal(range.attrs["aria-valuetext"], "1.7×");
  });
});

test("a settings change does not rebuild the controls (only a data change does)", () => {
  assert.ok(!settingsScreen.redrawOn.includes("settings"));
  for (const k of ["progress", "persist", "oldData", "newerSave"]) {
    assert.ok(settingsScreen.redrawOn.includes(k), k);
  }
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

test("the AI hint is the approved copy, word for word", () => {
  const table = readFileSync(
    new URL("../../../.kiro/specs/shell/design.md", import.meta.url),
    "utf8",
  );
  const row = table.split("\n").find((l) => l.startsWith("| Settings, AI hint"));
  assert.equal(row.split("|")[2].trim(), AI_HINT);
  assert.equal(
    AI_HINT,
    "When on, we send which keys you miss and your recent speed so the AI can write practice lines. The words you type are never sent.",
  );
});

test("the AI switch says what leaves the browser, and Back goes back", () => {
  withFakeDocument(() => {
    const ctx = ctxFor();
    const node = settingsScreen.render(ctx);
    assert.match(textOf(node), /which keys you miss and your recent speed/);
    assert.equal(byId(node, "st-ai").attrs["aria-describedby"], "st-ai-hint st-ai-later");
    findAll(node, (n) => n.tag === "button" && textOf(n) === "Back")[0].click();
    assert.deepEqual(ctx.log, [["back"]]);
  });
});

test("every setting that saves but does nothing yet says Not built yet, tied to its control", () => {
  withFakeDocument(() => {
    const node = settingsScreen.render(ctxFor());
    for (const id of ["st-ai", "st-sound", "st-fingerColors"]) {
      const control = byId(node, id);
      assert.ok(control.attrs["aria-describedby"].split(" ").includes(`${id}-later`), id);
      assert.equal(textOf(byId(node, `${id}-later`)), "Not built yet");
    }
  });
});

test("speed works now (Block 7): Starting speed, with its hint and no Not built yet", () => {
  withFakeDocument(() => {
    const node = settingsScreen.render(ctxFor());
    assert.equal(byId(node, "st-speed").attrs["aria-describedby"], "st-speed-hint");
    assert.equal(textOf(byId(node, "st-speed-hint")), SPEED_SETTING_HINT);
    assert.equal(byId(node, "st-speed-later"), undefined);
  });
});

test("the Not built yet hints use their own class, not progress's .later (Block 7, Req 8.4)", () => {
  withFakeDocument(() => {
    const node = settingsScreen.render(ctxFor());
    const hint = byId(node, "st-sound-later");
    assert.equal(hint.attrs.class, "hint later-hint");
    assert.equal(findAll(node, (n) => /(^| )later( |$)/.test(n.attrs?.class ?? "")).length, 0);
  });
});
