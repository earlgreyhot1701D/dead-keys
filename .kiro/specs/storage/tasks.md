# Tasks: Block 4, storage

**Spec:** `storage`. Requirements and design approved Nov 11. **Rigor:** Full.
One task at a time. Never "run all." Touch only the files a task names. Tick each task when done. Flag anything that looks off instead of guessing; keep a running flag list for task 9. DO NOT refactor other code.

- [ ] 1. Spike (15 min): the `schemas.js` browser switch per design decision 1. Report PASS or FAIL against the three criteria and stop. Don't start task 2 until Shara says go. _Req 1._
- [ ] 2. `src/storage/notices.js`: the five approved notices exactly as written in requirements.md. Test that every id has a line and a button. _Notice wording._
- [ ] 3. `src/storage/vet.js` + test: the four Req 3 checks. _Req 3, design decision 7._
- [ ] 4. `src/storage/migrate.js` + test: the step table and the 0 to 1 step, using `fixtures/ugly/progress.old-schema.json`. Property: output passes contract and vet. _Req 2.4, design decision 3._
- [ ] 5. `src/storage/store.js` + test: `freshProgress`, `load`, `save`, `clear`, `readCorrupt`, with a stand-in storage that can throw on any call. Every Req 2 and Req 5 branch. _Req 2, 5._
- [ ] 6. `src/storage/exportImport.js` + test: round-trip property, junk property, the 2 MB limit. _Req 6._
- [ ] 7. `src/engine/record.js` + test: order per design decision 8, cap at 200, no mutation, output passes contract and vet. _Req 4._
- [ ] 8. Run `npm run lint`, `npm test`, `node scripts/check-fixtures.js`. Report all three and line counts for every new file.
- [ ] 9. `KIRO-NOTES.md`: Block 4 entry, every flag with a status. Mark each "Deferred to Block 4" row from earlier blocks as Fixed or still Deferred.
- [ ] 10. Reviewer gate: run the reviewer against `docs/current-block.md` and this spec, run the three commands yourself, recap. Don't fix anything. Shara decides PASS.
