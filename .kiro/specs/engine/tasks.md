# Tasks: Block 2, engine core

**Spec:** `engine`. Requirements and design approved Nov 11. **Rigor:** Full.
One task at a time. Never "run all." Each task: touch only the files it names, then stop with a brief recap. Flag anything that looks off instead of guessing. DO NOT refactor other code.

- [x] 1. `src/engine/config.js`: the named constants from design.md with the confirmed numbers (LIVES_MAX 5, WAVE_SIZE 10, WAVE_SPEEDUP 1.1, SPEED_MIN 0.5, SPEED_MAX 2, TARGETS_START 3, TARGETS_MAX 8, BASE_TRAVEL_MS 8000, SLOTS per mode). Job line at top. _Req 5, Proposed numbers._
- [x] 2. `src/engine/rng.js` + `rng.test.js`: mulberry32 with state as plain data. Property tests: same seed same sequence, every value in [0, 1). _Req 1._
- [x] 3. `src/engine/score.js` + `score.test.js`: `wpm`, `accuracy`. Property tests: never negative, accuracy in [0, 1], never NaN or Infinity, zero cases. _Req 4._
- [x] 4. `src/engine/match.js` + `match.test.js`: `pickLock`, `applyKey`. Property tests: lock goes to nearest-to-danger target whose next character matches, ties to lower id, never a target that doesn't start with the typed character; case counts. _Req 2._
- [x] 5. Contract change: `contract/schemas/roundResult.json` (`keyDeltas` as `{ [key]: { attempts, misses } }`, add required `continued` boolean), `contract/rules.js` (misses ≤ attempts per key), `contract/types.js`. Update every fixture that holds a RoundResult. Checker and `npm test` pass. _Req 6, design decision 8._
- [x] 6. Ugly fixtures for the change: a keyDelta with misses over attempts, a RoundResult missing `continued`, and (added Nov 11) the same misses-over-attempts nested inside a Progress round. Both `expect: "invalid"` with `expectError`. _Req 6._
- [x] 7. `src/engine/targets.js` + `targets.test.js`: `spawn`, `advance`. Uses rng and config only. Tests: travel time follows the design formula, spawns never exceed the wave's limit, practice never moves. _Req 5.8, 5.9, design decisions 1 and 2._
- [x] 8. `src/engine/round.js` part 1 + `round.test.js`: `createRound`, `key`, `pressEscape`. Tests: layered Escape, paused ignores keys and time, stray keys counted per design decision 3, input state never changed. _Req 2, 3._
- [ ] 9. `src/engine/lifecycle.js` + `lifecycle.test.js` (split from `round.js`, Nov 11): `tick`, `resolveOutOfLives`, `endRound`, `resume`. Tests: life lost at danger (lock released), wave up gives a life back up to 5, out of lives holds, continue refills and keeps score, continue used then ended, practice ends only on `endRound`. _Req 5._
- [ ] 10. `src/engine/result.js` + `result.test.js` (split from `round.js`, Nov 11): `toResult`. Practice reports wave 0 and cleared as counted. Property tests: every finished round passes the RoundResult contract via `contract/validate.js`; same inputs and same timed keystrokes give the same result. _Req 5.10, 5.11, Req 7._ If `round.js` passes 150 lines, stop and propose a split before going on.
- [ ] 11. Run `npm run lint`, `npm test`, `node scripts/check-fixtures.js`. Report all three and every engine file's line count.
- [ ] 12. `KIRO-NOTES.md`: Block 2 entry with a flags table (Fixed / Deferred / No action / Proven) for everything flagged in this block.
- [ ] 13. Reviewer gate: run the reviewer agent against `docs/current-block.md` and this spec. Run the three commands yourself, since the reviewer can't. Recap the report. Don't fix anything. Shara decides PASS.
