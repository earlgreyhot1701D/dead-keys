// Shell Req 3 and Req 5.3, 5.4: storage lookup, load, save only when allowed, export, import,
// clear, old data. Each path runs against a stand-in storage that can refuse any call.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { exportText } from "../storage/exportImport.js";
import { DEFAULTS } from "../storage/settings.js";
import { CORRUPT_KEY, KEY } from "../storage/store.js";
import { createApp, summarize } from "./app.js";
import { makeEnv } from "./appTestKit.js";

const fixture = (path) =>
  JSON.parse(readFileSync(new URL(`../../fixtures/${path}`, import.meta.url), "utf8")).value;
const good = () => structuredClone(fixture("normal/progress.basic.json"));
const GOOD = JSON.stringify(good());
const NEWER = JSON.stringify({ ...good(), schemaVersion: 2 });

/** Start an app on a stand-in browser. */
function boot(opts) {
  const h = makeEnv(opts);
  const app = createApp(h.env);
  app.start();
  return { app, ...h };
}

test("a storage lookup that throws is blocked: fresh progress, the blocked notice, nothing saved", () => {
  for (const opts of [{ lookupThrows: true }, { noStorage: true }]) {
    const { app, calls } = boot(opts);
    assert.equal(app.state.notice, "blocked");
    assert.equal(app.state.persist, false);
    assert.equal(app.state.progress.rounds.length, 0);
    assert.deepEqual(calls, []);
  }
});

test("empty storage starts fresh with no notice; a good save loads with full settings", () => {
  const empty = boot();
  assert.equal(empty.app.state.notice, null);
  assert.equal(empty.app.state.persist, true);
  assert.deepEqual(empty.app.state.settings, DEFAULTS);
  const loaded = boot({ initial: { [KEY]: GOOD } });
  assert.equal(loaded.app.state.progress.rounds.length, good().rounds.length);
  assert.deepEqual(loaded.app.state.settings, { ...DEFAULTS, ai: false, sound: "off" }); // fixture has two of five
  assert.equal(loaded.writes(), 0);
});

test("old data: a damaged save is kept and can be downloaded; with none, nothing downloads", () => {
  const { app, downloads, data } = boot({ initial: { [KEY]: "damaged{" } });
  assert.equal(app.state.notice, "corrupt");
  assert.equal(app.state.oldData, true);
  assert.deepEqual(app.downloadOldData(), { ok: true });
  assert.deepEqual(downloads, [{ name: "dead-keys-old-data.json", text: "damaged{" }]);
  assert.equal(data.get(CORRUPT_KEY), "damaged{");
  const none = boot();
  assert.equal(none.app.state.oldData, false);
  assert.deepEqual(none.app.downloadOldData(), { ok: false, reason: "none" });
  assert.deepEqual(none.downloads, []);
});

test("a download that throws is a result, not a crash", () => {
  const { app } = boot({ initial: { [KEY]: "damaged{" }, downloadThrows: true });
  app.dismissNotice();
  assert.deepEqual(app.downloadOldData(), { ok: false, reason: "download" });
  assert.equal(app.state.notice, "exportFailed");
  app.dismissNotice();
  assert.deepEqual(app.exportBackup(), { ok: false, reason: "export" });
  assert.equal(app.state.notice, "exportFailed");
  assert.equal(app.state.persist, true); // the save is untouched, as the notice says
});

test("a successful export or download shows no notice", () => {
  const { app } = boot({ initial: { [KEY]: GOOD } });
  assert.deepEqual(app.exportBackup(), { ok: true });
  assert.equal(app.state.notice, null);
});

test("a newer save is remembered so the Clear confirm can warn, and forgotten once it is gone", () => {
  const { app, data } = boot({ initial: { [KEY]: NEWER } });
  assert.equal(app.state.newerSave, true);
  app.dismissNotice(); // the flag outlives the notice
  assert.equal(app.state.newerSave, true);
  assert.equal(app.clear(), null);
  assert.equal(data.has(KEY), false);
  assert.equal(app.state.newerSave, false);
  assert.equal(boot({ initial: { [KEY]: GOOD } }).app.state.newerSave, false);
  assert.equal(boot().app.state.newerSave, false);
});

test("if the newer save could not be removed, it is still remembered", () => {
  const { app } = boot({ initial: { [KEY]: NEWER }, throwOn: ["removeItem"] });
  assert.equal(app.clear(), "blocked");
  assert.equal(app.state.newerSave, true);
});

// "Save never when persist is false" (Block 4 deferral), for every way persist can be false.
const NO_PERSIST = [
  ["a newer save", { initial: { [KEY]: NEWER } }, "newer"],
  ["blocked storage", { initial: { [KEY]: GOOD }, throwOn: ["getItem"] }, "blocked"],
  ["a missing storage", { noStorage: true }, "blocked"],
];

test("when persist is false nothing is ever written, whatever the player does", () => {
  for (const [why, opts, notice] of NO_PERSIST) {
    const { app, writes, data } = boot(opts);
    assert.equal(app.state.persist, false, why);
    assert.equal(app.state.notice, notice, why);
    app.setSetting("sound", "arcade");
    app.setSetting("speed", 2);
    app.dismissPrivacy();
    assert.equal(app.state.settings.privacySeen, true, `${why}: still works in memory`);
    const pre = app.previewImport(exportText(good()));
    assert.equal(pre.ok, true, why);
    assert.deepEqual(app.confirmImport(), { ok: true, saved: false }, why);
    assert.equal(writes(), 0, `${why}: wrote to storage`);
    assert.equal(data.get(KEY), opts.initial?.[KEY], `${why}: the saved text changed`);
  }
});

test("when persist is true a setting is saved with the whole progress", () => {
  const { app, data } = boot({ initial: { [KEY]: GOOD } });
  app.setSetting("sound", "typewriter");
  const saved = JSON.parse(data.get(KEY));
  assert.equal(saved.settings.sound, "typewriter");
  assert.deepEqual(saved.rounds, good().rounds); // nothing else lost
  assert.equal(app.state.notice, null);
  app.dismissPrivacy();
  assert.equal(JSON.parse(data.get(KEY)).settings.privacySeen, true);
});

test("a save that fails keeps the change in memory and shows saveFailed", () => {
  const { app, data } = boot({ initial: { [KEY]: GOOD }, failSet: [KEY] });
  app.setSetting("fingerColors", false);
  assert.equal(app.state.settings.fingerColors, false);
  assert.equal(app.state.notice, "saveFailed");
  assert.equal(data.get(KEY), GOOD);
  app.dismissNotice();
  assert.equal(app.state.notice, null);
});

test("a setting the screen never offers throws (a programmer error)", () => {
  const { app } = boot();
  assert.throws(() => app.setSetting("volume", 3), TypeError);
  assert.throws(() => app.setSetting("sound", "loud"), RangeError);
  assert.throws(() => app.setSetting("speed", 99), RangeError);
});

test("export downloads a backup that import accepts and that equals the progress", () => {
  const { app, downloads } = boot({ initial: { [KEY]: GOOD } });
  assert.deepEqual(app.exportBackup(), { ok: true });
  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].name, "dead-keys-backup.json");
  const other = boot();
  const pre = other.app.previewImport(downloads[0].text);
  assert.equal(pre.ok, true);
  other.app.confirmImport();
  assert.deepEqual(other.app.state.progress, good());
});

test("import shows what will change, and changes nothing until the player confirms", () => {
  const { app, data } = boot({ initial: { [KEY]: GOOD } });
  const before = app.state.progress;
  const pre = app.previewImport(exportText(fixture("ugly/progress.200-rounds-all-keys.json")));
  assert.equal(pre.ok, true);
  assert.equal(pre.current.rounds, before.rounds.length);
  assert.equal(pre.incoming.rounds, 200);
  assert.deepEqual(pre.current, summarize(before));
  assert.equal(app.state.progress, before); // nothing changed yet
  assert.equal(data.get(KEY), GOOD);
  app.cancelImport();
  assert.deepEqual(app.confirmImport(), { ok: false, saved: false }); // nothing to confirm
  assert.equal(app.state.progress, before);
});

test("confirming an import replaces the progress and saves it", () => {
  const { app, data } = boot({ initial: { [KEY]: GOOD } });
  app.previewImport(exportText(fixture("ugly/progress.200-rounds-all-keys.json")));
  assert.deepEqual(app.confirmImport(), { ok: true, saved: true });
  assert.equal(app.state.progress.rounds.length, 200);
  assert.equal(JSON.parse(data.get(KEY)).rounds.length, 200);
  assert.equal(app.state.notice, null);
});

test("a bad import shows importFailed with a plain reason and changes nothing", () => {
  const { app, writes } = boot({ initial: { [KEY]: GOOD } });
  const before = app.state.progress;
  for (const text of ["not json", "{}", "null", exportText(good()).slice(0, 40), null, 42]) {
    app.dismissNotice();
    const r = app.previewImport(text);
    assert.equal(r.ok, false);
    assert.equal(typeof r.reason, "string");
    assert.equal(app.state.notice, "importFailed");
    assert.equal(app.state.progress, before);
  }
  assert.equal(writes(), 0);
  assert.deepEqual(app.confirmImport(), { ok: false, saved: false }); // a failed preview leaves nothing pending
});

test("an older backup is upgraded on import", () => {
  const { app } = boot();
  const old = JSON.stringify(fixture("ugly/progress.old-schema.json"));
  assert.equal(app.previewImport(old).ok, true);
  assert.equal(app.confirmImport().ok, true);
  assert.equal(app.state.progress.schemaVersion, 1);
});

test("clear removes the save and the old data, and returns fresh progress", () => {
  const { app, data } = boot({ initial: { [KEY]: "damaged{" } });
  assert.equal(app.state.oldData, true);
  assert.equal(app.clear(), null);
  assert.equal(data.has(KEY), false);
  assert.equal(data.has(CORRUPT_KEY), false);
  assert.equal(app.state.oldData, false);
  assert.equal(app.state.progress.rounds.length, 0);
  assert.equal(app.state.persist, true);
  assert.equal(app.state.notice, null);
});

test("clear that storage refuses shows blocked and stops saving", () => {
  const { app } = boot({ initial: { [KEY]: GOOD }, throwOn: ["removeItem"] });
  assert.equal(app.clear(), "blocked");
  assert.equal(app.state.persist, false);
  assert.equal(app.state.progress.rounds.length, 0);
});

test("clear drops a pending import", () => {
  const { app } = boot({ initial: { [KEY]: GOOD } });
  app.previewImport(exportText(good()));
  app.clear();
  assert.deepEqual(app.confirmImport(), { ok: false, saved: false });
});
