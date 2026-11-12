// Shell Req 3.4 (tab sync) and the app's safety property: whatever the player does against a
// storage that can refuse any call, nothing crashes and nothing is written while persist is false.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { exportText } from "../storage/exportImport.js";
import { CORRUPT_KEY, KEY } from "../storage/store.js";
import { vet } from "../storage/vet.js";
import { createApp } from "./app.js";
import { makeEnv } from "./appTestKit.js";

const fixture = (path) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${path}`, import.meta.url), "utf8")).value;
const good = () => structuredClone(fixture("normal/progress.basic.json"));
const GOOD = JSON.stringify(good());
const NEWER = JSON.stringify({ ...good(), schemaVersion: 2 });
const OLD = JSON.stringify(fixture("ugly/progress.old-schema.json"));

function boot(opts) {
  const h = makeEnv(opts);
  const app = createApp(h.env);
  app.start();
  return { app, ...h };
}

test("another tab saving stops this one from saving and shows the otherTab notice", () => {
  const { app, emit, writes, data } = boot({ initial: { [KEY]: GOOD } });
  assert.equal(app.state.persist, true);
  emit({ key: KEY, newValue: "{}" });
  assert.equal(app.state.persist, false);
  assert.equal(app.state.notice, "otherTab");
  app.setSetting("sound", "arcade"); // still works in memory
  assert.equal(app.state.settings.sound, "arcade");
  assert.equal(writes(), 0);
  assert.equal(data.get(KEY), GOOD);
});

test("another tab clearing all storage (key null) counts too", () => {
  const { app, emit } = boot({ initial: { [KEY]: GOOD } });
  emit({ key: null });
  assert.equal(app.state.notice, "otherTab");
  assert.equal(app.state.persist, false);
});

test("events for other keys, or no event at all, change nothing", () => {
  const { app, emit } = boot({ initial: { [KEY]: GOOD } });
  for (const e of [
    { key: CORRUPT_KEY },
    { key: "unrelated" },
    { key: "" },
    {},
    null,
    undefined,
    5,
  ]) {
    emit(e);
    assert.equal(app.state.persist, true, JSON.stringify(e));
    assert.equal(app.state.notice, null);
  }
});

test("an event does not replace the notice of a save that is already not being written", () => {
  const { app, emit } = boot({ initial: { [KEY]: NEWER } });
  assert.equal(app.state.notice, "newer");
  emit({ key: KEY });
  assert.equal(app.state.notice, "newer");
});

test("Reload reloads the page, and a reload that fails changes nothing", () => {
  const { app, counts } = boot({ initial: { [KEY]: GOOD } });
  app.reload();
  assert.equal(counts.reloads, 1);
  const h = makeEnv();
  h.env.reload = () => {
    throw new Error("no");
  };
  const a = createApp(h.env);
  a.start();
  assert.doesNotThrow(() => a.reload());
});

test("stop() ends the listening, and starting twice listens once", () => {
  const { app, listeners, emit } = boot({ initial: { [KEY]: GOOD } });
  assert.equal(listeners.size, 1);
  app.start();
  assert.equal(listeners.size, 1);
  app.stop();
  assert.equal(listeners.size, 0);
  emit({ key: KEY });
  assert.equal(app.state.notice, null);
  assert.doesNotThrow(() => app.stop());
});

test("a listen that throws does not stop the app from starting", () => {
  const h = makeEnv({ initial: { [KEY]: GOOD } });
  h.env.listen = () => {
    throw new Error("no storage events here");
  };
  const app = createApp(h.env);
  assert.doesNotThrow(() => app.start());
  assert.equal(app.state.persist, true);
});

test("subscribers hear every change, can leave, and a broken one cannot stop the rest", () => {
  const { app } = boot({ initial: { [KEY]: GOOD } });
  const seen = [];
  app.subscribe(() => {
    throw new Error("a broken screen");
  });
  const leave = app.subscribe((s) => seen.push(s.settings.sound));
  app.setSetting("sound", "arcade");
  assert.deepEqual(seen, ["arcade"]);
  leave();
  app.setSetting("sound", "off");
  assert.deepEqual(seen, ["arcade"]);
  assert.equal(app.state.settings.sound, "off");
});

// Random play. One action per step, against a storage that may refuse calls.
const setting = fc.oneof(
  fc.constant(["set", "sound", "arcade"]),
  fc.constant(["set", "speed", 1.5]),
  fc.constant(["set", "ai", true]),
  fc.constant(["set", "fingerColors", false]),
  fc.constant(["set", "privacySeen", true]),
);
const texts = fc.constantFrom(GOOD, NEWER, OLD, "junk{", "", exportText(good()));
const action = fc.oneof(
  setting,
  fc.constant(["export"]),
  texts.map((t) => ["preview", t]),
  fc.constant(["confirm"]),
  fc.constant(["cancel"]),
  fc.constant(["clear"]),
  fc.constant(["old"]),
  fc.constant(["privacy"]),
  fc.constant(["dismiss"]),
  fc.constant(["reload"]),
  fc.constantFrom(KEY, CORRUPT_KEY, null, "x").map((k) => ["event", { key: k }]),
);
const methods = fc.subarray(["getItem", "setItem", "removeItem"]);
const keys = fc.subarray([KEY, CORRUPT_KEY]);
const initial = fc.constantFrom(
  {},
  { [KEY]: GOOD },
  { [KEY]: NEWER },
  { [KEY]: OLD },
  { [KEY]: "junk{" },
);

test("random play: never crashes, progress stays valid, nothing is written while persist is false", () => {
  fc.assert(
    fc.property(
      initial,
      methods,
      keys,
      fc.boolean(),
      fc.boolean(),
      fc.array(action, { maxLength: 25 }),
      (init, throwOn, failSet, lookupThrows, downloadThrows, steps) => {
        const h = makeEnv({ initial: init, throwOn, failSet, lookupThrows, downloadThrows });
        const app = createApp(h.env);
        app.start();
        for (const [name, a, b] of steps) {
          const wasPersisting = app.state.persist;
          const before = h.writes();
          if (name === "set") app.setSetting(a, b);
          else if (name === "export") app.exportBackup();
          else if (name === "preview") app.previewImport(a);
          else if (name === "confirm") app.confirmImport();
          else if (name === "cancel") app.cancelImport();
          else if (name === "clear") app.clear();
          else if (name === "old") app.downloadOldData();
          else if (name === "privacy") app.dismissPrivacy();
          else if (name === "dismiss") app.dismissNotice();
          else if (name === "reload") app.reload();
          else h.emit(a);
          // clear is the one deliberate removal: the player asked for it
          if (!wasPersisting && name !== "clear")
            assert.equal(h.writes(), before, `${name} wrote while persist was false`);
          const p = app.state.progress;
          assert.equal(validate("Progress", p).status, "valid");
          assert.deepEqual(vet(p), []);
        }
      },
    ),
    { numRuns: 150 },
  );
});
