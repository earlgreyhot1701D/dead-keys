// Req 2: heat map bands.
import assert from "node:assert/strict";
import { test } from "node:test";
import * as fc from "fast-check";
import { bandFor, heatmap } from "./heatmap.js";
import { BANDS, MIN_KEY_ATTEMPTS } from "./progressConfig.js";

const rank = (name) => BANDS.findIndex((b) => b.name === name); // 0 = worst
const stat = (attempts, misses) => ({ key: "f", attempts, misses });
const enough = fc.integer({ min: MIN_KEY_ATTEMPTS, max: 500 });

test("under 10 attempts is always no data, whatever the misses", () => {
  fc.assert(
    fc.property(fc.integer({ min: 0, max: MIN_KEY_ATTEMPTS - 1 }), fc.nat(), (a, m) => {
      assert.equal(bandFor(stat(a, m % (a + 1))), "noData");
    }),
  );
});

test("10 attempts is the first count that gets a band", () => {
  assert.equal(bandFor(stat(10, 0)), "steady");
  assert.equal(bandFor(stat(9, 9)), "noData");
});

test("more misses at the same attempts never lands in a better band", () => {
  fc.assert(
    fc.property(enough, fc.nat(), fc.nat(), (a, x, y) => {
      const lo = Math.min(x % (a + 1), y % (a + 1));
      const hi = Math.max(x % (a + 1), y % (a + 1));
      assert.ok(rank(bandFor(stat(a, hi))) <= rank(bandFor(stat(a, lo))));
    }),
  );
});

test("a higher miss rate never lands in a better band, whatever the attempts", () => {
  fc.assert(
    fc.property(enough, fc.nat(), enough, fc.nat(), (a1, m1, a2, m2) => {
      const [x, y] = [m1 % (a1 + 1), m2 % (a2 + 1)];
      if (x / a1 >= y / a2) assert.ok(rank(bandFor(stat(a1, x))) <= rank(bandFor(stat(a2, y))));
    }),
  );
});

test("the cutoffs: 15% missed, 8% shaky, 3% uneven, under 3% steady", () => {
  assert.equal(bandFor(stat(20, 3)), "missed"); // exactly 15%
  assert.equal(bandFor(stat(100, 14)), "shaky"); // 14%
  assert.equal(bandFor(stat(25, 2)), "shaky"); // exactly 8%
  assert.equal(bandFor(stat(100, 7)), "uneven");
  assert.equal(bandFor(stat(100, 3)), "uneven"); // exactly 3%
  assert.equal(bandFor(stat(100, 2)), "steady");
  assert.equal(bandFor(stat(100, 0)), "steady");
  assert.equal(bandFor(stat(100, 100)), "missed");
});

test("every band has its own glyph and a player-facing label", () => {
  assert.equal(new Set(BANDS.map((b) => b.glyph)).size, BANDS.length);
  assert.deepEqual(
    BANDS.map((b) => [b.name, b.glyph, b.label]),
    [
      ["missed", "!", "Focus here"],
      ["shaky", "~", "Practicing"],
      ["uneven", "?", "Almost there"],
      ["steady", "✓", "Steady"],
      ["noData", "·", "Not enough yet"],
    ],
  );
  for (const b of BANDS) assert.ok(b.glyph && b.label);
});

test("heatmap returns one entry per key, in order, with the band's glyph and label", () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({ attempts: fc.nat(300), seed: fc.nat() }), { maxLength: 12 }),
      (list) => {
        const keys = list.map((l, i) => ({
          key: String.fromCharCode(97 + i),
          attempts: l.attempts,
          misses: l.seed % (l.attempts + 1),
        }));
        const frozen = Object.freeze(keys.map((k) => Object.freeze(k)));
        const out = heatmap(frozen);
        assert.deepEqual(
          out.map((o) => o.key),
          keys.map((k) => k.key),
        );
        out.forEach((o, i) => {
          const b = BANDS.find((x) => x.name === o.band);
          assert.equal(o.glyph, b.glyph);
          assert.equal(o.label, b.label);
          assert.equal(o.band, bandFor(keys[i]));
          if (o.band === "noData") assert.equal(o.missRate, null);
          else assert.equal(o.missRate, keys[i].misses / keys[i].attempts);
        });
      },
    ),
  );
});

test("an empty list gives an empty map", () => {
  assert.deepEqual(heatmap([]), []);
});

test("bad counts are a programmer error", () => {
  for (const bad of [
    stat(5, 6),
    stat(-1, 0),
    stat(1.5, 0),
    stat(5, -1),
    stat(5, Number.NaN),
    null,
  ]) {
    assert.throws(() => bandFor(bad), RangeError);
    assert.throws(() => heatmap([bad]), RangeError);
  }
});
