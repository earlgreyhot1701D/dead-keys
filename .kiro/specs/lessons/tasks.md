# Tasks: Block 8a, lessons (letters)

**Spec:** `lessons`. **Rigor:** Working for layout, Full for recording and the pass rule.
One task at a time. Never "run all." Touch only the files a task names. Tick each when done. If the map or the copy table does not cover something, stop and ask; never invent copy, numbers or colors. Keep a running flag list for task 14. DO NOT refactor other code. Before ticking any task: `npm run lint`, `npm test` and `node scripts/linecap.js` pass.

- [x] 1. Block 7 carry-ins (Req 10): results landmark name and h1 inside `<main>` (`results.js`, `resultsPanels.js`, `round.js` screen), highest WPM band only on results, "Paused." and "Out of lives." spoken once (`announce.js` or its caller), and report which Vercel CLI `deploy:preview` runs. Tests for each.
- [x] 2. `src/lessons/ladder.js`, `src/lessons/fingers.js`, `packs/lessonWords.json`, and their tests (Req 1, Req 2.5; the lesson words and finger table in `design.md`, word for word).
- [x] 3. `src/lessons/generate.js` with tests: every character learned, lines at most 28 characters, the four parts' shapes (Req 2.4), the Check at least 50 characters, same seed same lesson, Lesson 0's fixed lines, test out is the Check only. Report one generated Lesson 1 and one Lesson 4, then stop for Shara's OK.
- [x] 4. `src/lessons/line.js` with tests: right key, wrong key kept and counted, Backspace clears only the wrong key, space counts, timing gaps capped at 5 s and paused time not counted (Req 3).
- [x] 5. `src/lessons/result.js`, the `record()` pass argument (`src/engine/record.js`) and `finishRound(result, day, pass)` (`src/ui/roundRecord.js`), with tests: the RoundResult passes the contract, Check accuracy and the 95% rule, Lesson 0 passes on finishing, a pass is added once, test out after a pass adds nothing, the lesson-passed milestone appears (Req 4).
- [x] 6. `src/lessons/recommend.js` and `src/lessons/dip.js` with tests (Req 8.1, 8.2, Req 9.1).
- [x] 7. `src/styles/desk.css` and the contrast test (design: Desk look). Stop and report if any pair fails.
- [x] 8. `src/ui/components/lessonKeyboard.js`, `lessonView.js`, `src/ui/screens/lesson.js`, routes in `src/main.js`: the Lesson screen for Lessons 1 to 6 and test out, with the pause dialog. Match mock screen C per the map.
- [x] 9. `src/ui/components/lessonDone.js`: the Lesson done card, recording through `finishRound`. Match mock screen E per the map.
- [ ] 10. **Playtest stop.** `npm run deploy:preview`. Report the URL and stop: Shara plays Lesson 1 and a test out before anything else is built.
- [x] 11. `src/ui/screens/lessons.js` (the Lessons menu) and the menu item in `menu.js`. Match mock screen D per the map.
- [x] 11b. Play these keys and the test out copy (design decision 10), built by Claude: `src/lessons/keysRound.js` and test, `play.js` (`chooseRound(kind, items)`, `roundItems`), `round.js` (items order), `results.js` (Play again keeps the words), `lesson.js`, `lessonDone.js`, `copy.js`. Task 13 adds the e2e for it.
- [x] 12. Lesson 0 in `lesson.js` / `lessonView.js` (Req 6), the main menu panel in `menuSide.js` (Req 8.3, mock screen 2 per the map), and the How we count lines (Req 9.2).
- [x] 13. e2e and screenshots (Req 11): `e2e/lessons.spec.js`, axe, no scroll at three sizes, screenshot pairs added to `e2e/screenshots.spec.js` and saved in `docs/screens/`. Compare each pair with its mock yourself and list every difference you can still see.
- [ ] 14. `KIRO-NOTES.md`: Block 8a entry, every flag with a status. Then gates: run the reviewer and the a11y-auditor, run every command yourself, recap both reports. Don't fix anything. Shara decides PASS.
