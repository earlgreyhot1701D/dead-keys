// Sound sets (sound Req 1): which cue plays when in each set, Off silent, and the synth playing
// every cue on a fake audio context without throwing, and staying silent where Web Audio is gone.
import assert from "node:assert/strict";
import { test } from "node:test";
import { CUES, cuesFor, SAMPLE } from "./cues.js";
import { createSynth, RECIPES } from "./synth.js";

const ev = (...types) => types.map((type) => ({ type }));

test("Off is silent, whatever happens", () => {
  assert.deepEqual(cuesFor("off", ev("cleared", "waveUp", "lifeLost"), true), []);
  assert.deepEqual(cuesFor(undefined, ev("cleared"), true), []);
});

test("Typewriter: a clack per key, a carriage return per word, a bell per wave, a thunk per hit", () => {
  assert.deepEqual(cuesFor("typewriter", [], true), ["clack"]);
  assert.deepEqual(cuesFor("typewriter", ev("cleared", "waveUp"), true), [
    "clack",
    "carriage",
    "bell",
  ]);
  assert.deepEqual(cuesFor("typewriter", ev("lifeLost", "miss")), ["thunk"]);
});

test("Arcade: a laser per word, a thud per hit, a chime per wave; no sound per key", () => {
  assert.deepEqual(cuesFor("arcade", [], true), []);
  assert.deepEqual(cuesFor("arcade", ev("cleared", "lifeLost", "waveUp")), [
    "laser",
    "thud",
    "chime",
  ]);
});

test("every cue a set names has a recipe, and so does each sample", () => {
  for (const set of Object.values(CUES))
    for (const cue of Object.values(set)) assert.ok(RECIPES[cue], cue);
  for (const cue of Object.values(SAMPLE)) assert.ok(RECIPES[cue], cue);
});

/** A fake AudioContext that counts what each cue builds. */
function fakeAc() {
  const made = { osc: 0, noise: 0, started: 0 };
  const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
  const node = () => ({ connect: (n) => n ?? node(), start: () => made.started++, stop() {} });
  return {
    made,
    currentTime: 0,
    sampleRate: 8000,
    state: "running",
    destination: {},
    createOscillator: () => {
      made.osc++;
      return { ...node(), type: "", frequency: param };
    },
    createGain: () => ({ ...node(), gain: param }),
    createBuffer: (_c, len) => ({ getChannelData: () => new Float32Array(len) }),
    createBufferSource: () => {
      made.noise++;
      return { ...node(), buffer: null };
    },
  };
}

test("the synth plays every cue on Web Audio and makes the context only once", () => {
  let contexts = 0;
  const ac = fakeAc();
  const s = createSynth(() => {
    contexts++;
    return ac;
  });
  for (const cue of Object.keys(RECIPES)) assert.equal(s.play(cue), true, cue);
  assert.equal(contexts, 1);
  assert.ok(ac.made.osc > 0 && ac.made.noise > 0 && ac.made.started > 0);
  assert.equal(s.play("nope"), false);
});

test("no Web Audio: silent, never an error", () => {
  const s = createSynth(() => {
    throw new Error("no audio");
  });
  assert.equal(s.play("bell"), false);
});
