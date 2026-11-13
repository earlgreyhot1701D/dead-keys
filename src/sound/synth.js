// Job: make each cue's sound with the Web Audio API (PRD: synthesized, so no audio files to
// license). The audio context is made on the first sound, which always follows a key press or
// click, as browsers require. Quiet by design; any failure is silent, never an error.

const VOLUME = 0.12;

/** One tone: a wave from `from` Hz to `to` Hz over `ms`, fading out. */
function tone(ac, out, { type = "sine", from, to = from, ms, at = 0, gain = 1 }) {
  const t = ac.currentTime + at / 1000;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + ms / 1000);
  g.gain.setValueAtTime(VOLUME * gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.02);
}

/** A short burst of noise: the body of a key strike or a carriage. */
function noise(ac, out, { ms, at = 0, gain = 1 }) {
  const t = ac.currentTime + at / 1000;
  const len = Math.max(1, Math.round((ac.sampleRate * ms) / 1000));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = ac.createBufferSource();
  const g = ac.createGain();
  src.buffer = buf;
  g.gain.setValueAtTime(VOLUME * gain, t);
  src.connect(g).connect(out);
  src.start(t);
}

/** Every cue's recipe. */
export const RECIPES = Object.freeze({
  clack: (ac, o) => {
    noise(ac, o, { ms: 30, gain: 0.8 });
    tone(ac, o, { type: "square", from: 180, to: 90, ms: 25, gain: 0.25 });
  },
  carriage: (ac, o) => {
    noise(ac, o, { ms: 160, gain: 0.5 });
    tone(ac, o, { from: 1800, ms: 260, at: 150, gain: 0.5 });
  },
  bell: (ac, o) => tone(ac, o, { from: 2093, ms: 700, gain: 0.7 }),
  thunk: (ac, o) => tone(ac, o, { from: 120, to: 60, ms: 160 }),
  laser: (ac, o) => tone(ac, o, { type: "square", from: 1400, to: 220, ms: 140, gain: 0.35 }),
  thud: (ac, o) => tone(ac, o, { type: "triangle", from: 90, to: 45, ms: 220 }),
  chime: (ac, o) => {
    tone(ac, o, { from: 784, ms: 260, gain: 0.6 });
    tone(ac, o, { from: 1047, ms: 320, at: 110, gain: 0.6 });
    tone(ac, o, { from: 1568, ms: 420, at: 220, gain: 0.5 });
  },
});

/**
 * A player for cues. `makeContext` gives the audio context (a test passes a fake).
 * @returns {{ play: (cue: string) => boolean }}
 */
export function createSynth(
  makeContext = () => new (globalThis.AudioContext ?? globalThis.webkitAudioContext)(),
) {
  let ac = null;
  return {
    play(cue) {
      const recipe = RECIPES[cue];
      if (!recipe) return false;
      try {
        ac ??= makeContext();
        if (ac.state === "suspended") ac.resume?.();
        recipe(ac, ac.destination);
        return true;
      } catch {
        return false; // no Web Audio here: the game is silent, never broken
      }
    },
  };
}

/** The game's one synth, made on first use. */
let shared = null;
export const synth = () => (shared ??= createSynth());

/** Play one round step's cues in the player's sound set (round.js calls this after each step). */
export function playCues(cues) {
  for (const cue of cues) synth().play(cue);
}
