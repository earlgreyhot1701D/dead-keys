// The AI route's brakes (ai-drills Req 2.3, 7.1): 30 an hour per visitor, 3,000 a day, the visitor
// a salted hash that never holds the IP.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createLimits, DAILY_CAP, PER_VISITOR_HOUR, visitorId } from "./limits.js";

const T0 = Date.UTC(2026, 10, 13, 12, 0, 0);
const HOUR = 60 * 60 * 1000;

test("the PRD G8 numbers: 30 an hour per visitor, 3,000 a day", () => {
  assert.equal(PER_VISITOR_HOUR, 30);
  assert.equal(DAILY_CAP, 3000);
});

test("a visitor gets 30 calls an hour, then rate, then more an hour after the first", () => {
  const l = createLimits();
  for (let i = 0; i < 30; i++) assert.equal(l.take("v1", T0 + i * 1000), "ok");
  assert.equal(l.take("v1", T0 + 31_000), "rate");
  assert.equal(l.take("v2", T0 + 31_000), "ok", "another visitor is not limited");
  assert.equal(l.take("v1", T0 + HOUR), "ok", "the first call has left the hour");
  assert.equal(l.take("v1", T0 + HOUR + 1), "rate", "the second is still inside it");
  assert.equal(l.take("v1", T0 + HOUR + 1000), "ok", "now the second has left too");
});

test("the daily cap stops everyone, and resets at midnight UTC", () => {
  const l = createLimits({ perVisitor: 1000, daily: 3 });
  for (const v of ["a", "b", "c"]) assert.equal(l.take(v, T0), "ok");
  assert.equal(l.take("d", T0 + 1), "cap");
  assert.equal(l.take("d", Date.UTC(2026, 10, 14, 0, 0, 1)), "ok");
});

test("the per-visitor limit is checked before the cap, and a refused call is not counted", () => {
  const l = createLimits({ perVisitor: 1, daily: 2 });
  assert.equal(l.take("a", T0), "ok");
  assert.equal(l.take("a", T0 + 1), "rate");
  assert.equal(l.take("b", T0 + 2), "ok", "the refused call did not use the day's cap");
  assert.equal(l.take("c", T0 + 3), "cap");
});

test("visitors with no calls in the last hour are dropped from memory", () => {
  const l = createLimits();
  l.take("a", T0);
  l.take("b", T0 + 1);
  assert.equal(l.size(), 2);
  l.take("c", T0 + HOUR + 10);
  assert.equal(l.size(), 1);
});

test("the visitor id is a salted hash: no IP inside, same IP same id, salt changes it", () => {
  const ip = "203.0.113.7";
  const a = visitorId(`${ip}, 10.0.0.1`, "s1");
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.ok(!a.includes(ip));
  assert.equal(visitorId(ip, "s1"), a, "only the first forwarded address counts");
  assert.notEqual(visitorId(ip, "s2"), a);
  assert.notEqual(visitorId("203.0.113.8", "s1"), a);
  assert.equal(visitorId(null, "s1"), visitorId("", "s1"));
});
