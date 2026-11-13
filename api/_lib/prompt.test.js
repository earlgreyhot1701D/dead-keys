// The drill prompt (ai-drills design: Prompt; Req 2.4): the design's system rules, a user message
// of keys, rates and speed only, temperature 0.5 and 300 tokens.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPrompt, MAX_TOKENS, SYSTEM, TEMPERATURE, userMessage } from "./prompt.js";

const REQ = {
  packId: "general",
  weakKeys: [
    { key: "q", rate: 0.5 },
    { key: "z", rate: 0.3 },
  ],
  recentWpm: 24.4,
};

test("the user message is the design's example: keys with rates, then the speed", () => {
  assert.equal(userMessage(REQ), "Target keys: q 0.50, z 0.30\nSpeed: about 24 words per minute");
});

test("the user message holds nothing but the keys, two-place rates and a whole speed", () => {
  const msg = userMessage({ ...REQ, weakKeys: [{ key: "e", rate: 0.123456 }], recentWpm: 0 });
  assert.equal(msg, "Target keys: e 0.12\nSpeed: about 0 words per minute");
  assert.ok(!userMessage(REQ).includes("general"), "not even the pack id");
});

test("the system rules say what the design says, and the call settings are 0.5 and 300", () => {
  for (const rule of [
    "lowercase common English words, one word per line",
    "no numbers, no punctuation, no numbering, no sentences",
    "Write 30 different words.",
    "Never repeat a word.",
    "Every word must contain at least one of the target keys.",
  ]) {
    assert.ok(SYSTEM.includes(rule), rule);
  }
  assert.deepEqual(buildPrompt(REQ), {
    system: SYSTEM,
    user: userMessage(REQ),
    temperature: 0.5,
    maxTokens: 300,
  });
  assert.equal(TEMPERATURE, 0.5);
  assert.equal(MAX_TOKENS, 300);
});
