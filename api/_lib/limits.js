// The AI route's brakes (PRD G8; ai-drills Req 2.3): a per-visitor limit of 30 calls an hour and a
// daily cap of 3,000 calls, both in memory. Each running function instance counts on its own, so
// the caps are approximate (PRD G8 known limit). A visitor is a salted hash of the forwarded IP;
// the IP itself is never kept, logged or returned. In api/_lib so Vercel never serves it.
// shortcut: in-memory counters per instance, upgrade to a shared counter if usage outgrows them (PRD G2 STUB).
import { createHash, randomBytes } from "node:crypto";

export const PER_VISITOR_HOUR = 30;
export const DAILY_CAP = 3000;
const HOUR_MS = 60 * 60 * 1000;

const SALT = randomBytes(16).toString("hex"); // per instance, never logged

/**
 * A visitor id from the request's forwarded IP: sha256 of salt + IP, cut to 16 hex characters.
 * No IP (a local run) is one shared visitor.
 * @param {string|null} forwardedFor The `x-forwarded-for` header.
 * @param {string} [salt]
 */
export function visitorId(forwardedFor, salt = SALT) {
  const ip = String(forwardedFor ?? "")
    .split(",")[0]
    .trim();
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 16);
}

/** The UTC day a time falls on, "YYYY-MM-DD": the daily cap resets at midnight UTC. */
const dayOf = (ms) => new Date(ms).toISOString().slice(0, 10);

/**
 * One set of counters (one per function instance). `take` counts a call when it is allowed:
 * the per-visitor limit first, then the daily cap.
 * @param {{ perVisitor?: number, daily?: number }} [o] Overridable for tests.
 */
export function createLimits({ perVisitor = PER_VISITOR_HOUR, daily = DAILY_CAP } = {}) {
  const calls = new Map(); // visitor id -> times of calls in the last hour
  let day = null;
  let today = 0;
  return {
    /**
     * @param {string} visitor From `visitorId`.
     * @param {number} now Milliseconds.
     * @returns {"ok"|"rate"|"cap"} "rate": this visitor's hour is used up; "cap": today's is.
     */
    take(visitor, now) {
      for (const [v, times] of calls) {
        const kept = times.filter((t) => now - t < HOUR_MS);
        if (kept.length) calls.set(v, kept);
        else calls.delete(v);
      }
      if (dayOf(now) !== day) [day, today] = [dayOf(now), 0];
      const mine = calls.get(visitor) ?? [];
      if (mine.length >= perVisitor) return "rate";
      if (today >= daily) return "cap";
      calls.set(visitor, [...mine, now]);
      today += 1;
      return "ok";
    },
    /** How many visitors are being counted (for tests: old ones are dropped). */
    size: () => calls.size,
  };
}
