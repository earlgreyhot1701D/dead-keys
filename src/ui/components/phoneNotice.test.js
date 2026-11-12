// The phone notice (shell Req 1.5): when it shows, the wording, and what counts as a hardware key.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { createEl } from "../dom.js";
import { makeFakeDoc, textOf } from "../fakeDom.js";
import {
  isHardwareKey,
  MIN_WIDTH,
  PHONE_NOTICE,
  renderPhoneNotice,
  showPhoneNotice,
} from "./phoneNotice.js";

test("a touch-only device with no hardware keyboard sees it", () => {
  assert.equal(showPhoneNotice({ coarse: true, width: 1400, keyboardSeen: false }), true);
});

test("once a hardware key has been used, a touch device that is wide enough does not", () => {
  assert.equal(showPhoneNotice({ coarse: true, width: 1400, keyboardSeen: true }), false);
});

test("a viewport under 900 px sees it, whatever the device", () => {
  for (const keyboardSeen of [true, false]) {
    assert.equal(showPhoneNotice({ coarse: false, width: MIN_WIDTH - 1, keyboardSeen }), true);
    assert.equal(showPhoneNotice({ coarse: true, width: 360, keyboardSeen }), true);
  }
  assert.equal(MIN_WIDTH, 900);
});

test("a wide desktop with a mouse never sees it", () => {
  assert.equal(showPhoneNotice({ coarse: false, width: 900, keyboardSeen: false }), false);
  assert.equal(showPhoneNotice({ coarse: false, width: 1920, keyboardSeen: true }), false);
});

test("an unknown width does not, by itself, show it", () => {
  for (const width of [undefined, Number.NaN, null]) {
    assert.equal(
      showPhoneNotice({ coarse: false, width, keyboardSeen: false }),
      false,
      String(width),
    );
  }
});

test("it follows the rule for any inputs", () => {
  fc.assert(
    fc.property(
      fc.boolean(),
      fc.integer({ min: 200, max: 3000 }),
      fc.boolean(),
      (coarse, width, keyboardSeen) => {
        assert.equal(
          showPhoneNotice({ coarse, width, keyboardSeen }),
          (coarse && !keyboardSeen) || width < 900,
        );
      },
    ),
  );
});

test("a real key counts as a hardware key; the on-screen keyboard's does not", () => {
  assert.equal(isHardwareKey({ key: "a", keyCode: 65, isTrusted: true }), true);
  assert.equal(isHardwareKey({ key: "Enter" }), true);
  assert.equal(isHardwareKey({ key: "Unidentified", keyCode: 229 }), false);
  assert.equal(isHardwareKey({ key: "a", keyCode: 229 }), false);
  assert.equal(isHardwareKey({ key: "a", isTrusted: false }), false); // a script, not a person
  for (const bad of [null, undefined, {}, { key: 5 }]) assert.equal(isHardwareKey(bad), false);
});

test("the wording is the shell design's approved copy, one sentence per idea, and says a keyboard is needed", () => {
  const design = readFileSync(
    new URL("../../../.kiro/specs/shell/design.md", import.meta.url),
    "utf8",
  );
  const row = design.split("\n").find((l) => l.startsWith("| Phone notice"));
  assert.equal(row.split("|").slice(1, -1)[1].trim(), PHONE_NOTICE);
  assert.match(PHONE_NOTICE, /physical keyboard/);
  assert.doesNotMatch(PHONE_NOTICE, /\bglass\b|\bage\b|\bold\b|\byoung\b/i);
});

test("it renders as one marked paragraph of text", () => {
  const node = renderPhoneNotice(createEl(makeFakeDoc()));
  assert.equal(node.tag, "p");
  assert.equal(textOf(node), PHONE_NOTICE);
  assert.ok("data-phone-notice" in node.attrs);
});
