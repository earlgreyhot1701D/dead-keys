# Sound sets: design (Block 14)

## Files

| File | Job |
| --- | --- |
| `src/sound/cues.js` | Pure: each set's cue for each moment, and Settings' samples |
| `src/sound/synth.js` | The Web Audio recipes, one shared synth made on first use, `playCues` |
| `src/ui/screens/round.js` | After each step: the cues for its events (and the key, if one was typed) |
| `src/ui/screens/settings.js` | The hint, and the sample on change |

## Decisions

1. Moments come from the engine's own events (`cleared`, `lifeLost`, `waveUp`) plus "a key was typed", so sound never needs its own game logic.
2. The audio context is made on the first sound, which always follows a key press or click, as browsers require.
3. The mock's "SOUND: OFF" footer label is not added: the play footer is at its line cap and fit, and Settings is where the choice lives.
4. Built by Claude to save Kiro credits; Kiro commits and deploys.

## Copy table (binding)

| Where | Words |
| --- | --- |
| Settings hint | Off by default. Typewriter: a clack per key, a bell each wave. Arcade: a laser per word, a chime each wave. You hear a sample when you pick one. |
