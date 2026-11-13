# Current block

**Block 13a: Ghost race** (PRD G4 GhostRun). Spec: `.kiro/specs/ghost/`. Attract mode is Block 13b.

Blocks 1 to 4, 6 to 12 and 8a passed. Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen. Block 8b comes later.

## Spec for how screens look

The locked mock's main menu (screen 2), Daily drill panel ghost line, filtered through the map and copy table in `.kiro/specs/ghost/design.md`. Binding: anything they don't cover, stop and ask.

## Files this block may touch

- `src/ghost/**` (new)
- `src/render/ghostHud.js` (new), `src/render/stage.js`, and tests
- `src/ui/screens/round.js`, `results.js`, `resultsDrill.js`, `src/ui/roundRecord.js`, and tests (`resultsGhost.test.js`, `roundGhost.test.js` new)
- `src/ui/components/menuDaily.js` and its test
- `src/styles/playHud.css`
- `e2e/ghost.spec.js` (new), `e2e/daily.spec.js` (the panel now races a ghost after a first best)
- `.kiro/specs/ghost/*`, `docs/current-block.md`, `KIRO-NOTES.md`

Anything else, including `contract/**`, `src/engine/**` and `api/**`: stop and ask Shara.

## Secrets

None. This block makes no network call.

## Testing rule

While building, run only the tests for the files you touch. Lint and the full unit suite once before each commit. e2e only before a deploy.

## Rigor tier

Full.

## PASS line

Every requirement in `.kiro/specs/ghost/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint` and `npm run check:build` pass. Source files under 150 lines; nothing over 250. Shara has saved a ghost and raced it on the preview. Reviewer and a11y-auditor: deferred to the Block 16 combined run.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
