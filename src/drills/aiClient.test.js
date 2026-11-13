// The browser's AI drill client (ai-drills Req 1, 3.1 to 3.3), with fetch faked: the request holds
// only weak keys, rates and speed; any failure, timeout or bad answer is null (built-in drill).
import assert from "node:assert/strict";
import { test } from "node:test";
import { drillRequest, fetchAiWords, ROUTE, TIMEOUT_MS } from "./aiClient.js";

const PACK = { id: "general", charset: "abcdefghijklmnopqrstuvwxyz" };
const AZ = PACK.charset;
const stat = (key, attempts, misses) => ({ key, attempts, misses, lastSeen: 0 });
const KEYS = [stat("q", 40, 20), stat("z", 30, 9), stat(";", 20, 10), stat("e", 50, 1)];
const LINES = ["quiet queen quote equal", "square quilt quick quest", "aqua quiz"];

test("the request: up to 6 charset weak keys with their two-place rates, and the last speed", () => {
  const req = drillRequest(PACK, ["q", ";", "z"], KEYS, [{ wpm: 12 }, { wpm: 31.6 }]);
  assert.deepEqual(req, {
    packId: "general",
    weakKeys: [
      { key: "q", rate: 0.5 },
      { key: "z", rate: 0.3 },
    ],
    recentWpm: 32,
  });
});

test("speed: 0 with no rounds, clamped to 250; no sendable weak key: no request", () => {
  assert.equal(drillRequest(PACK, ["q"], KEYS, []).recentWpm, 0);
  assert.equal(drillRequest(PACK, ["q"], KEYS, [{ wpm: 400 }]).recentWpm, 250);
  assert.equal(drillRequest(PACK, [], KEYS, []), null);
  assert.equal(drillRequest(PACK, [";"], KEYS, []), null, "outside the charset");
  assert.equal(drillRequest(PACK, ["x"], KEYS, []), null, "no stats for it");
  assert.equal(
    drillRequest(
      PACK,
      "qzertyuiop".split(""),
      KEYS.concat("rtyuiop".split("").map((k) => stat(k, 20, 2))),
      [],
    ).weakKeys.length <= 6,
    true,
  );
});

/** A fake fetch that records the call and answers with `reply` (a Response, or a function). */
function fakeFetch(reply) {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return typeof reply === "function" ? reply(init) : reply;
  };
  return { f, calls };
}
const ok = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const REQ = drillRequest(PACK, ["q"], KEYS, []);

test("a good answer: one POST of the request, then the words", async () => {
  const { f, calls } = fakeFetch(ok({ lines: LINES, source: "ai" }));
  const words = await fetchAiWords(REQ, AZ, { fetch: f });
  assert.equal(words.length, 10);
  assert.ok(words.includes("quiet") && words.includes("quiz"));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, ROUTE);
  assert.equal(calls[0].init.method, "POST");
  assert.deepEqual(calls[0].body, REQ, "nothing but the DrillRequest");
});

test("every failure is null: error codes, 429, 500, bad character, wrong source, not JSON, throw", async () => {
  const cases = [
    ok({ error: "cap" }),
    ok({ error: "rate" }, 429),
    new Response("oops", { status: 500 }),
    ok({ lines: ["quiet, queen", ...LINES], source: "ai" }),
    ok({ lines: LINES, source: "built-in" }),
    new Response("{not json", { status: 200 }),
    () => {
      throw new TypeError("offline");
    },
  ];
  for (const reply of cases)
    assert.equal(await fetchAiWords(REQ, AZ, { fetch: fakeFetch(reply).f }), null);
});

test("fewer than 8 words is null: the built-in drill runs", async () => {
  const { f } = fakeFetch(ok({ lines: ["quiet queen quote", "quiet equal"], source: "ai" }));
  assert.equal(await fetchAiWords(REQ, AZ, { fetch: f }), null);
});

test("a slow answer is aborted at the timeout and is null", async () => {
  assert.equal(TIMEOUT_MS, 4000);
  const slow = (init) =>
    new Promise((_, reject) =>
      init.signal.addEventListener("abort", () => reject(new Error("aborted"))),
    );
  const start = Date.now();
  assert.equal(await fetchAiWords(REQ, AZ, { fetch: fakeFetch(slow).f, timeoutMs: 30 }), null);
  assert.ok(Date.now() - start < 1000);
});
