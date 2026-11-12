// Saving a file to disk: the logic, against a fake browser. Nothing is sent anywhere.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { downloadText, REVOKE_DELAY_MS } from "./download.js";
import { makeFakeDoc } from "./fakeDom.js";

/** A fake browser that records what was made, linked and released. */
function fakeApi({ clickThrows = false, urlThrows = false } = {}) {
  const doc = makeFakeDoc();
  const log = { blobs: [], urls: [], revoked: [], links: [], later: [] };
  class FakeBlob {
    constructor(parts, opts) {
      this.text = parts.join("");
      this.type = opts.type;
      log.blobs.push(this);
    }
  }
  const origCreate = doc.createElement;
  doc.createElement = (tag) => {
    const node = origCreate(tag);
    if (tag === "a") {
      log.links.push(node);
      node.click = () => {
        if (clickThrows) throw new Error("click blocked");
        node.clicked = true;
      };
    }
    return node;
  };
  return {
    log,
    api: {
      Blob: FakeBlob,
      createObjectURL: (blob) => {
        if (urlThrows) throw new Error("no urls");
        log.urls.push(blob);
        return `blob:fake/${log.urls.length}`;
      },
      revokeObjectURL: (url) => log.revoked.push(url),
      later: (fn, ms) => log.later.push({ fn, ms }),
      doc,
    },
  };
}
/** Run the delayed releases, as time passing would. */
const passTime = (log) => {
  for (const { fn } of log.later.splice(0)) fn();
};

test("it makes a file with the text, links it, clicks it, and releases it", () => {
  const { api, log } = fakeApi();
  downloadText("dead-keys-backup.json", '{"a":1}', api);
  assert.equal(log.blobs[0].text, '{"a":1}');
  assert.equal(log.blobs[0].type, "application/json");
  const link = log.links[0];
  assert.equal(link.href, "blob:fake/1");
  assert.equal(link.download, "dead-keys-backup.json");
  assert.equal(link.rel, "noopener");
  assert.equal(link.clicked, true);
  // Not released in the same moment (Firefox and Safari can cancel the download), but later.
  assert.deepEqual(log.revoked, []);
  assert.equal(log.later.length, 1);
  assert.equal(log.later[0].ms, REVOKE_DELAY_MS);
  assert.ok(REVOKE_DELAY_MS >= 1000);
  passTime(log);
  assert.deepEqual(log.revoked, ["blob:fake/1"]);
});

test("the link is added to the page for the click and removed after", () => {
  const { api, log } = fakeApi();
  downloadText("a.json", "x", api);
  assert.equal(api.doc.body.children.length, 0);
  assert.equal(log.links[0].parent, null);
});

test(".txt is plain text", () => {
  const { api, log } = fakeApi();
  downloadText("notes.txt", "hi", api);
  assert.equal(log.blobs[0].type, "text/plain");
});

test("a failing click still removes the link and releases the file, then the error is raised", () => {
  const { api, log } = fakeApi({ clickThrows: true });
  assert.throws(() => downloadText("a.json", "x", api), /click blocked/);
  assert.equal(api.doc.body.children.length, 0);
  assert.deepEqual(log.revoked, ["blob:fake/1"]); // released at once: nothing is downloading
  assert.equal(log.later.length, 0);
});

test("a browser that cannot make the file raises, with nothing left behind", () => {
  const { api, log } = fakeApi({ urlThrows: true });
  assert.throws(() => downloadText("a.json", "x", api), /no urls/);
  assert.equal(api.doc.body.children.length, 0);
  assert.deepEqual(log.revoked, []);
});

test("a file name that could be a path, or the wrong kind of file, is refused before anything happens", () => {
  const bad = [
    "",
    "../x.json",
    "a/b.json",
    "a\\b.json",
    "x.html",
    "x.js",
    "x",
    ".json",
    "-a.json",
    "a b.json",
    "a.json ",
    `${"x".repeat(90)}.json`,
    "a\u0000.json",
    "../../etc/passwd.txt",
  ];
  for (const name of bad) {
    const { api, log } = fakeApi();
    assert.throws(() => downloadText(name, "x", api), TypeError, JSON.stringify(name));
    assert.deepEqual(log.blobs, []);
  }
  for (const name of ["dead-keys-backup.json", "dead-keys-old-data.json", "a_b-c.1.txt"]) {
    assert.doesNotThrow(() => downloadText(name, "x", fakeApi().api), name);
  }
});

test("the text must be a string", () => {
  for (const bad of [null, undefined, 5, {}, ["a"]]) {
    assert.throws(() => downloadText("a.json", bad, fakeApi().api), TypeError);
  }
});

test("any text is kept exactly, including unusual characters", () => {
  fc.assert(
    fc.property(fc.string({ unit: "binary" }), (s) => {
      const { api, log } = fakeApi();
      downloadText("a.json", s, api);
      assert.equal(log.blobs[0].text, s);
    }),
  );
});
