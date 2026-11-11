# Requirements: Block 1, data contract and fixtures

**Spec:** `contract` (PRD G4). **Rigor:** Full for schemas and the fixture checker, Working for everything else.
**Status:** Approved by Shara Nov 11.
**Sources:** `docs/prd.md` G4 (shapes, ugly cases), G5 (limits that bound data), G8 (drill limits), G9 (`schemaVersion`). `docs/current-block.md` (file allowlist, PASS line).

## Introduction

Both build tracks (engine and UI) work against the same data shapes. This block writes those shapes down once, as JSON schemas, and proves them with two sets of sample data: normal fixtures that must pass and ugly fixtures that pass or fail exactly as they say they will. Nothing else is built against the shapes until this block passes.

## Scope

**In:** the 11 G4 shapes as schemas, JSDoc types, normal fixtures, ugly fixtures, a fixture checker script, hook H3, a `KIRO-NOTES.md` entry.
**Out:** engine math (Block 2 and 3), storage and migration code (Block 4), pack content assembly and word list curation, the pack validator CLI (Block 15), the AI route (Block 10).

## Glossary

- **Shape:** one of the 11 data types in PRD G4.
- **Contract check:** whatever checks a value against a shape. How it is built is decided in `design.md`.
- **Expectation:** what an ugly fixture says its result should be: `valid`, `invalid`, or `needs-migration`.
- **Charset:** the list of characters a pack allows (`Pack.charset`).

---

## Requirement 1: One schema per shape

**User story:** As the builder of either track, I want every shape written down in one place, so the engine and the UI can't drift apart.

1. THE SYSTEM SHALL have one schema file in `contract/schemas/` for each G4 shape: Pack, Item, KeyStat, Keystroke, RoundResult, Progress, GhostRun, Diagnosis, DrillRequest, DrillResponse, Milestone.
2. Each schema SHALL require every field G4 lists for that shape and SHALL reject fields G4 does not list.
3. WHERE G4 does not define a field's inner shape (for example `Progress.settings`, `Progress.bests`), THE schema SHALL use the loosest type that fits and SHALL name the block that will define it.
4. WHERE one shape contains another (Pack contains Item, Progress contains RoundResult), THE schema SHALL reference the other schema file, never copy it.
5. THE SYSTEM SHALL have `contract/types.js` with one JSDoc typedef per shape, each pointing at its schema file.

## Requirement 2: Field limits from the PRD

**User story:** As the builder, I want the PRD's limits enforced at the contract, so bad data is caught before it reaches the engine or the screen.

1. THE contract check SHALL accept `RoundResult.mode` only as one of: corners, falling, practice, lesson, testout, daily, specwave.
2. THE contract check SHALL accept `Item.kind` only as one of: word, sentence, number, mixed, pair.
3. THE contract check SHALL accept `accuracy` only from 0 to 1 inclusive, and `wpm` only at 0 or above.
4. THE contract check SHALL accept counts (`attempts`, `misses`, `correctChars`, `totalKeystrokes`, `durationMs`, `Keystroke.t`) only as whole numbers at 0 or above.
5. IF a KeyStat has more `misses` than `attempts`, THEN THE contract check SHALL reject it.
12. IF a Progress has two KeyStats for the same key, or two GhostRuns for the same mode and pack, THEN THE contract check SHALL reject it. (One ghost per mode and pack keeps saved data small.)
6. THE contract check SHALL reject a Progress with more than 200 rounds, and a GhostRun with more than 2,000 keystrokes.
7. THE contract check SHALL reject a Diagnosis with more than 6 weak keys or more than 3 sentences. Each sentence SHALL have `text`, `severity`, and `keys`.
8. THE contract check SHALL accept each `Progress.lessonsPassed` entry only with how it was passed: `lesson` or `testout`.
9. THE contract check SHALL accept a DrillRequest only with 1 to 6 weak keys (no weak keys means no AI call; the built-in drill runs), each with a rate from 0 to 1, and `recentWpm` from 0 to 250.
10. THE contract check SHALL accept a DrillResponse only with 1 to 8 lines, each 1 to 80 characters, and `source` equal to `ai`.
11. THE contract check SHALL accept `Item.source` only as a non-empty citation or the word `original`.

## Requirement 3: Charset checks

**User story:** As the builder, I want text checked against the pack it belongs to, so nothing outside the pack's keys reaches a player.

1. IF any character in an Item's `text` is not in its pack's charset, THEN THE contract check SHALL reject the pack.
2. IF a DrillRequest names a weak key that is not in the pack's charset, THEN THE contract check SHALL reject the request.
3. IF any character in any DrillResponse line is not in the pack's charset, THEN THE contract check SHALL reject the whole response, not just the line.

## Requirement 4: Schema version

**User story:** As the builder of storage (Block 4), I want old saved progress told apart from broken progress, so old players get migrated instead of wiped.

1. THE contract check SHALL accept `Progress.schemaVersion` only as a whole number of 0 or more. The current version is 1; 0 is the pre-release format, so an old save reads as `needs-migration`, not `invalid`.
2. WHEN a Progress has a `schemaVersion` lower than current, THE contract check SHALL report `needs-migration`, not `invalid`.
3. WHEN a Progress has a `schemaVersion` higher than current, THE contract check SHALL report `invalid` with the reason "newer than this build."

## Requirement 5: Normal fixtures

**User story:** As the UI builder, I want realistic sample data for every shape, so I can build screens before the engine exists.

1. THE SYSTEM SHALL have at least one normal fixture in `fixtures/normal/` for each of the 11 shapes.
2. WHEN the checker runs, every normal fixture SHALL validate.
3. Fixture text SHALL use invented content only: no real names, addresses, or phone numbers (PRD G6).

## Requirement 6: Ugly fixtures

**User story:** As the builder, I want the edge cases written down as data, so every later block is tested against the worst the contract allows.

1. THE SYSTEM SHALL have one ugly fixture in `fixtures/ugly/` for each G4 case:

| # | Case | Expectation |
|---|---|---|
| 1 | Progress with zero rounds | valid |
| 2 | Progress with 200 rounds and a KeyStat for every charset key | valid |
| 3 | KeyStat with 3 attempts | valid |
| 4 | RoundResult at 100% accuracy | valid |
| 5 | RoundResult at 0% accuracy | valid |
| 6 | The longest sentence item | valid |
| 7 | Spanish item with ¿ and ñ, in a pack whose charset includes them | valid |
| 8 | Progress with an older `schemaVersion` | needs-migration |
| 9 | Corrupted JSON | invalid |
| 10 | DrillResponse with an out-of-charset character | invalid |
| 11 | DrillResponse truncated mid-line | invalid |

2. Each ugly fixture SHALL state its expectation and, when `invalid`, the reason it should fail.
3. WHERE a boundary from Requirement 2 has no ugly case above (for example 201 rounds), THE builder MAY add one. Optional.

## Requirement 7: Fixture checker

**User story:** As Shara, I want one command that tells me plainly whether the contract holds, so I can run the PASS check myself.

1. WHEN `scripts/check-fixtures.js` runs, THE checker SHALL check every file in `fixtures/normal/` and `fixtures/ugly/` and print one line per fixture: name, expected, actual, PASS or FAIL.
2. THE checker SHALL exit with code 0 only when every fixture matches its expectation, and non-zero otherwise.
3. IF a fixture file is not valid JSON, THEN THE checker SHALL report that fixture as `invalid: not JSON` and keep going. It SHALL never crash.
4. THE checker SHALL only read files. It SHALL never change a fixture, and SHALL need no network.

## Requirement 8: Hook H3, fixture check

**User story:** As the builder, I want the fixtures checked on every agent save to the contract, so a broken shape is caught the moment it happens.

1. WHEN the agent saves a file under `contract/` or `fixtures/`, THE hook `fixture-check` SHALL run the checker.
2. THE hook SHALL use a shell command action, not an agent prompt, so it spends no credits.
3. THE hook's description SHALL say it retires when the contract freezes (after Block 3).

## Requirement 9: `npm test`

**User story:** As Shara, I want `npm test` to cover the contract, so the PASS line has one green check.

1. WHEN `npm test` runs, THE fixture checks SHALL run, and the test SHALL fail if any fixture does not match its expectation.

2. The test SHALL live in `contract/contract.test.js` (added to the allowlist Nov 11) so `node --test` finds it without changing `package.json`.

## Non-functional

1. Every file stays under 250 lines, ideally under 150 (hook `line-cap`).
2. No file outside the `docs/current-block.md` allowlist is touched.
3. No new dependency without Shara's approval and a longevity check. The validation approach is the open decision for `design.md`.
4. JSDoc on every export. One file, one responsibility.
5. `KIRO-NOTES.md` gets an entry for anything H3 or the checker catches.

## Notes for design.md (not requirements)

- Lint and the corrupted-JSON fixture: resolved in `design.md` (bad JSON is stored as a `raw` string inside a valid fixture file).
- Charset checks need the pack as input, so the check for DrillRequest and DrillResponse takes a pack (or charset) alongside the value.
