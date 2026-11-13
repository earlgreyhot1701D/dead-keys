# Current block

**Block 14: Sound sets and the Spec Wave easter egg** (PRD G2). Specs: `.kiro/specs/sound/`, `.kiro/specs/specwave/`.

Blocks 1 to 4, 6 to 13 and 8a passed. Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen. Block 8b comes later.

## Spec for how screens look

No new screen. The copy tables in both specs' design.md are binding.

## Files this block may touch

- `src/sound/**`, `src/specwave/**` (new)
- `src/drills/limits.js` (new), `src/drills/daily.js`, and tests
- `src/ui/screens/roundKinds.js` (new), `play.js`, `drillRound.js`, `round.js`, `resultsDrill.js`, `title.js`, `settings.js`, `menuRounds.js`, and their tests
- `e2e/specwave.spec.js` (new)
- `.kiro/specs/sound/*`, `.kiro/specs/specwave/*`, `docs/current-block.md`, `KIRO-NOTES.md`

Anything else, including `contract/**`, `src/engine/**` and `api/**`: stop and ask Shara.

## Secrets

None. This block makes no network call.

## Testing rule

While building, run only the tests for the files you touch. Lint and the full unit suite once before each commit. e2e only before a deploy.

## Rigor tier

Full.

## PASS line

Every requirement in `.kiro/specs/sound/requirements.md` and `.kiro/specs/specwave/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint` and `npm run check:build` pass. Source files under 150 lines; nothing over 250. Shara has heard both sound sets and played the Spec Wave on the preview. Reviewer and a11y-auditor: deferred to the Block 16 combined run.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
