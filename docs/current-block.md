# Current block

**Block 7: play** (PRD G2, G5, G10, G11, backlog item 7, size W). Spec: `.kiro/specs/play/`.

Blocks 1 to 4 and 6 passed Nov 11 (tags `block-1` to `block-4`, `block-6`). Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen.

## Spec for how screens look

`mock/index.html` screens 3, 4 and 5, filtered through the mock-to-build map in `.kiro/specs/play/design.md`. The map and the copy table are binding: anything they don't cover, stop and ask.

## Files this block may touch

- `packs/**`, `scripts/build-pack.js`
- `biome.json` (one change, Nov 12: lint `packs/**/*.js`)
- `src/engine/config.js`, `targets.js`, `round.js`, `lifecycle.js`, `score.js`, `diagnose.js`, `progressConfig.js` and their tests (Req 8 only)
- `src/engine/pace.js` and its test, `src/engine/warmup.test.js`, `src/engine/wrongKey.test.js`, `src/render/playHud.test.js` (new, Shara, Nov 12: the picker's WPM estimate, the warm-up)
- `src/render/**`, `src/a11y/**`
- `src/ui/screens/play.js`, `round.js`, `results.js`, `howWeCountText.js`, `settings.js`; `src/ui/components/resultsPanels.js`; `src/ui/app.js`; `src/ui/roundRecord.js` (finishRound, like backup.js; Shara, Nov 12); `src/main.js`; and their tests
- `src/styles/**`
- `e2e/**`, `docs/screens/**`
- `.kiro/specs/play/*`, `KIRO-NOTES.md`, `package.json` (scripts only)

Anything else: stop and ask Shara.

## Rigor tier

Working for layout. Full for recording and saving a round.

## PASS line

Every requirement in `.kiro/specs/play/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint`, `node scripts/check-fixtures.js` and `npm run check:build` pass. No page scrolls at 1440x900, 1366x768 and 1280x720. Each play and results screenshot matches its mock screen side by side per the map, at 1440x900 and 1366x768, approved by Shara. Source files under 150 lines; nothing over 250. The reviewer and the a11y-auditor have run. Shara has played a round on the preview.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
