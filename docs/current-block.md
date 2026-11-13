# Current block

**Block 8a: lessons, letters** (PRD G5, G7, G11). Spec: `.kiro/specs/lessons/`.

Blocks 1 to 4, 6 and 7 passed (tags `block-1` to `block-4`, `block-6`, `block-7`). Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen.

## Spec for how screens look

`mock/lessons.html` (locked Nov 12: screens C, D, E) and `mock/index.html` screen 2 (the recommended lesson panel), filtered through the mock-to-build map in `.kiro/specs/lessons/design.md`. Reference pictures: `docs/screens/mock-lesson.png`, `mock-lessons.png`, `mock-lesson-done.png`. The map and the copy table are binding: anything they don't cover, stop and ask. Lesson screens use the desk look; play screens must not change.

## Files this block may touch

- `src/lessons/**` (new)
- `packs/lessonWords.json`, `packs/lessonWords.test.js` (new)
- `src/engine/record.js` and its test (one change: the optional pass, Req 4.4); `src/lessons/recordPass.test.js`, `src/lessons/playKit.js` (test helper)
- `src/engine/milestones.js` (one line: the lesson milestone label, Nov 12)
- `src/ui/roundRecord.js` and its test (one change: pass the pass through)
- `src/ui/screens/lessons.js`, `lesson.js` (new), `menu.js`, `howWeCountText.js`, `results.js`, `round.js` (carry-in only), and their tests
- `src/ui/components/lessonKeyboard.js`, `lessonView.js`, `lessonDone.js` (new), `menuSide.js`, `resultsPanels.js`, and their tests
- `src/a11y/announce.js` and its test (carry-in only)
- `src/styles/desk.css`, `deskLesson.css`, `deskDone.css`, `desk.test.js` (new; split for the line cap), and their imports in `src/main.js`
- `src/main.js` (routes)
- Added by Claude, Nov 12: `src/lessons/keysRound.js` and test, `src/ui/screens/play.js` (round items), `src/ui/components/lessonAsk.js` and test (Kiro, split for the line cap), `src/styles/deskMenu.css`, `deskMenuSide.css`, `pages.css` (How we count in four columns), `src/ui/screens/progress.js`, `src/ui/components/progressPanels.js` (Lessons button) and their tests
- `e2e/**`, `docs/screens/**`
- `.kiro/specs/lessons/*`, `KIRO-NOTES.md`

Anything else, including `contract/**`, `src/engine/` other than `record.js`, `src/render/**` and every play style: stop and ask Shara.

## Rigor tier

Working for layout. Full for the pass rule and recording a lesson.

## PASS line

Every requirement in `.kiro/specs/lessons/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint`, `node scripts/check-fixtures.js` and `npm run check:build` pass. No page scrolls at 1440x900, 1366x768 and 1280x720. Each lesson screenshot matches its mock side by side per the map, at 1440x900 and 1366x768, approved by Shara. Source files under 150 lines; nothing over 250. The reviewer and the a11y-auditor have run. Shara has played Lesson 1, a test out and Lesson 0 on the preview (Vercel toolbar off).

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
