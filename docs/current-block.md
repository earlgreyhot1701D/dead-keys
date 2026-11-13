# Current block

**Block 15: Spanish pack and pack validator** (PRD G2, G6). Spec: `.kiro/specs/spanish/`. The MCP server is the second half of Block 15.

Blocks 1 to 4, 6 to 14 and 8a passed. Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen. Block 8b comes later.

## Spec for how screens look

No mock: the Words choice is built from the Play screen's own controls. The copy table in `.kiro/specs/spanish/design.md` is binding.

## Files this block may touch

- `packs/spanish.json`, `packs/spanish.test.js`, `packs/blocklist-es.txt`, `packs/source/es_*` (new)
- `scripts/build-pack-es.js`, `scripts/check-pack.js` (new)
- `src/packs/**` (new), `src/storage/settings.js` and its test
- `src/ui/components/packPick.js` (new) and its test; `src/ui/screens/play.js`, `drillRound.js`, `round.js`, `resultsDrill.js`, `about.js`, and tests
- `src/styles/playPicker.css`
- `docs/pack-format.md` (new), `.kiro/hooks/pack-check.json` (new)
- `e2e/spanish.spec.js` (new)
- `.kiro/specs/spanish/*`, `docs/current-block.md`, `KIRO-NOTES.md`

Anything else, including `contract/**`, `src/engine/**` and `api/**`: stop and ask Shara.

## Secrets

None. This block makes no network call.

## Testing rule

While building, run only the tests for the files you touch. Lint and the full unit suite once before each commit. e2e only before a deploy.

## Rigor tier

Full.

## PASS line

Every requirement in `.kiro/specs/spanish/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint` and `npm run check:build` pass. Source files under 150 lines; nothing over 250. `node scripts/check-pack.js` passes. Shara has played in Spanish on the preview. Reviewer and a11y-auditor: deferred to the Block 16 combined run.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
