# Current block

**Block 11: Share card** (PRD G10). Spec: `.kiro/specs/share/`.

Blocks 1 to 4, 6 to 10 and 8a passed. Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen. Block 8b comes later.

## Spec for how screens look

The share card mock Shara approved on Nov 13, filtered through the map and copy table in `.kiro/specs/share/design.md`. Binding: anything they don't cover, stop and ask.

## Files this block may touch

- `src/share/**` (new)
- `src/ui/components/shareDialog.js` (new) and its test
- `src/ui/screens/results.js` and its test
- `src/styles/share.css` (new), `src/main.js` (one import)
- `e2e/share.spec.js` (new)
- `.kiro/specs/share/*`, `docs/current-block.md`, `KIRO-NOTES.md`

Anything else, including `contract/**`, `src/engine/**` and `api/**`: stop and ask Shara.

## Secrets

None. This block makes no network call.

## Testing rule

While building, run only the tests for the files you touch. Lint and the full unit suite once before each commit. e2e only before a deploy.

## Rigor tier

Full.

## PASS line

Every requirement in `.kiro/specs/share/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint` and `npm run check:build` pass. Source files under 150 lines; nothing over 250. Shara has opened the card on the preview, downloaded the PNG and copied the line. Reviewer and a11y-auditor: deferred to the Block 16 combined run.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
