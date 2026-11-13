// The usage ledger (ai-drills Req 2.7, 7.1): exactly time, tokens, stop reason, latency and result.
import assert from "node:assert/strict";
import { test } from "node:test";
import { FIELDS, ledgerLine, writeLedger } from "./ledger.js";

const AT = Date.UTC(2026, 10, 13, 12, 0, 0);

test("a ledger line has exactly the PRD's fields", () => {
  const line = JSON.parse(
    ledgerLine({
      at: AT,
      inputTokens: 250,
      outputTokens: 300,
      stopReason: "end_turn",
      ms: 812,
      result: "ok",
    }),
  );
  assert.deepEqual(Object.keys(line), [...FIELDS]);
  assert.deepEqual(line, {
    at: "2026-11-13T12:00:00.000Z",
    inputTokens: 250,
    outputTokens: 300,
    stopReason: "end_turn",
    ms: 812,
    result: "ok",
  });
});

test("nothing else gets in: weak keys, IP, visitor and lines are dropped", () => {
  const line = ledgerLine({
    at: AT,
    result: "rate",
    weakKeys: [{ key: "q", rate: 0.5 }],
    ip: "203.0.113.7",
    visitor: "abc",
    lines: ["quiet queen"],
  });
  for (const leak of ["weakKeys", "203.0.113.7", "visitor", "quiet"])
    assert.ok(!line.includes(leak), leak);
  assert.deepEqual(JSON.parse(line), {
    at: "2026-11-13T12:00:00.000Z",
    inputTokens: 0,
    outputTokens: 0,
    stopReason: null,
    ms: 0,
    result: "rate",
  });
});

test("it writes one line to the log", () => {
  const out = [];
  writeLedger({ at: AT, result: "cap" }, (s) => out.push(s));
  assert.equal(out.length, 1);
  assert.match(out[0], /^ledger \{"at":"2026-11-13T12:00:00\.000Z",.*"result":"cap"\}$/);
});
