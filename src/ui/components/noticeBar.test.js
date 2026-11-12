// Shell Req 3.3: every notice is drawn with its approved wording and button, and each button does
// something. Runs under node with the fake document.
import assert from "node:assert/strict";
import { test } from "node:test";
import { NOTICES } from "../../storage/notices.js";
import { createEl } from "../dom.js";
import { findAll, makeFakeDoc, textOf } from "../fakeDom.js";
import { ACTIONS, renderNotice, runAction } from "./noticeBar.js";

const mk = createEl(makeFakeDoc());
const buttons = (node) => findAll(node, (n) => n.tag === "button");

test("every notice has an action, and no action is for a notice that does not exist", () => {
  assert.deepEqual(Object.keys(ACTIONS).sort(), Object.keys(NOTICES).sort());
});

test("each notice is drawn with its approved line, its button, and Dismiss", () => {
  for (const [id, notice] of Object.entries(NOTICES)) {
    const node = renderNotice(mk, id, { run: () => {}, dismiss: () => {} });
    assert.equal(node.attrs["data-notice"], id);
    assert.equal(findAll(node, (n) => n.tag === "p")[0].children[0].text, notice.line);
    assert.deepEqual(buttons(node).map(textOf), [notice.button, "Dismiss"], id);
  }
});

test("the buttons call run with the notice id, and dismiss", () => {
  const calls = [];
  const node = renderNotice(mk, "blocked", {
    run: (id) => calls.push(["run", id]),
    dismiss: () => calls.push(["dismiss"]),
  });
  const [main, dismiss] = buttons(node);
  main.click();
  dismiss.click();
  assert.deepEqual(calls, [["run", "blocked"], ["dismiss"]]);
  for (const b of [main, dismiss]) assert.equal(b.attrs.type, "button");
});

test("the notice text is text, never markup", () => {
  const node = renderNotice(mk, "corrupt", { run() {}, dismiss() {} });
  assert.doesNotMatch(textOf(node), /[<>]/);
});

test("an id that is not a notice is refused", () => {
  for (const bad of ["nope", "", "__proto__", "constructor", undefined, null]) {
    assert.throws(() => renderNotice(mk, bad, { run() {}, dismiss() {} }), RangeError, String(bad));
  }
});

/** An app stand-in that records which action ran. */
function stubApp(retry = null) {
  const calls = [];
  const rec = (name) => () => calls.push(name);
  return {
    calls,
    state: { retry },
    exportBackup: rec("exportBackup"),
    downloadOldData: rec("downloadOldData"),
    reload: rec("reload"),
  };
}

test("each button does what its notice promises", () => {
  const want = {
    blocked: "exportBackup",
    corrupt: "downloadOldData",
    newer: "reload",
    saveFailed: "exportBackup",
    otherTab: "reload",
  };
  for (const [id, action] of Object.entries(want)) {
    const app = stubApp();
    assert.equal(runAction(id, { app, go: () => assert.fail("no navigation") }), action, id);
    assert.deepEqual(app.calls, [action], id);
  }
});

test("importFailed's button goes to Settings, where import lives", () => {
  const went = [];
  const app = stubApp();
  runAction("importFailed", { app, go: (s) => went.push(s) });
  assert.deepEqual(went, ["settings"]);
  assert.deepEqual(app.calls, []);
});

test("Try again repeats whichever export or download just failed", () => {
  const a = stubApp("downloadOldData");
  runAction("exportFailed", { app: a, go: () => {} });
  assert.deepEqual(a.calls, ["downloadOldData"]);
  for (const retry of ["exportBackup", null, undefined, "reload"]) {
    const b = stubApp(retry);
    runAction("exportFailed", { app: b, go: () => {} });
    assert.deepEqual(b.calls, ["exportBackup"], String(retry)); // anything else falls back to a fresh export
  }
});

test("running a notice with no action is refused", () => {
  assert.throws(() => runAction("nope", { app: stubApp(), go: () => {} }), RangeError);
});
