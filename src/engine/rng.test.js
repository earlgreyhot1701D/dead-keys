// Req 1: same seed same sequence, every value in [0, 1), no Math.random.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { createRng } from "./rng.js";

const anySeed = fc.integer({ min: -(2 ** 31), max: 2 ** 32 });

/** Draw n numbers, threading the state through. */
function draw(seed, n) {
  const rng = createRng(seed);
  const out = [];
  let state = rng.state;
  for (let i = 0; i < n; i++) {
    const r = rng.next(state);
    out.push(r.value);
    state = r.state;
  }
  return out;
}

test("same seed gives the same sequence", () => {
  fc.assert(
    fc.property(anySeed, (seed) => {
      assert.deepEqual(draw(seed, 50), draw(seed, 50));
    }),
  );
});

test("every value is at least 0 and less than 1", () => {
  fc.assert(
    fc.property(anySeed, (seed) => {
      for (const v of draw(seed, 200)) assert.ok(v >= 0 && v < 1, `out of range: ${v}`);
    }),
  );
});

test("different seeds do not give the same sequence", () => {
  assert.notDeepEqual(draw(1, 20), draw(2, 20));
});

test("a copied state continues the same sequence (state is plain data)", () => {
  const rng = createRng(20261111);
  const a = rng.next(rng.state);
  const copy = JSON.parse(JSON.stringify({ state: a.state }));
  assert.equal(rng.next(copy.state).value, rng.next(a.state).value);
});

test("a daily seed (YYYYMMDD) is accepted and repeatable", () => {
  assert.deepEqual(draw(20261111, 5), draw(20261111, 5));
});

test("a seed that is not a finite number is a programmer error", () => {
  for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, "7", null, undefined]) {
    assert.throws(() => createRng(bad), TypeError);
  }
});

// Req 1.4 (no Math.random) and Req 5.2 (no clock): scan the code, not the comments.
const FORBIDDEN = [/Math\.random\s*\(/, /\bDate\b/, /\bperformance\./, /\bsetTimeout\b/];
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const hits = (src) => FORBIDDEN.filter((re) => re.test(stripComments(src)));

test("the scan finds a forbidden call in code and ignores one in a comment", () => {
  assert.equal(hits("const x = Math.random();").length, 1);
  assert.equal(hits("const t = Date.now();").length, 1);
  assert.equal(hits("const t = performance.now();").length, 1);
  assert.equal(hits("setTimeout(f, 1);").length, 1);
  assert.equal(
    hits("// Math.random() and Date\n/* performance.now() setTimeout */ const a = 1;").length,
    0,
  );
});

test("no engine source file calls Math.random, reads a clock or sets a timer", () => {
  const dir = new URL("./", import.meta.url);
  const files = readdirSync(dir).filter((f) => f.endsWith(".js") && !f.endsWith(".test.js"));
  assert.ok(files.length >= 8, `only found ${files.length} engine files`);
  for (const f of files) {
    assert.deepEqual(hits(readFileSync(new URL(f, dir), "utf8")), [], f);
  }
});
