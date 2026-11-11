# Tasks: Block 1, data contract and fixtures

**Spec:** `contract`. Built from `requirements.md` and `design.md` (both approved Nov 11).
**How to run:** one task at a time, in order. Never "Run all tasks." After each task, tick its checkbox in this file, then give Shara a short recap: file touched, what it does, anything that looked off.
**Schemas** go in `contract/schemas/`, file names in camelCase (`roundResult.json`). Every schema uses only the keywords listed in `design.md`.

## Schemas (one file each)

- [x] 1. `item.json`. Item shape. Req 1.2, 2.2, 2.11.
- [x] 2. `keyStat.json`. KeyStat shape. Req 1.2, 2.4.
- [x] 3. `keystroke.json`. Keystroke shape, `expected` and `typed` one character each. Req 1.2, 2.4.
- [x] 4. `milestone.json`. Milestone shape, `kind` loose (Block 11). Req 1.2, 1.3.
- [x] 5. `pack.json`. Pack shape, `pools` values are arrays of `$ref` item.json, `charset` a string, `lessons` loose (Block 8). Depends on 1. Req 1.2 to 1.4.
- [x] 6. `roundResult.json`. Seven modes, accuracy 0 to 1, `keyDeltas` loose (Block 2). Req 1.2, 1.3, 2.1, 2.3, 2.4.
- [x] 7. `ghostRun.json`. Keystrokes max 2,000, `$ref` keystroke.json. Depends on 3. Req 2.6.
- [x] 8. `diagnosis.json`. Max 3 sentences, max 6 weak keys. Req 2.7.
- [x] 9. `drillRequest.json`. Up to 6 `{ key, rate }`, `recentWpm` 0 to 250. Req 2.9.
- [x] 10. `drillResponse.json`. 1 to 8 lines, each 1 to 80 characters, `source` const `ai`. Req 2.10.
- [x] 11. `progress.json`. Rounds max 200, `lessonsPassed` with `how`, `$ref`s to the shapes it holds, `bests` and `settings` loose. Depends on 2, 4, 6, 7. Req 1.2 to 1.4, 2.6, 2.8, 4.1.

## Code (one file each)

- [x] 11a. `drillRequest.json`: set `weakKeys` `minItems: 1` (Req 2.9, decided Nov 11).
- [x] 12. `contract/types.js`. One JSDoc typedef per shape, each linking its schema. Exports `CURRENT_SCHEMA_VERSION = 1`. Depends on 1 to 11. Req 1.5.
- [x] 13. `contract/validate.js`. Schema-subset checker per `design.md`: loads schemas, throws on an unknown keyword, counts characters with `[...s]`, returns `{ status, errors }`. Exports `validate` and `parseAndValidate`. Calls `rules.js` hooks (task 14). Depends on 12. Req 2, 7.3.
- [x] 14. `contract/rules.js`. Schema version first, misses vs attempts, no duplicate keys, one ghost per mode and pack, the three charset rules, "no pack given." Depends on 12. Req 2.5, 3, 4.

- [x] 13a. Split `contract/validate.js` (decided Nov 11): move schema loading and vetting (`KEYWORDS`, `TYPES`, `DIR`, `vet`, the schema cache) into `contract/schemas.js` exporting `loadSchemas()`. All `node:fs` code lives there, ready for the Block 4 swap. Behavior unchanged; checker and `npm test` stay green.

## Fixtures and checker

- [x] 15. `fixtures/normal/*.json`. At least one valid fixture per shape, in the wrapper format from `design.md`, including `pack.mini.json` (a small pack other fixtures can name). Invented content only. Depends on 1 to 11. Req 5.
- [x] 16. `scripts/check-fixtures.js`. Reads every fixture, prints `name, expected, actual, PASS/FAIL`, exit 0 only if all match, read-only. Exports `checkAll()`. Run it: every normal fixture PASS. Depends on 13, 14, 15. Req 7.
- [x] 16a. `scripts/check-fixtures.js` update (decided Nov 11): FAIL if `fixtures/normal/` or `fixtures/ugly/` is missing or empty; coverage reads each wrapper's `shape` field, not the file name. Then one throwaway negative run (bad wrapper, missing pack, a mismatch) to prove the FAIL paths, with nothing left in the repo.
- [x] 17. `fixtures/ugly/*.json`. The 11 cases from Req 6.1, each with `expect` and, when invalid, `reason`. Cases 9 and 11 use `raw`. Run the checker: all PASS. Depends on 16. Req 6.1, 6.2.
- [x] 17c. (Required, Nov 11) Rule and boundary fixtures for limits with no ugly case: 201 rounds, 2,001 ghost keystrokes, 7 weak keys, an 81-character line. Req 6.3.

- [x] 17a. `scripts/check-fixtures.js`: an invalid fixture may carry `expectError` (a phrase); if present, at least one actual error message must contain it, or FAIL. Stops a fixture passing for the wrong reason.
- [x] 17b. `fixtures/ugly/*.json`: add `expectError` to the invalid cases (9, 10, 11). Run the checker: all PASS.

## Tests, hook, notes

- [x] 18. `contract/contract.test.js`. `node --test` runs `checkAll()` and one fast-check property: a DrillResponse line with any character outside the charset is rejected. `npm test` green. Depends on 17. Req 9.
- [x] 18a. Mutation check, throwaway: remove the charset rule in `rules.js`, confirm the property test in `contract.test.js` fails, restore it, confirm green. Nothing changed in the repo afterwards.
- [x] 18b. `.kiro/hooks/line-cap.json` (decided Nov 11): `PostTaskExec` never fires because tasks are ticked by editing `tasks.md`, not through Kiro's task runner. Switch the trigger to the agent-stop event (confirm the exact v1 name in Kiro's hook docs), then prove it fires once on its own and its output is visible.
- [x] 19. `.kiro/hooks/fixture-check.json`. Hook H3. Confirm the file-save trigger name in Kiro's hook schema first, then match the format of `line-cap.json`. Then prove it fires on its own: save a fixture and show the hook's output. Patterns `contract/**`, `fixtures/**`. Description says it retires after Block 3. Req 8.
- [x] 20. `KIRO-NOTES.md`. One entry: what the checker or H3 caught, the trigger name found, anything worth the write-up. Non-functional 5.

## Gate

- [x] 21. Run the `reviewer` agent on Block 1. Shara reads the report and decides PASS or FAIL.
