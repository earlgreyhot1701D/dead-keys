# Tasks: Block 6, shell screens

**Spec:** `shell`. **Rigor:** Working for layout, Full for saved data.
One task at a time. Never "run all." Touch only the files a task names. Tick each when done. Flag anything that looks off; keep a running list for task 15. DO NOT refactor other code.

- [ ] 1. Longevity check and pin: `@fontsource/jetbrains-mono`, `@fontsource/roboto-condensed`, `@playwright/test`, `@axe-core/playwright`, `vercel`. Newest release at least two weeks old, active, no deprecations. Report a table and stop for Shara's OK before installing. _Design 1, 2, 7._
- [ ] 2. Copy: update `src/storage/notices.js` with the approved `otherTab` notice, and `src/storage/exportImport.js` reason strings with the approved wording. Tests updated. _Req 3.4, Block 4 deferral._
- [ ] 3. `index.html`, `src/main.js`, `src/ui/dom.js`, `src/styles/*.css` with fonts and tokens. Contrast test for every text token pair. `npm run dev` shows a blank styled page. _Req 1.1, 1.3, 2._
- [ ] 4. `src/storage/settings.js` + test: defaults and check. _Req 5.1, 5.2._
- [ ] 5. `src/ui/app.js` + test: storage lookup wrapped, `load`, save never when `persist` is false, export, import, clear, old data, tab sync. _Req 3, 5.3, 5.4._
- [ ] 6. `src/ui/router.js`, `components/noticeBar.js`, `components/confirmDialog.js`, `download.js`. _Req 1.2, 3.3._
- [ ] 7. Screens: `title.js`, `menu.js`, `privacy.js`, plus the phone notice. _Req 1.4, 1.5, 4._
- [ ] 8. `components/keyboard.js`, `keyboardLayout.js` + layout test. _Req 6.1._
- [ ] 9. `screens/progress.js`. _Req 6._
- [ ] 10. `screens/settings.js`. _Req 5._
- [ ] 11. `screens/howWeCount.js`, `howWeCountText.js` + test that every number comes from config; `screens/about.js`. _Req 7._
- [ ] 12. `scripts/check-build.js`, `.kiro/agents/a11y-auditor.md`, `playwright.config.js`, `e2e/` flows and axe. _Req 8.1, 8.2._
- [ ] 13. Run `npm run lint`, `npm test`, `npm run test:e2e`, `node scripts/check-fixtures.js`, `npm run build && node scripts/check-build.js`. Report all and line counts.
- [ ] 14. Preview deploy: Shara runs `vercel login`; Kiro links and deploys a preview. Report the preview URL. _Req 8.3._
- [ ] 15. `KIRO-NOTES.md`: Block 6 entry, every flag with a status; close the five Block 6 deferrals.
- [ ] 16. Gates: run the reviewer and the a11y-auditor, run every command yourself, recap both reports. Don't fix anything. Shara opens the preview and decides PASS.
