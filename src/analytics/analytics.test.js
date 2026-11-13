// Vercel Web Analytics loader (PRD G9): one same-origin script, never on this machine, never twice,
// and never a crash.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ANALYTICS_SRC, countsHere, loadAnalytics } from "./analytics.js";

const fakeDoc = () => {
  const added = [];
  return {
    added,
    querySelector: (sel) => added.find((s) => sel.includes(s.src)) ?? null,
    createElement: () => ({}),
    head: { appendChild: (s) => added.push(s) },
  };
};

test("counts on the live site and previews, never on this machine", () => {
  for (const h of ["dead-keys.vercel.app", "dead-keys-abc123.vercel.app", "deadkeys.dev"]) {
    assert.equal(countsHere(h), true, h);
  }
  for (const h of ["localhost", "127.0.0.1", "[::1]", "app.localhost", "dk.test", "", undefined]) {
    assert.equal(countsHere(h), false, String(h));
  }
});

test("adds one deferred, same-origin script, once", () => {
  const doc = fakeDoc();
  assert.equal(loadAnalytics(doc, "dead-keys.vercel.app"), true);
  assert.equal(loadAnalytics(doc, "dead-keys.vercel.app"), false);
  assert.equal(doc.added.length, 1);
  assert.deepEqual(doc.added[0], { defer: true, src: ANALYTICS_SRC });
  assert.ok(ANALYTICS_SRC.startsWith("/"), "same origin, no third party");
});

test("adds nothing locally, and a broken document never throws", () => {
  const doc = fakeDoc();
  assert.equal(loadAnalytics(doc, "localhost"), false);
  assert.equal(doc.added.length, 0);
  assert.equal(loadAnalytics(null, "dead-keys.vercel.app"), false);
});
