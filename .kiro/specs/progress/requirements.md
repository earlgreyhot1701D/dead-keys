# Requirements: Block 3, progress math

**Spec:** `progress` (PRD G5 rows Miss rate, Heat bands, Diagnosis, Milestones; backlog item 3). **Rigor:** Full. These produce the heat map, the sentences about the player's typing and the milestone cards.
**Status:** Approved by Shara Nov 11 (numbers confirmed; player-facing band labels added).
**Sources:** `docs/prd.md` G5, G7 (lesson keys and rows), G2 (milestones, never punish the dip), G11 (heat band tokens). `docs/design-brief.md` (band glyphs and patterns). Contract: `keyStat.json`, `diagnosis.json`, `milestone.json`, `progress.json`, `roundResult.json`.

## Introduction

Block 2 scores one round. This block turns many rounds into what the player sees about themselves: which keys are shaky, up to three plain sentences about where their typing struggles, and milestones worth celebrating. All of it is pure functions over saved data, so the "How we count" page can state the exact rules.

## Scope

**In:** `src/engine/keystats.js` (merge a round into per-key stats), `heatmap.js` (bands), `diagnose.js` (groups, sentences, weak keys), `milestones.js` (bests and milestones), `progressConfig.js` (thresholds and key groups). Tightening `Diagnosis.severity`, `Milestone.kind` and `Progress.bests` in the contract. Property tests.
**Out:** drawing the heat map or cards (Blocks 6, 11), the dip notice and lesson recommendation (Block 8), storage (Block 4), weighted drill sampling (Block 9).

## Glossary

- **Miss rate:** misses ÷ attempts for one key, or for a group of keys added together.
- **Band:** one of missed, shaky, uneven, steady, or no data.
- **Group:** a named set of keys: top row, home row, bottom row, left hand, right hand, shift, digits, symbols.

---

## Requirement 1: Per-key stats

1. WHEN a finished RoundResult is merged into the saved key stats, THE SYSTEM SHALL add each key's attempts and misses from `keyDeltas` and set `lastSeen` to the round's date.
2. Keys not in the round SHALL be unchanged. The input SHALL never be changed.
3. Merging rounds one at a time or in any grouping SHALL give the same totals.

## Requirement 2: Heat map bands

1. IF a key has fewer than 10 attempts, THE SYSTEM SHALL band it "no data".
2. OTHERWISE THE SYSTEM SHALL band it by miss rate using the thresholds below.
3. Every band SHALL have its own glyph so color is never the only signal: missed `!`, shaky `~`, uneven `?`, steady `✓`, no data `·`.
4. Each band SHALL carry a player-facing label that says where the key is heading, not where it failed: missed "Focus here", shaky "Practicing", uneven "Almost there", steady "Steady", no data "Not enough yet". Internal names stay for code and the "How we count" page.
5. A key with more misses SHALL never land in a better band than the same key with fewer misses at the same attempts.

## Requirement 3: Diagnosis

1. THE SYSTEM SHALL compute the player's overall miss rate across all keys.
2. WHEN a group has 20 or more attempts, its miss rate is at least 2× the overall rate, and its miss rate is at least the floor below, THE SYSTEM SHALL flag it.
3. THE SYSTEM SHALL return at most 3 sentences, worst first (highest ratio to overall), each with a severity and the group's keys that are themselves shaky or missed.
4. Sentences SHALL be plain, kind and specific, from fixed templates, for example: "Your top row misses about 1 in 6 keys, twice your usual rate." Never "bad," "slow" or "you got worse."
5. `weakKeys` SHALL be up to 6 keys with 10+ attempts, highest miss rate first, ties broken by more attempts, then by key.
6. `sufficientData` SHALL be true only when total attempts reach the minimum below. When false, sentences SHALL be empty.
7. Same input, same Diagnosis. The output SHALL pass the contract.

## Requirement 4: Personal bests and milestones

1. A personal best SHALL be the highest WPM per mode, counted only from rounds at or above the accuracy floor below, so speed never beats accuracy.
2. WHEN a round sets a new personal best, THE SYSTEM SHALL report it.
3. THE SYSTEM SHALL award each of these once: every 10 WPM band reached (10, 20, 30 ...), 3 rounds in a row at 95%+ accuracy, a 7-day streak of local days with at least one round, and each lesson passed.
4. Practice rounds SHALL count toward streaks and lesson milestones but not toward WPM bands or bests, because practice is untimed by design.
5. THE SYSTEM SHALL never award, label or report anything for getting slower.
6. Milestones already earned SHALL not be awarded again. The output SHALL pass the contract.
7. The day boundary for streaks SHALL be the player's local day, passed in, not read from a clock.

## Requirement 5: Contract

1. `Diagnosis.severity` SHALL become one of: high, medium.
2. `Milestone.kind` SHALL become one of: wpm-band, accuracy-streak, day-streak, lesson-passed.
3. `Progress.bests` SHALL become `{ [mode]: { wpm, date } }`.
4. Fixtures holding these shapes SHALL be updated, with ugly cases for each new limit, and the checker SHALL pass.

## Requirement 6: Tests

1. Every requirement SHALL have a property test or a named example.
2. `npm test`, `npm run lint` and `node scripts/check-fixtures.js` SHALL pass.

---

## Confirmed numbers

| Setting | Proposal |
|---|---|
| Missed band | miss rate 15% or more |
| Shaky band | 8% to under 15% |
| Uneven band | 3% to under 8% |
| Steady band | under 3% |
| Diagnosis floor | a group must miss at least 5% to be flagged (stops "2× of almost nothing") |
| Severity | high at 3× overall or more, medium at 2× |
| Enough data | 100 total attempts (about one minute of calibration) |
| Accuracy floor for personal bests | 90% |
