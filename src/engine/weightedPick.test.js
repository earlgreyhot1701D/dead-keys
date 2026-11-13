// Weighted spawning (drills Req 2): without weights, spawning is exactly as before Block 9 (the
// sequences below were recorded from the engine at 4cbc383, before weights existed); with weights,
// picks still come from the first-letter-free pool, by weight, with the same one random number.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import * as fc from "fast-check";
import { createRound } from "./round.js";
import { spawn } from "./targets.js";
import { pickFrom, withWeights } from "./weightedPick.js";

const pack = JSON.parse(readFileSync(new URL("../../packs/general.json", import.meta.url), "utf8"));
const ITEMS = Object.values(pack.pools).flat();

/** Spawn 40 more words, keeping at most two on screen, and list each as text@slot. */
function sequence(o) {
  let s = createRound({ speed: 1, items: ITEMS, ...o }).state;
  const seq = s.targets.map((t) => `${t.text}@${t.slot}`);
  for (let i = 0; i < 40; i++) {
    const kept = s.targets.length >= 2 ? s.targets.slice(1) : s.targets;
    s = spawn({ ...s, warmup: 0, targets: kept, spawnWaitMs: 0 }).state;
    const t = s.targets.at(-1);
    seq.push(`${t.text}@${t.slot}`);
  }
  return seq;
}

const RECORDED = {
  "falling-1":
    "firm@0 hundred@5 garden@1 husband@4 step@5 oil@2 become@3 evidence@0 numbers@1 security@4 read@0 should@3 examples@4 living@1 purposes@3 agreed@0 carry@3 path@5 similar@3 period@1 army@2 whether@4 division@0 method@1 exercise@5 matter@4 apply@2 paper@4 chosen@5 believed@4 nuclear@5 left@0 advanced@2 perfect@3 ideal@4 known@3 writer@0 evil@1 product@0 sea@2 proper@3",
  "corners-42":
    "acid@1 pages@3 side@1 effects@2 crisis@1 specific@3 director@0 support@2 moving@1 with@2 finding@0 measures@1 values@0 head@3 useful@0 interest@3 peace@2 today@1 did@0 contact@2 market@1 health@0 van@3 supply@0 probably@1 does@2 moving@3 coast@0 limits@2 column@0 data@1 shows@2 acid@3 know@2 sold@0 goes@1 distance@3 per@2 output@3 status@1 hard@2",
  "practice-20261112":
    "campaign@2 recently@4 analysis@0 cash@5 aspects@1 path@4 hope@5 parents@0 about@2 heart@3 describe@0 received@4 sort@0 too@1 your@4 poor@0 more@4 indeed@0 middle@5 one@3 code@0 all@1 long@3 remember@5 portion@0 used@4 goals@5 point@4 just@1 unless@3 will@1 been@5 today@2 persons@4 much@2 instead@1 officer@5 within@1 fair@5 provides@3 located@5",
};

test("regression: without weights, every mode spawns exactly the recorded pre-Block 9 sequence", () => {
  for (const [mode, mechanic, seed] of [
    ["falling", "falling", 1],
    ["corners", "corners", 42],
    ["practice", "falling", 20261112],
  ]) {
    assert.equal(sequence({ mode, mechanic, seed }).join(" "), RECORDED[`${mode}-${seed}`]);
  }
});

test("without weights the round's items are plain copies (no weight field)", () => {
  const s = createRound({ mode: "falling", mechanic: "falling", items: ITEMS, seed: 3, speed: 1 });
  assert.ok(s.state.items.every((i) => !Object.hasOwn(i, "weight")));
  assert.notEqual(s.state.items[0], ITEMS[0]);
});

test("weights must match the items: one each, finite and above 0", () => {
  const items = [
    { id: "a", text: "ab" },
    { id: "b", text: "bc" },
  ];
  const o = { mode: "practice", mechanic: "falling", items, seed: 1, speed: 1 };
  assert.throws(() => createRound({ ...o, weights: [1] }), TypeError);
  assert.throws(() => createRound({ ...o, weights: "1,2" }), TypeError);
  for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => createRound({ ...o, weights: [1, bad] }), RangeError);
  }
  const w = [1, 2];
  const s = createRound({ ...o, weights: w }).state;
  assert.deepEqual(
    s.items.map((i) => i.weight),
    [1, 2],
  );
  w[0] = 99; // the caller can't change a running round
  assert.equal(s.items[0].weight, 1);
});

test("pickFrom: uniform without weights, the running-sum walk with them", () => {
  const plain = [{ t: "a" }, { t: "b" }, { t: "c" }, { t: "d" }];
  assert.equal(pickFrom(plain, 0.5).t, "c");
  const heavy = withWeights(
    [
      { id: "1", text: "a" },
      { id: "2", text: "b" },
    ],
    [1, 3],
  );
  assert.equal(pickFrom(heavy, 0.2).id, "1"); // 0.2 x 4 = 0.8, inside the first weight
  assert.equal(pickFrom(heavy, 0.3).id, "2");
  assert.equal(pickFrom(heavy, 0.999999999).id, "2");
});

const smallItems = fc.uniqueArray(fc.constantFrom(..."abcdefghijklmnop"), {
  minLength: 2,
  maxLength: 16,
});
const weighted = smallItems.chain((letters) =>
  fc.tuple(
    fc.constant(letters.map((l, i) => ({ id: `i${i}`, text: `${l}x` }))),
    fc.array(fc.double({ min: 0.01, max: 50, noNaN: true }), {
      minLength: letters.length,
      maxLength: letters.length,
    }),
    fc.integer(),
  ),
);

test("property: with weights, picks come from the pool and keep one word per first letter", () => {
  fc.assert(
    fc.property(weighted, ([items, weights, seed]) => {
      let s = createRound({ mode: "falling", mechanic: "falling", items, weights, seed, speed: 1 });
      s = s.state;
      for (let i = 0; i < 20; i++) {
        s = spawn({ ...s, warmup: 0, spawnWaitMs: 0, targets: s.targets.slice(-2) }).state;
        const firsts = s.targets.map((t) => t.text[0]);
        if (new Set(firsts).size !== firsts.length) return false;
        if (!s.targets.every((t) => items.some((it) => it.id === t.itemId))) return false;
      }
      return true;
    }),
  );
});

test("property: the same seed and weights give the same sequence", () => {
  fc.assert(
    fc.property(weighted, ([items, weights, seed]) => {
      const o = { mode: "practice", mechanic: "falling", items, weights, seed };
      const run = () => {
        let s = createRound({ ...o, speed: 1 }).state;
        const ids = [];
        for (let i = 0; i < 10; i++) {
          s = spawn({ ...s, spawnWaitMs: 0, targets: [] }).state;
          ids.push(s.targets[0].itemId);
        }
        return ids.join();
      };
      const first = run();
      return first === run();
    }),
  );
});

test("over 2,000 seeded picks, an item with 10x the weight is picked at least 5x as often", () => {
  const items = "abcdefghij".split("").map((l, i) => ({ id: l, text: `${l}y`, n: i }));
  const weights = items.map((it) => (it.id === "a" ? 10 : 1));
  let s = createRound({ mode: "practice", mechanic: "falling", items, weights, seed: 7, speed: 1 });
  s = s.state;
  const count = new Map();
  for (let i = 0; i < 2000; i++) {
    s = spawn({ ...s, spawnWaitMs: 0, targets: [] }).state;
    const id = s.targets[0].itemId;
    count.set(id, (count.get(id) ?? 0) + 1);
  }
  const others = items.filter((it) => it.id !== "a").map((it) => count.get(it.id) ?? 0);
  const most = Math.max(...others);
  assert.ok(count.get("a") >= 5 * most, `a: ${count.get("a")}, the most of the rest: ${most}`);
});
