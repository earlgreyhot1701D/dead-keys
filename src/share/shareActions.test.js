// Download PNG, Copy text and Share (share Req 3), with a fake browser: the file name, the
// release of the file's address, and every refusal turned into false or "failed", never a throw.
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeFakeDoc } from "../ui/fakeDom.js";
import {
  canShareFiles,
  copyText,
  downloadPng,
  fileName,
  shareCard,
  toPng,
} from "./shareActions.js";

const d = { wpm: 42 };
const canvas = (blob = { png: true }) => ({ toBlob: (cb) => cb(blob) });
class FakeFile {
  constructor(parts, name, opts) {
    Object.assign(this, { parts, name, type: opts.type });
  }
}
function api(nav = {}) {
  const log = [];
  return {
    log,
    doc: makeFakeDoc(),
    nav,
    File: FakeFile,
    createObjectURL: () => "blob:1",
    revokeObjectURL: (u) => log.push(["revoke", u]),
    later: (fn, ms) => log.push(["later", ms, fn]),
  };
}

test("the file name carries the speed only", () => {
  assert.equal(fileName(d), "dead-keys-42wpm.png");
});

test("toPng: a blob, or null when the canvas can't make one", async () => {
  assert.deepEqual(await toPng(canvas()), { png: true });
  assert.equal(await toPng(canvas(null)), null);
  assert.equal(
    await toPng({
      toBlob: () => {
        throw new Error("tainted");
      },
    }),
    null,
  );
});

test("Download PNG clicks a temporary link and releases the address later", async () => {
  const a = api();
  let clicked = null;
  const make = a.doc.createElement;
  a.doc.createElement = (tag) =>
    Object.assign(make(tag), {
      click() {
        clicked = this;
      },
    });
  assert.equal(await downloadPng(canvas(), d, a), true);
  assert.equal(clicked.download, "dead-keys-42wpm.png");
  assert.equal(a.doc.body.children.length, 0); // the link is gone
  const [kind, ms, fn] = a.log[0];
  assert.deepEqual([kind, ms], ["later", 10_000]);
  fn();
  assert.deepEqual(a.log.at(-1), ["revoke", "blob:1"]);
  assert.equal(await downloadPng(canvas(null), d, a), false);
});

test("Copy text: true on success, false when the clipboard is missing or refuses", async () => {
  const got = [];
  assert.equal(
    await copyText("hi", api({ clipboard: { writeText: async (t) => got.push(t) } })),
    true,
  );
  assert.deepEqual(got, ["hi"]);
  assert.equal(await copyText("hi", api({})), false);
  const no = {
    clipboard: {
      writeText: async () => {
        throw new Error("denied");
      },
    },
  };
  assert.equal(await copyText("hi", api(no)), false);
});

test("Share shows only where files can be shared; a cancel is quiet, a failure is not", async () => {
  assert.equal(canShareFiles(api({})), false);
  assert.equal(canShareFiles(api({ share: () => {}, canShare: () => false })), false);
  const shared = [];
  const nav = { share: async (o) => shared.push(o), canShare: () => true };
  assert.equal(canShareFiles(api(nav)), true);
  assert.equal(await shareCard(canvas(), d, "line", api(nav)), "shared");
  assert.equal(shared[0].files[0].name, "dead-keys-42wpm.png");
  assert.equal(shared[0].text, "line");
  const abort = Object.assign(new Error("no"), { name: "AbortError" });
  const cancel = {
    share: async () => {
      throw abort;
    },
  };
  assert.equal(await shareCard(canvas(), d, "line", api(cancel)), "cancelled");
  const fail = {
    share: async () => {
      throw new Error("nope");
    },
  };
  assert.equal(await shareCard(canvas(), d, "line", api(fail)), "failed");
  assert.equal(await shareCard(canvas(null), d, "line", api(nav)), "failed");
});
