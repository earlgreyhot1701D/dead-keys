// Settings, "Your data": backup, old data, clear and import all ask first and never crash.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { findAll, makeFakeDoc, textOf, withFakeDocument } from "../fakeDom.js";

/** Like withFakeDocument, but keeps the fake in place until an async callback finishes. */
async function withFakeDocumentAsync(fn) {
  const doc = makeFakeDoc();
  globalThis.document = doc;
  try {
    return await fn(doc);
  } finally {
    delete globalThis.document;
  }
}

import {
  CLEAR_CANCEL,
  CLEAR_CONFIRM,
  CLEAR_LINE,
  CLEAR_TITLE,
  chooseFile,
  IMPORT_CANCEL,
  IMPORT_CONFIRM,
  IMPORT_TITLE,
  importLines,
  renderDataSection,
} from "./settingsData.js";

const NEWER = "This also deletes progress saved by a newer version of Dead Keys.";
const SUMMARY = (rounds, lessonsPassed) => ({ rounds, lessonsPassed });

function ctxFor({ oldData = false, newerSave = false, exportOk = true, preview } = {}) {
  const log = [];
  return {
    log,
    state: { oldData, newerSave },
    app: {
      exportBackup: () => {
        log.push(["export"]);
        return { ok: exportOk };
      },
      downloadOldData: () => log.push(["old"]),
      clear: () => log.push(["clear"]),
      previewImport: (t) => {
        log.push(["preview", t]);
        return preview ?? { ok: false, reason: "That isn't a backup file." };
      },
      confirmImport: () => {
        log.push(["confirmImport"]);
        return { ok: true };
      },
      cancelImport: () => log.push(["cancelImport"]),
    },
    go: (id) => log.push(["go", id]),
    announce: (t) => log.push(["say", t]),
  };
}
const button = (root, label) => findAll(root, (n) => n.tag === "button" && textOf(n) === label)[0];
const dialog = (doc) => findAll(doc.body, (n) => n.tag === "dialog")[0];
const design = () =>
  readFileSync(new URL("../../../.kiro/specs/shell/design.md", import.meta.url), "utf8");
const cell = (prefix) =>
  design()
    .split("\n")
    .find((l) => l.startsWith(prefix))
    .split("|")[2]
    .trim();

test("the Clear wording is the approved copy, word for word", () => {
  assert.equal(CLEAR_TITLE, "Clear all progress?");
  assert.equal(cell("| Clear confirm title"), CLEAR_TITLE);
  assert.equal(cell("| Clear confirm line (approved)"), CLEAR_LINE);
  assert.equal(
    cell("| Clear confirm buttons"),
    `${CLEAR_CONFIRM} (confirm) / ${CLEAR_CANCEL} (cancel)`,
  );
  assert.equal(CLEAR_CONFIRM, "Clear everything");
  assert.equal(CLEAR_CANCEL, "Keep my progress");
});

test("Clear asks first; Keep does nothing; Clear everything clears", () => {
  withFakeDocument((doc) => {
    const ctx = ctxFor();
    const root = renderDataSection(ctx);
    button(root, "Clear all progress").click();
    assert.equal(textOf(findAll(dialog(doc), (n) => n.tag === "h2")[0]), CLEAR_TITLE);
    assert.deepEqual(ctx.log, []); // nothing cleared yet
    button(dialog(doc), CLEAR_CANCEL).click();
    assert.deepEqual(ctx.log, []);
    assert.equal(dialog(doc), undefined);
    button(root, "Clear all progress").click();
    button(dialog(doc), CLEAR_CONFIRM).click();
    assert.deepEqual(ctx.log, [["clear"], ["say", "Progress cleared."]]);
  });
});

test("the newer-save warning is added only when it applies", () => {
  for (const [newerSave, want] of [
    [true, [CLEAR_LINE, NEWER]],
    [false, [CLEAR_LINE]],
  ]) {
    withFakeDocument((doc) => {
      button(renderDataSection(ctxFor({ newerSave })), "Clear all progress").click();
      const lines = findAll(dialog(doc), (n) => n.tag === "p").map(textOf);
      assert.deepEqual(lines, want);
    });
  }
});

test("backup announces only when it worked; old data shows only when there is some", () => {
  withFakeDocument(() => {
    const ok = ctxFor();
    button(renderDataSection(ok), "Download backup").click();
    assert.deepEqual(ok.log, [["export"], ["say", "Backup downloaded."]]);
    const bad = ctxFor({ exportOk: false });
    button(renderDataSection(bad), "Download backup").click();
    assert.deepEqual(bad.log, [["export"]]); // the notice is the app's job
    assert.equal(button(renderDataSection(ctxFor()), "Download old data"), undefined);
    const withOld = ctxFor({ oldData: true });
    button(renderDataSection(withOld), "Download old data").click();
    assert.deepEqual(withOld.log, [["old"]]);
  });
});

test("the privacy card is one button away", () => {
  withFakeDocument(() => {
    const ctx = ctxFor();
    button(renderDataSection(ctx), "Read the privacy card").click();
    assert.deepEqual(ctx.log, [["go", "privacy"]]);
  });
});

const fileOf = (text) => ({ slice: () => ({ text: async () => text }) });
const inputFor = (file) => ({ files: file ? [file] : [], value: "x" });

test("a bad file shows its reason in words and changes nothing", async () => {
  await withFakeDocumentAsync(async (doc) => {
    const ctx = ctxFor();
    const status = { textContent: "" };
    await chooseFile(ctx, inputFor(fileOf("nope")), status);
    assert.equal(status.textContent, "That isn't a backup file.");
    // Shown on the page, not spoken here: the app's importFailed notice is the one announcement.
    assert.deepEqual(ctx.log, [["preview", "nope"]]);
    assert.equal(dialog(doc), undefined);
  });
});

test("a file that cannot be read is treated as not a backup", async () => {
  await withFakeDocumentAsync(async () => {
    const ctx = ctxFor();
    const boom = { slice: () => ({ text: async () => Promise.reject(new Error("x")) }) };
    await chooseFile(ctx, inputFor(boom), { textContent: "" });
    assert.deepEqual(ctx.log[0], ["preview", null]);
  });
});

test("no file chosen does nothing", async () => {
  const ctx = ctxFor();
  await chooseFile(ctx, inputFor(null), { textContent: "" });
  assert.deepEqual(ctx.log, []);
});

test("a good file shows what changes and waits for yes; Keep cancels it", async () => {
  const preview = { ok: true, incoming: SUMMARY(12, 3), current: SUMMARY(5, 1) };
  await withFakeDocumentAsync(async (doc) => {
    const ctx = ctxFor({ preview });
    const input = inputFor(fileOf("{}"));
    await chooseFile(ctx, input, { textContent: "" });
    assert.equal(input.value, ""); // choosing the same file again still works
    assert.deepEqual(findAll(dialog(doc), (n) => n.tag === "p").map(textOf), importLines(preview));
    assert.ok(!ctx.log.some((e) => e[0] === "confirmImport"));
    button(dialog(doc), "Keep what I have").click();
    assert.deepEqual(ctx.log.at(-1), ["cancelImport"]);
  });
  await withFakeDocumentAsync(async (doc) => {
    const ctx = ctxFor({ preview });
    await chooseFile(ctx, inputFor(fileOf("{}")), { textContent: "" });
    button(dialog(doc), "Replace my progress").click();
    assert.deepEqual(ctx.log.slice(-2), [["confirmImport"], ["say", "Backup imported."]]);
  });
});

test("the import confirm and announcements match the design table, word for word", () => {
  const lines = importLines({ incoming: SUMMARY(12, 3), current: SUMMARY(5, 1) });
  const want = [IMPORT_TITLE, ...lines, `Buttons: ${IMPORT_CONFIRM}, ${IMPORT_CANCEL}`];
  assert.equal(cell("| Import confirm").split(" / ").join("|"), want.join("|"));
  assert.deepEqual(want[0], "Replace your progress?");
  assert.deepEqual(cell("| Announcements").split(" / "), [
    "Backup downloaded.",
    "Backup imported.",
    "Progress cleared.",
  ]);
});

test("importLines says both sides in numbers", () => {
  assert.deepEqual(importLines({ incoming: SUMMARY(12, 3), current: SUMMARY(5, 1) }), [
    "This backup has 12 rounds and 3 lessons passed.",
    "You have 5 rounds and 1 lesson passed now.",
    "Importing replaces what you have in this browser.",
  ]);
});
