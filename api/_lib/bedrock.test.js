// The Bedrock call (ai-drills Req 2.4, 7.1), with the AWS client faked: the model id, the token
// ceiling, the message shape, and what comes back from a normal, odd or failing answer.
import assert from "node:assert/strict";
import { test } from "node:test";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockTimeout, converse, converseInput, MODEL_ID, TIMEOUT_MS } from "./bedrock.js";
import { buildPrompt } from "./prompt.js";

const PROMPT = buildPrompt({ weakKeys: [{ key: "q", rate: 0.5 }], recentWpm: 20 });
const clock =
  (...times) =>
  () =>
    times.shift();

test("Nova Micro, 300 tokens, the system and user text, and nothing else", () => {
  assert.equal(MODEL_ID, "us.amazon.nova-micro-v1:0");
  assert.deepEqual(converseInput(PROMPT), {
    modelId: "us.amazon.nova-micro-v1:0",
    system: [{ text: PROMPT.system }],
    messages: [{ role: "user", content: [{ text: PROMPT.user }] }],
    inferenceConfig: { maxTokens: 300, temperature: 0.7 },
  });
});

test("a normal answer: its text, stop reason, tokens and time", async () => {
  let sent = null;
  const send = async (cmd) => {
    sent = cmd;
    return {
      output: { message: { content: [{ text: "quiet queen\n" }, { text: "equal quote" }] } },
      stopReason: "end_turn",
      usage: { inputTokens: 120, outputTokens: 40 },
    };
  };
  const r = await converse(PROMPT, { send, now: clock(1000, 1450) });
  assert.ok(sent instanceof ConverseCommand);
  assert.deepEqual(sent.input, converseInput(PROMPT));
  assert.deepEqual(r, {
    text: "quiet queen\nequal quote",
    stopReason: "end_turn",
    usage: { inputTokens: 120, outputTokens: 40 },
    ms: 450,
  });
});

test("an odd answer never throws here: no content, no usage, no stop reason", async () => {
  const r = await converse(PROMPT, { send: async () => ({}), now: clock(0, 5) });
  assert.deepEqual(r, {
    text: "",
    stopReason: null,
    usage: { inputTokens: 0, outputTokens: 0 },
    ms: 5,
  });
  const odd = await converse(PROMPT, {
    send: async () => ({ output: { message: { content: [{ image: {} }] } }, stopReason: 7 }),
    now: clock(0, 1),
  });
  assert.equal(odd.text, "");
  assert.equal(odd.stopReason, null);
});

test("an SDK error is passed up for the caller's fallback", async () => {
  const send = async () => {
    throw Object.assign(new Error("ThrottlingException"), { name: "ThrottlingException" });
  };
  await assert.rejects(converse(PROMPT, { send }), /ThrottlingException/);
});

test("a hung call is aborted after the timeout and throws BedrockTimeout (Req 2.8)", async () => {
  assert.equal(TIMEOUT_MS, 3500);
  let signal = null;
  const hang = (_cmd, opts) =>
    new Promise((_, reject) => {
      signal = opts.abortSignal;
      signal.addEventListener("abort", () =>
        reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
      );
    });
  await assert.rejects(converse(PROMPT, { send: hang, timeoutMs: 20 }), BedrockTimeout);
  assert.equal(signal.aborted, true);
});
