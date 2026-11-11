# Design: Block 2, engine core

**Spec:** `engine`. **Requirements:** `requirements.md` (approved Nov 11). **Rigor:** Full.
**Status:** Approved by Shara Nov 11.

## Shape of the engine

Every engine function is pure. It takes the round state plus an input and returns `{ state, events }`. It never changes the state it was given, never reads a clock, never calls `Math.random`, and never touches the DOM, storage or network. The caller (Block 7) owns the clock and the screen.

```
caller (later: renderer)            engine
  createRound(opts)          ->     { state, events }
  key(state, char)           ->     { state, events }
  pressEscape(state)         ->     { state, events }
  resume(state)              ->     { state, events }   (the pause dialog button)
  tick(state, dtMs)          ->     { state, events }
  resolveOutOfLives(state, continue?) -> { state, events }
  endRound(state)            ->     { state, events }   (practice, or player quits)
  toResult(state, meta)      ->     RoundResult
```

## Files

| File | Job (one line, goes at the top of the file) | Exports |
|---|---|---|
| `src/engine/config.js` | Every tunable number, named, in one place | `LIVES_MAX`, `WAVE_SIZE`, `WAVE_SPEEDUP`, `SPEED_MIN`, `SPEED_MAX`, `TARGETS_START`, `TARGETS_MAX`, `BASE_TRAVEL_MS`, `SLOTS` |
| `src/engine/rng.js` | Seeded random numbers (mulberry32) | `createRng(seed)` returning `{ next, state }` as plain data so a round can be copied |
| `src/engine/score.js` | WPM and accuracy | `wpm(correctChars, durationMs)`, `accuracy(correct, total)` |
| `src/engine/match.js` | Lock choice and one keystroke against a target | `pickLock(targets, char)`, `applyKey(target, char)` |
| `src/engine/targets.js` | Spawn targets and move them toward danger | `spawn(state)`, `advance(state, dtMs)` |
| `src/engine/round.js` | Create a round, take keys, handle Escape | `createRound`, `key`, `pressEscape` (and `fill`, shared with `lifecycle.js`) |
| `src/engine/lifecycle.js` | Time, lives, continue, resume, end | `tick`, `resolveOutOfLives`, `endRound`, `resume` |
| `src/engine/result.js` | Turn a finished round into a RoundResult | `toResult(state, meta)` |
| `src/engine/*.test.js` | One test file per engine file | |

`round.js` uses the others. Nothing outside `src/engine/` is imported except `contract/validate.js`, and only by tests.

## Data

- **Target:** `{ id, itemId, text, typed, progress, slot }`. `id` counts up from 0 in spawn order (this breaks lock ties, Req 2.2). `typed` is how many characters are done. `progress` runs 0 to 1. `slot` is a lane (falling) or corner (corners), chosen by the RNG; the renderer maps it to pixels.
- **Round state:** mode, items, rng state, speed, lives, wave, clearedThisWave, cleared, targets, lockId, paused, held (out of lives), continueUsed, ended, activeMs, keystrokes (log), strayKeys, keyDeltas.
- **Event:** `{ type, ... }`, for example `{ type: "cleared", targetId }`, `{ type: "miss", expected, typed }`, `{ type: "waveUp", wave }`.

## Decisions

1. **Travel speed.** A target takes `BASE_TRAVEL_MS / (speed × WAVE_SPEEDUP^(wave-1))` to reach danger. `BASE_TRAVEL_MS` starts at 8,000 and is tuned in Block 7 when it can be seen.
2. **Spawning.** Whenever fewer targets are on screen than the wave allows, one spawns. Its item is picked uniformly with the RNG. (Weighted sampling replaces this in Block 9, same seam.)
3. **Wrong key with nothing locked** (stray key). Counts in `totalKeystrokes`, so accuracy drops. Not in `keyDeltas`, since no key was expected. Not in the keystroke log, because `Keystroke.expected` must be one character. Counted in `strayKeys` so the number is still true. Known limit: a ghost replay won't show stray keys.
4. **Correct characters** = keystrokes that matched. Used for WPM.
5. **Escape on a lock** resets that target's typed count to 0 (Req 3.1).
6. **Bad input** (a string that isn't one character, a key while paused, held or ended) is ignored with no event. Engine functions throw only on programmer errors, such as `createRound` with no items.
7. **RoundResult `id` and `date`** come from the caller in `meta`, so the engine stays deterministic. So do `packId`, `lessonId` and `drillSource`, which the engine does not know.
8. **Contract change, no version bump.** `keyDeltas` becomes `{ [key]: { attempts, misses } }` and `continued` (boolean) is added. `misses ≤ attempts` goes in `rules.js`. `schemaVersion` stays 1 because nothing has shipped and no player has a save yet.

9. **Keystroke time** (decided Nov 11). `Keystroke.t` is `activeMs` at the moment of the key, so paused time is never in it. `key` takes no time argument and `createRound` takes no start time. Resolution is one tick: two keys between ticks get the same `t`.
10. **Resume** (decided Nov 11). Escape while paused resumes. `resume(state)` does the same for the pause dialog button. Both emit `resumed`. `resume` on a round that isn't paused is ignored.
11. **Name** (decided Nov 11). The Escape function is `pressEscape`, not `escape`, because Biome rejects a declaration that shadows the old global.
12. **File split** (decided Nov 11). `round.js` reached the line cap after part 1, so `tick`, `resolveOutOfLives`, `endRound` and `resume` live in `lifecycle.js`, and `toResult` in `result.js`.
13. **Practice in the result** (decided Nov 11). Internally practice stays in wave 1; `toResult` reports `wave` 0 for it and `cleared` as counted.

## Tests

| Test | Kind | Catches |
|---|---|---|
| RNG repeats for a seed, stays in [0, 1) | property | Non-determinism, out-of-range numbers |
| WPM ≥ 0, accuracy in [0, 1], never NaN | property | Divide by zero, bad math |
| Lock picks nearest to danger with the right first letter, ties go to the lower id | property | Wrong word locked (the mock bug from the design track) |
| Random keystroke sequences never leave the state invalid and never change the input state | property | Mutation, lost counts |
| Same inputs, same keystrokes at the same times give the same RoundResult | property | Hidden randomness or clock reads |
| Every finished round passes the RoundResult contract | property | Engine and contract drifting apart |
| Escape layering, pause freezes time, out of lives then continue, continue used then ended, wave up gives a life back | examples | The rules Shara decided today |

## Not in this block

Rendering, sound, the live region text, storage, heat map, diagnosis, weighted sampling, the daily seed, lessons.
