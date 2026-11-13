# Current block

**Block 9: built-in drills** (PRD G5 weighted sampling, G8 layer 1). Spec: `.kiro/specs/drills/`.

Blocks 1 to 4, 6, 7 and 8a passed. Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen. Block 8b (Lessons 7 to 13 and the deferred a11y items) comes later.

## Spec for how screens look

`mock/index.html` screens "Play: falling targets", "Results" and "Progress + heat map", filtered through the mock-to-build map in `.kiro/specs/drills/design.md`. The map and the copy table are binding: anything they don't cover, stop and ask.

## Files this block may touch

- `src/drills/**` (new)
- `src/engine/targets.js`, `src/engine/round.js` and their tests (weighted spawning only)
- `src/ui/screens/play.js`, `round.js`, `results.js`, `progress.js`, `howWeCountText.js`, and their tests
- `src/ui/components/resultsPanels.js`, `progressPanels.js`, and their tests
- `src/render/stage.js`, `src/render/playHud.js`, and their tests
- `src/styles/playHud.css`, `results.css`, `progressWeak.css`
- New files split out next to any of the above to stay under 150 lines (list each in KIRO-NOTES)
- `e2e/**`, `docs/screens/**`
- `.kiro/specs/drills/*`, `KIRO-NOTES.md`

Anything else, including `contract/**`, other engine files and the lesson screens: stop and ask Shara.

## Testing rule

While building, run only the tests for the files you touch. Lint and the full unit suite once before the commit. e2e only before a deploy.

## Rigor tier

Working for layout. Full for sampling and recording.

## PASS line

Every requirement in `.kiro/specs/drills/requirements.md` has a test or an e2e flow. Non-drill rounds replay exactly as before (regression test). `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint`, `node scripts/check-fixtures.js` and `npm run check:build` pass. No page scrolls at 1440x900, 1366x768 and 1280x720, How we count included. Drill screenshots match the mock per the map at 1440x900 and 1366x768, approved by Shara. Source files under 150 lines; nothing over 250. The reviewer and the a11y-auditor have run. Shara has played a drill on the preview (Vercel toolbar off).

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
