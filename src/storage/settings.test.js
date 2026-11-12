// Shell Req 5.1 and 5.2: settings have defaults, are checked on load, and survive the contract.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { validate } from "../../contract/validate.js";
import { SPEED_MAX, SPEED_MIN } from "../engine/config.js";
import {
  DEFAULTS,
  isValidSetting,
  normalizeSettings,
  SOUND_SETS,
  withSetting,
} from "./settings.js";
import { vet } from "./vet.js";

const KEYS = ["ai", "sound", "speed", "fingerColors", "privacySeen"];
const basic = () =>
  JSON.parse(
    readFileSync(new URL("../../fixtures/normal/progress.basic.json", import.meta.url), "utf8"),
  ).value;

/** Add an own property even for "__proto__" (assignment would set the prototype instead). */
const own = (obj, key, value) =>
  Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });

test("defaults: sound off, speed 0.7x (Shara, Nov 12: new typists start slow), AI off, finger colors on, privacy card not yet seen", () => {
  assert.deepEqual(DEFAULTS, {
    ai: false,
    sound: "off",
    speed: 0.7,
    fingerColors: true,
    privacySeen: false,
  });
  assert.ok(Object.isFrozen(DEFAULTS));
  for (const [k, v] of Object.entries(DEFAULTS)) assert.equal(isValidSetting(k, v), true, k);
});

test("the speed range is the engine's: one source of truth", () => {
  assert.equal(isValidSetting("speed", SPEED_MIN), true);
  assert.equal(isValidSetting("speed", SPEED_MAX), true);
  assert.equal(isValidSetting("speed", SPEED_MIN - 0.01), false);
  assert.equal(isValidSetting("speed", SPEED_MAX + 0.01), false);
  assert.ok(DEFAULTS.speed >= SPEED_MIN && DEFAULTS.speed <= SPEED_MAX);
});

test("the sound sets are Off, Typewriter and Arcade", () => {
  assert.deepEqual([...SOUND_SETS], ["off", "typewriter", "arcade"]);
  for (const s of SOUND_SETS) assert.equal(isValidSetting("sound", s), true);
  for (const bad of ["Off", "loud", "", null, 0, undefined])
    assert.equal(isValidSetting("sound", bad), false);
});

test("each setting rejects values of the wrong kind", () => {
  for (const bad of [1, 0, "true", null, undefined, {}, []]) {
    for (const k of ["ai", "fingerColors", "privacySeen"])
      assert.equal(isValidSetting(k, bad), false, `${k} ${bad}`);
  }
  for (const bad of ["1", null, undefined, Number.NaN, Number.POSITIVE_INFINITY, {}, [1], true]) {
    assert.equal(isValidSetting("speed", bad), false, String(bad));
  }
  assert.equal(isValidSetting("volume", 1), false);
  assert.equal(isValidSetting("__proto__", {}), false);
  assert.equal(isValidSetting("constructor", {}), false);
});

test("nothing saved, or junk, gives the defaults", () => {
  for (const raw of [undefined, null, 5, "x", true, [], [1, 2], () => 1]) {
    assert.deepEqual(normalizeSettings(raw), DEFAULTS, String(raw));
  }
  assert.deepEqual(normalizeSettings({}), DEFAULTS);
});

test("a partial save keeps what is good and fills the rest (the fixture has ai and sound only)", () => {
  const got = normalizeSettings(basic().settings);
  assert.deepEqual(got, { ...DEFAULTS, ai: false, sound: "off" });
  assert.deepEqual(normalizeSettings({ sound: "arcade", speed: 1.5 }), {
    ...DEFAULTS,
    sound: "arcade",
    speed: 1.5,
  });
});

test("each field is judged alone: one bad field does not cost the good ones", () => {
  const got = normalizeSettings({
    ai: true,
    sound: "loud",
    speed: 9,
    fingerColors: false,
    privacySeen: "yes",
  });
  assert.deepEqual(got, {
    ai: true,
    sound: "off",
    speed: 0.7,
    fingerColors: false,
    privacySeen: false,
  });
});

test("fields this build does not know are dropped", () => {
  const got = normalizeSettings({ ai: true, volume: 11, theme: "light" });
  assert.deepEqual(Object.keys(got).sort(), [...KEYS].sort());
  assert.equal("volume" in got, false);
});

test("__proto__, constructor and inherited properties can never supply a value", () => {
  const evil = JSON.parse(
    '{"__proto__": {"ai": true, "sound": "arcade"}, "constructor": {"speed": 2}}',
  );
  assert.deepEqual(normalizeSettings(evil), DEFAULTS);
  const inherited = Object.create({ ai: true, sound: "arcade" });
  assert.deepEqual(normalizeSettings(inherited), DEFAULTS);
  assert.equal({}.ai, undefined); // no pollution
  const sneaky = {};
  own(sneaky, "__proto__", { ai: true });
  assert.equal(normalizeSettings(sneaky).ai, false);
});

test("it always returns a new object, and never changes its input", () => {
  const input = Object.freeze({
    ai: true,
    sound: "typewriter",
    speed: 2,
    fingerColors: false,
    privacySeen: true,
  });
  const out = normalizeSettings(input);
  assert.notEqual(out, input);
  assert.deepEqual(out, input);
  out.ai = false;
  assert.equal(input.ai, true);
  assert.notEqual(normalizeSettings({}), normalizeSettings({}));
});

test("random input: always complete, always valid, never throws", () => {
  fc.assert(
    fc.property(fc.anything(), (raw) => {
      const got = normalizeSettings(raw);
      assert.deepEqual(Object.keys(got).sort(), [...KEYS].sort());
      for (const k of KEYS) assert.equal(isValidSetting(k, got[k]), true, k);
    }),
  );
  fc.assert(
    fc.property(fc.jsonValue(), (raw) => {
      for (const k of KEYS) assert.equal(isValidSetting(k, normalizeSettings(raw)[k]), true, k);
    }),
  );
});

test("normalizing is idempotent: a valid settings object comes back equal", () => {
  fc.assert(
    fc.property(fc.anything(), (raw) => {
      const once = normalizeSettings(raw);
      assert.deepEqual(normalizeSettings(once), once);
    }),
  );
});

test("settings pass the Progress contract and the vet checks", () => {
  for (const settings of [DEFAULTS, normalizeSettings({ ai: true, sound: "arcade", speed: 0.5 })]) {
    const p = { ...basic(), settings: { ...settings } };
    assert.equal(validate("Progress", p).status, "valid");
    assert.deepEqual(vet(p), []);
  }
});

test("withSetting changes one field and returns a new object", () => {
  const before = Object.freeze({ ...DEFAULTS });
  const after = withSetting(before, "sound", "arcade");
  assert.deepEqual(after, { ...DEFAULTS, sound: "arcade" });
  assert.notEqual(after, before);
  assert.deepEqual(withSetting(DEFAULTS, "speed", SPEED_MAX).speed, SPEED_MAX);
  assert.equal(withSetting({}, "ai", true).ai, true); // starts from a checked copy
});

test("withSetting refuses an unknown setting or a value that is not allowed", () => {
  assert.throws(() => withSetting(DEFAULTS, "volume", 3), TypeError);
  assert.throws(() => withSetting(DEFAULTS, "__proto__", {}), TypeError);
  assert.throws(() => withSetting(DEFAULTS, "constructor", {}), TypeError);
  assert.throws(() => withSetting(DEFAULTS, "sound", "loud"), RangeError);
  assert.throws(() => withSetting(DEFAULTS, "speed", SPEED_MAX + 1), RangeError);
  assert.throws(() => withSetting(DEFAULTS, "ai", "yes"), RangeError);
});
