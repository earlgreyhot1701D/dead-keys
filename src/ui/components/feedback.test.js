// The feedback link (Block 16): the Tally form, opened in a new tab without an opener.
import assert from "node:assert/strict";
import { test } from "node:test";
import { LINKS } from "../screens/about.js";
import { FEEDBACK_LABEL, FEEDBACK_URL } from "./feedback.js";

test("the feedback form is a Tally https link", () => {
  const u = new URL(FEEDBACK_URL);
  assert.equal(u.protocol, "https:");
  assert.equal(u.hostname, "tally.so");
  assert.ok(FEEDBACK_LABEL.length > 0);
});

test("About lists the feedback form first", () => {
  assert.deepEqual(LINKS[0], { label: FEEDBACK_LABEL, href: FEEDBACK_URL });
});
