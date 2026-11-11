# Tasks: Block 3, progress math

**Spec:** `progress`. Requirements and design approved Nov 11. **Rigor:** Full.
One task at a time. Never "run all." Touch only the files a task names. Tick each task when done. Flag anything that looks off instead of guessing; keep a running flag list for task 9. DO NOT refactor other code.

- [ ] 1. `src/engine/progressConfig.js`: every constant in the design's file table, with `BANDS` holding cutoffs, glyphs and player labels, and `GROUPS` per design decisions 1 and 2. Job line at top. _Req 2, 3, 4._
- [ ] 2. `src/engine/keystats.js` + test: `mergeRound`. Property tests: order-independent totals, no mutation, untouched keys unchanged, `lastSeen` = round date. _Req 1._
- [ ] 3. `src/engine/heatmap.js` + test: `bandFor`, `heatmap`. Property tests: under 10 attempts is "no data", more misses never a better band, every band has glyph and label. _Req 2._
- [ ] 4. Contract change: `diagnosis.json` (severity enum high/medium), `milestone.json` (kind enum), `progress.json` (`bests` as `{ [mode]: { wpm, date } }`), `contract/types.js`. Update fixtures holding these shapes. Add ugly fixtures: bad severity, bad kind, a best with negative wpm. Checker and `npm test` pass. _Req 5._
- [ ] 5. `src/engine/diagnose.js` + test: `diagnose`. Property tests: passes the contract, max 3 sentences worst first, empty sentences when not enough data, no flag when overall misses are zero, banned words never appear, weak keys ordered per Req 3.5. _Req 3._
- [ ] 6. `src/engine/milestones.js` part 1 + test: `updateBests`. Tests: practice and under-90% rounds never set a best, a tie isn't a best, no mutation. _Req 4.1, 4.2, 4.4._
- [ ] 7. `milestones.js` part 2: `newMilestones`. Tests: each kind awarded once by id, practice counts for streaks and lessons only, nothing about slowing down, a 7-day streak across a month end, output passes the contract. If the file passes 150 lines, stop and propose a split. _Req 4.3 to 4.7._
- [ ] 8. Run `npm run lint`, `npm test`, `node scripts/check-fixtures.js`. Report all three and line counts for every new file.
- [ ] 9. `KIRO-NOTES.md`: Block 3 entry, every flag with a status (Fixed / Deferred / No action / Proven).
- [ ] 10. Reviewer gate: run the reviewer against `docs/current-block.md` and this spec, run the three commands yourself, recap. Don't fix anything. Shara decides PASS.
