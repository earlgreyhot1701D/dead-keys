# Current block

**Block 8b: Lessons 7 to 13** (PRD G7, G2 glossary, G10). Spec: `.kiro/specs/lessons-8b/`. Shara approved the spec on Nov 13 (Lesson 7 teaches the opposite Shift and does not check it). Built by Claude the same day.

Blocks 1 to 16 passed except Block 16's production deploy, which waits for this block. The contract is frozen.

## Files this block may touch

- `src/lessons/**` and tests (`beyond.js`, `lineKit.js` new)
- `src/ui/components/lessonKeyboard.js`, `lessonView.js`, `lessonSay.js` (new), `lessonAsk.js`, `lessonDone.js`, `lessonsMenuParts.js`, `menuSide.js`, `packPick.js`, `glossary.js` (new), and tests
- `src/ui/screens/lesson.js`, `lessons.js`, `settings.js`, and tests
- `src/styles/deskKeys.css` (new), `src/styles/deskMenuSide.css`, `src/main.js` (one import)
- `e2e/lessons8b.spec.js` (new), `e2e/lessons.spec.js`
- `.kiro/specs/lessons-8b/*`, `docs/current-block.md`, `KIRO-NOTES.md`

Anything else, including `contract/**` and `src/engine/**`: stop and ask Shara.

## Secrets

None. This block makes no network call.

## Testing rule

Touched tests while building. Lint and the full unit suite before each commit. e2e before each deploy.

## Rigor tier

Working for layout, Full for anything that records a lesson or decides a pass.

## PASS line

Every requirement in `.kiro/specs/lessons-8b/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint` and `npm run check:build` pass. Source files under 150 lines; nothing over 250. Shara has played Lessons 7 to 13 on the preview. Then Block 16's production deploy and push.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent), `pack-check` (retires when the packs freeze).
