# Tasks: Block 9, built-in drills

**Spec:** `drills`. One batch, one stop (task 5). Touch only the files the design's file table names, plus allowed splits. If the map or copy table doesn't cover something, stop and ask. Keep a flag list for task 6.

Testing: while building, run only the tests for the files you touch. Lint and the full unit suite once before the commit. e2e only before the deploy.

- [x] 1. `src/drills/weights.js` and tests (Req 1).
- [x] 2. Weighted spawning in `targets.js` and `round.js`, with the regression test and property tests (Req 2).
- [x] 3. The drill round, labels and Play again (Req 3, 4): `play.js`, `round.js` screen, `stage.js`, `playHud.js`, `results.js`, `resultsPanels.js`, styles.
- [x] 4. Progress button and line, How we count Drills section (Req 5, 6).
- [x] 5. e2e and screenshots (Req 7). Lint, full unit suite, full e2e. Commit "Block 9: built-in drills". `npm run deploy:preview` (preview only). **Stop:** report the URL; Shara plays a drill.
- [ ] 6. After Shara's play: KIRO-NOTES Block 9 entry with every flag and its status, then the reviewer and the a11y-auditor once each. Recap both. Fix nothing.
