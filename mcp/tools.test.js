// Job: test the MCP tool handlers with no network: path refusal, validate_pack on the real packs, run_golden_set's confirm gate.
// mcp Req 2 to 4. Bedrock is never called here: run_golden_set gets a fake `ask` when confirmed.
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { createServer } from "./server.js";
import { PACKS, packPath, runGoldenSet, TOOLS, validatePack } from "./tools.js";

const text = (r) => r.content.map((c) => c.text).join("\n");

test("a path outside packs/, or not a .json file, is refused", () => {
  for (const bad of [
    "../package.json",
    "packs/../package.json",
    "packs/../../etc/passwd",
    "C:\\Windows\\win.ini",
    "/etc/passwd",
    "api/drill.js",
    "packs",
    "packs/blocklist-es.txt",
    "",
    "packs/x\0.json",
    42,
  ]) {
    assert.equal(packPath(bad), null, String(bad));
    const r = validatePack({ path: bad });
    assert.equal(r.isError, true, String(bad));
    assert.match(text(r), /^Refused: path must be a \.json file inside packs\/\.$/);
  }
  assert.ok(packPath("packs/spanish.json").endsWith("spanish.json"));
});

test("validate_pack with no path checks every real pack, and both pass", () => {
  const r = validatePack();
  assert.equal(r.isError, false);
  assert.match(text(r), /^OK {3}packs\/general\.json: 1500 items$/m);
  assert.match(text(r), /^OK {3}packs\/spanish\.json: \d+ items$/m);
});

test("validate_pack on one pack; a missing file is a FAIL, not a crash", () => {
  assert.match(text(validatePack({ path: "packs/general.json" })), /^OK {3}packs\/general\.json/);
  const r = validatePack({ path: "packs/nope.json" });
  assert.equal(r.isError, true);
  assert.match(
    text(r),
    /^FAIL packs\/nope\.json: 1 problem\(s\)\n {5}\(file\): can't read it as JSON/,
  );
});

test("run_golden_set refuses without confirm: true, and never calls Bedrock then", async () => {
  let called = 0;
  const ask = async () => {
    called += 1;
    return { text: "", stopReason: "end_turn" };
  };
  for (const args of [{}, { confirm: false }, { confirm: "true" }, { confirm: 1 }]) {
    const r = await runGoldenSet(args, ask);
    assert.equal(r.isError, true);
    assert.match(text(r), /^Refused: run_golden_set calls real Bedrock/);
  }
  assert.equal(called, 0);
});

test("run_golden_set with confirm returns run.js's lines and nothing from the environment", async () => {
  process.env.DK_TEST_SECRET = "do-not-leak";
  try {
    const ask = async () => ({
      text: "queen quiet quote equal square quilt quick quest",
      stopReason: "end_turn",
    });
    const r = await runGoldenSet({ confirm: true }, ask);
    const out = text(r);
    assert.match(out, /^TOTAL \d of 6 passed$/m);
    assert.equal(out.split("\n").length, 7);
    assert.ok(
      !out.includes("do-not-leak") && !/queen|quiet/.test(out),
      "no env value, no drill text",
    );
  } finally {
    delete process.env.DK_TEST_SECRET;
  }
});

test("the server lists exactly the two tools, with plain JSON Schema inputs", () => {
  assert.deepEqual(
    TOOLS.map((t) => t.name),
    ["validate_pack", "run_golden_set"],
  );
  assert.deepEqual(TOOLS[1].inputSchema.required, ["confirm"]);
  assert.ok(createServer());
});

test("a symlink inside packs/ that leads outside it is refused (review, Nov 13)", () => {
  const outside = mkdtempSync(join(tmpdir(), "dk-"));
  const link = join(PACKS, "zz-link-test.json");
  writeFileSync(join(outside, "x.json"), "{}");
  try {
    symlinkSync(join(outside, "x.json"), link);
  } catch {
    return; // this machine can't make symlinks (Windows without the right); nothing to test
  }
  try {
    assert.equal(packPath("packs/zz-link-test.json"), null);
    rmSync(join(outside, "x.json"));
    assert.equal(packPath("packs/zz-link-test.json"), null, "dangling too");
  } finally {
    rmSync(link, { force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});
