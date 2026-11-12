// The build check must catch mock data and must not cry wolf. Proven with made-up dist files.
import assert from "node:assert/strict";
import { test } from "node:test";
import { collectNeedles, findHits } from "./check-build.js";

const fixture = {
  value: {
    id: "round-001",
    packId: "mini",
    items: [{ id: "mini-w1", text: "a lad asks a lass; all fall" }],
    nested: { lessonId: "1", name: "Mini home row pack" },
  },
};
const needles = collectNeedles([fixture]);
const file = (name, text) => ({ name, text });

test("needles are the distinctive ids and the long sample strings", () => {
  assert.deepEqual([...needles.ids].sort(), ["mini-w1", "round-001"]); // "mini" and "1" are too common
  assert.deepEqual(
    [...needles.texts].sort(),
    ["Mini home row pack", "a lad asks a lass; all fall"].sort(),
  );
});

test("a fixture id, a sample sentence, and a fixtures path are all hits", () => {
  const hits = findHits(
    [
      file("assets/a.js", 'x="round-001"'),
      file("assets/b.js", "y='a lad asks a lass; all fall'"),
      file("assets/c.js", 'import("../fixtures/normal/pack.mini.json")'),
    ],
    needles,
  );
  assert.deepEqual(hits.map((h) => `${h.kind}:${h.file}`).sort(), [
    "id:assets/a.js",
    "path:assets/c.js",
    "text:assets/b.js",
  ]);
});

test("a file inside a fixtures or mock folder is a hit even if its text is clean", () => {
  const hits = findHits([file("fixtures/x.json", "{}"), file("mock/index.html", "")], needles);
  assert.ok(hits.some((h) => h.file === "fixtures/x.json"));
  assert.ok(hits.some((h) => h.file === "mock/index.html"));
});

test("a clean build has no hits, and the word 'mini' alone is fine", () => {
  const hits = findHits(
    [file("index.html", "<title>Dead Keys</title>"), file("assets/a.js", "minimum mini")],
    needles,
  );
  assert.deepEqual(hits, []);
});

test("unreadable or odd fixture values do not crash it", () => {
  assert.deepEqual(collectNeedles([null, 5, "x", [], {}]).ids.size, 0);
});

test("the build check is wired in: check:build runs it, and deploy:preview runs check:build first", async () => {
  const { readFileSync } = await import("node:fs");
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const { "check:build": check, "deploy:preview": deploy } = pkg.scripts;
  assert.match(check, /vite build && node scripts\/check-build\.js/);
  assert.match(deploy, /^npm run check:build && vercel deploy /);
  // Preview only. Nothing goes to production without Shara's word.
  assert.match(deploy, /--environment=preview/);
  assert.doesNotMatch(deploy, /--prod|production/);
});
