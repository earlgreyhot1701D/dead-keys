# Tasks: Block 7, play

**Spec:** `play`. Requirements and design approved Nov 11. **Rigor:** Working for layout, Full for recording and saving.
One task at a time. Never "run all." Touch only the files a task names. Tick each when done. If the map or the copy table does not cover something, stop and ask; never invent copy or numbers. Keep a running flag list for task 13. DO NOT refactor other code.

- [x] 1. Word pack: find the right file in top-english-wordlists (report which file and why), write `scripts/build-pack.js`, `packs/blocklist.txt`, `packs/general.json`, `packs/general.test.js`. Report the first 40 words and the blocklist size, then stop for Shara's OK. _Req 1._
- [x] 2. Engine deferrals: speed ceiling, stray space ignored, `pause(state)`, the 5/3/6 constants (and How we count reads them), rename `later` to `later-hint`. Tests for each. _Req 8._
- [x] 3. `src/a11y/announce.js` and `src/render/hud.js`, pure, with unit tests for every line in the copy table and every HUD value. _Req 3.2, 6.3._
- [x] 4. `src/render/loop.js` with tests (fake frame and clock): dt clamp, NaN guard, auto-pause on hidden or blur, stops on close. _Req 4._
- [x] 5. `src/ui/screens/play.js` (mode picker) and router entries. _Req 2._
- [x] 6. `src/render/falling.js` + falling styles + `round.js` (falling only). Match mock screen 3 per the map. _Req 3, 5._
- [x] 7. `src/render/corners.js` + corners styles. Match mock screen 4 per the map. _Req 3._
- [x] 8. `src/render/moments.js` and reduced-motion versions. _Req 6._
- [x] 9. Practice. _Req 2.2._
- [x] 10. `app.finishRound`, results screen and panels. Match mock screen 5 per the map. _Req 7._
- [x] 11. e2e: `e2e/play.spec.js` keyboard-only flows, axe on every new screen and dialog, no-scroll at three sizes, screenshot pairs. _Req 9._
- [x] 12. Run every check, refresh screenshots, compare each pair with its mock against the map yourself, and list any difference you can still see. `npm run deploy:preview`.
- [x] 13. `KIRO-NOTES.md`: Block 7 entry, every flag with a status; close the Block 7 deferrals.
- [x] 14. Gates: run the reviewer and the a11y-auditor, run every command yourself, recap both reports. Don't fix anything. Shara decides PASS.
