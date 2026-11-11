# Requirements: Block 2, engine core

**Spec:** `engine` (PRD G5, backlog item 2: match, score, rng, round). **Rigor:** Full. These functions produce every number a player sees.
**Status:** Approved by Shara Nov 11 (lives raised to 5, one free continue added).
**Sources:** `docs/prd.md` G2 (pause, speed slider, two mechanics), G5 (rules), G4 (shapes), G10 (live region events). `docs/design-brief.md` (lock treatment, open moments). Contract: `contract/schemas/roundResult.json`, `keystroke.json`, `item.json`.

## Introduction

One engine runs both mechanics. It knows targets, a lock, keystrokes, time and score. It knows nothing about pixels, the DOM, storage or the network. The renderers (Block 7) draw what the engine says. The engine also announces what happened (cleared, miss, life lost, wave up) so the screen, sound and live region can react without reading engine internals.

## Scope

**In:** `src/engine/config.js`, `rng.js`, `score.js`, `match.js`, `targets.js`, `round.js`, `lifecycle.js`, `result.js`. Tightening `RoundResult.keyDeltas` in the contract. Property-based tests for every rule below.
**Out:** heat map, diagnosis, milestones (Block 3). Storage (Block 4). Any rendering, sound or DOM (Blocks 6, 7, 14). Weighted sampling and daily seed (Blocks 9, 12; they reuse `rng.js`). Lessons and test out (Block 8).

## Glossary

- **Target:** one item on screen, with its text and how far it has traveled toward danger (0 = just spawned, 1 = reached the danger line).
- **Lock:** the one target the player is typing. At most one at a time.
- **Event:** a plain object the engine returns to say what happened: `cleared`, `miss`, `lifeLost`, `waveUp`, `locked`, `unlocked`, `paused`, `resumed`, `outOfLives`, `continued`, `ended`.

---

## Requirement 1: Seeded random numbers

1. THE SYSTEM SHALL provide mulberry32 in `src/engine/rng.js`.
2. WHEN two generators get the same seed, THE SYSTEM SHALL return the same sequence.
3. Every returned number SHALL be at least 0 and less than 1.
4. THE engine SHALL never call `Math.random`.

## Requirement 2: Lock and match

1. WHEN nothing is locked and the player types a character, THE SYSTEM SHALL lock the target nearest to danger whose next character is that character.
2. IF two targets tie on distance, THE SYSTEM SHALL lock the one that spawned first.
3. WHEN a target is locked and the typed character matches its next character, THE SYSTEM SHALL advance the target by one character.
4. WHEN a target is locked and the typed character does not match, THE SYSTEM SHALL count a miss against the expected character and SHALL keep the lock.
5. WHEN the last character of the locked target is typed, THE SYSTEM SHALL clear the target, release the lock and emit `cleared`.
6. Case and punctuation SHALL always count: `A` does not match `a`.
7. Backspace SHALL not be a keystroke and SHALL not change any count.

## Requirement 3: Escape is layered

1. WHEN Escape is pressed and a target is locked, THE SYSTEM SHALL drop the lock, emit `unlocked` and leave the target's typed progress at zero.
2. WHEN Escape is pressed and nothing is locked, THE SYSTEM SHALL pause and emit `paused`.
3. WHILE paused, THE SYSTEM SHALL not move targets, advance the clock or accept keystrokes.
4. WHEN resumed, THE SYSTEM SHALL continue from the same state and emit `resumed`. Paused time SHALL not count toward `durationMs`.

## Requirement 4: Score

1. WPM SHALL be (correct characters ÷ 5) ÷ minutes, with minutes from `durationMs`.
2. Accuracy SHALL be correct keystrokes ÷ total keystrokes.
3. IF `durationMs` is 0, WPM SHALL be 0. IF there are no keystrokes, accuracy SHALL be 0. (Neither may be NaN or Infinity.)
4. WPM SHALL never be negative. Accuracy SHALL always be between 0 and 1.
5. THE score functions SHALL be pure: same inputs, same outputs, no side effects.

## Requirement 5: Round lifecycle

1. THE SYSTEM SHALL create a round from a mode, a pack's items, a seed, a speed setting and a mechanic, all passed in. (Start time dropped Nov 11: keystroke time is the round's active time, design decision 9.)
2. THE SYSTEM SHALL advance the round only when given elapsed milliseconds. It SHALL not read a clock itself.
3. WHEN a target reaches the danger line, THE SYSTEM SHALL remove it, take one life and emit `lifeLost`. IF it was locked, the lock SHALL be released.
4. WHEN lives reach 0 and the round's free continue is unused, THE SYSTEM SHALL hold the round (no movement, no keystrokes) and emit `outOfLives`.
5. WHEN the player continues, THE SYSTEM SHALL refill lives to the maximum, keep score, wave and cleared count, mark the continue as used, release any lock, clear the screen and respawn fresh targets (so none is already near danger), and emit `continued`. WHEN the player declines, THE SYSTEM SHALL end the round and emit `ended`.
6. WHEN lives reach 0 and the continue is already used, THE SYSTEM SHALL end the round and emit `ended`.
7. WHEN the number of targets cleared in this wave reaches the wave size, THE SYSTEM SHALL start the next wave, give back one life up to the maximum, and emit `waveUp`.
8. WHERE the mode is `practice`, THE SYSTEM SHALL not move targets toward danger and SHALL not take lives. The round ends when the player ends it.
9. THE speed setting SHALL scale how fast targets travel, in every mode that moves.
10. WHEN a round ends, THE SYSTEM SHALL return a `RoundResult` that passes the contract check.
11. Given the same inputs and the same keystrokes at the same times, a round SHALL produce the same `RoundResult`. (This is what makes ghost races possible later.)

## Requirement 6: Key deltas in the contract

1. THE `RoundResult.keyDeltas` schema SHALL change from a loose object to: one entry per key, each with `attempts` and `misses` as whole numbers ≥ 0, misses ≤ attempts.
2. An attempt SHALL be one keystroke where that key was expected. A miss SHALL be one of those keystrokes that did not match.
3. THE `RoundResult` schema SHALL gain a required `continued` field (true or false), so a result never hides that the free continue was used.
4. THE normal and ugly fixtures that hold a RoundResult SHALL be updated to the new shape, and the fixture checker SHALL pass.

## Requirement 7: Tests

1. Every requirement above SHALL have a property-based test (fast-check) or a named example test.
2. The property tests SHALL cover at least: accuracy outside 0 to 1, negative WPM, NaN, the RNG not repeating for a seed, a lock on a target that doesn't start with the typed character, and a finished round failing the contract.
3. `npm test` and `npm run lint` SHALL pass.

---

## Confirmed numbers

The PRD names lives, waves and a speed slider but no numbers. These live as named constants in one file so tuning never touches the rules.

| Setting | Proposal |
|---|---|
| Lives | 5, one back each wave up to 5 (confirmed) |
| Free continue | 1 per round: lives refill, score and wave kept (confirmed) |
| Wave size | 10 targets cleared |
| Speed up per wave | travel 10% faster each wave |
| Speed slider | 0.5× to 2×, default 1× |
| Targets on screen | starts at 3, one more each wave, up to 8 (falling), 4 (corners) |
| Miss with nothing locked | counts as a keystroke (accuracy drops), no key delta, since no key was expected |
