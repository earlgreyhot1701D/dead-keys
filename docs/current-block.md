# Current block

**Block 10: AI drills** (PRD G3, G8, G9, G15). Spec: `.kiro/specs/ai-drills/`.

Blocks 1 to 4, 6, 7, 8a and 9 passed. Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen. Block 8b comes later.

## Spec for how screens look

Block 9's drill screens, with the AI label from `mock/index.html` "Play: four-corner defense", filtered through the map and copy table in `.kiro/specs/ai-drills/design.md`. Binding: anything they don't cover, stop and ask.

## Files this block may touch

- `api/**` and `api/_lib/**` (new), `evals/**` (new), `.kiro/hooks/golden-set.json` (new), `docs/aws-teardown.md` (new)
- `src/drills/**`
- `src/ui/screens/drillRound.js`, `resultsDrill.js`, `settings.js`, `howWeCountDrills.js`, and their tests; `.kiro/specs/drills/design.md` (one copy row)
- `src/ui/components/drillButton.js`, `drillLabel.js`, `progressPanels.js`, and their tests
- `src/storage/settings.js` and its test (only if the AI switch needs it)
- Added Nov 12 for the AI drill wiring: `src/ui/screens/round.js`, `progress.js`, `src/render/stage.js`, `src/render/playHud.js`, `src/ui/components/resultsPanels.js`, and their tests (trim to stay under 150); `src/styles/progressWeak.css` (the note under the buttons), `src/styles/progressRight.css` (chart width, Claude)
- `package.json`, `package-lock.json` (one dependency: `@aws-sdk/client-bedrock-runtime`)
- New files split out next to any of the above to stay under 150 lines (list each in KIRO-NOTES)
- `e2e/**`, `docs/screens/**`
- `.kiro/specs/ai-drills/*`, `KIRO-NOTES.md`

Anything else, including `contract/**` and `src/engine/**`: stop and ask Shara.

## Secrets

Shara creates the AWS access key and enters it in the Vercel dashboard. The agent never runs `create-access-key`, never reads, prints or commits a key, and never writes one to a file. `.kiroignore` already blocks `.env*`.

## Testing rule

While building, run only the tests for the files you touch. Lint and the full unit suite once before each commit. e2e only before a deploy.

## Rigor tier

Full.

## PASS line

Every requirement in `.kiro/specs/ai-drills/requirements.md` has a test, an e2e flow or a recorded step. The golden set passes against real Bedrock. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint`, `node scripts/check-fixtures.js` and `npm run check:build` pass. Source files under 150 lines; nothing over 250. Shara has turned AI drills on and played an AI drill on the preview, and seen the built-in label when it falls back. Reviewer and a11y-auditor: deferred to the Block 16 combined run.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent), `golden-set` (until the AI layer passes).
