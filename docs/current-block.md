# Current block

**Block 13b: Attract mode** (PRD shell, design brief screen 1), plus ghost Req 5. Spec: `.kiro/specs/attract/`.

Blocks 1 to 4, 6 to 12, 13a and 8a passed. Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen. Block 8b comes later.

## Spec for how screens look

The locked mock's title (screen 1), header status and Pause demo, filtered through the copy table in `.kiro/specs/attract/design.md`. Binding: anything they don't cover, stop and ask.

## Files this block may touch

- `src/attract/**` (new)
- `src/ui/screens/title.js` and its test; `src/ui/fakeDom.js` (one helper)
- `src/styles/attract.css` (new), `src/main.js`
- `src/ghost/ghost.js`, `src/ui/screens/play.js`, `howWeCountText.js`, and their tests
- `e2e/attract.spec.js` (new)
- `.kiro/specs/attract/*`, `docs/current-block.md`, `KIRO-NOTES.md`

Anything else, including `contract/**`, `src/engine/**` and `api/**`: stop and ask Shara.

## Secrets

None. This block makes no network call.

## Testing rule

While building, run only the tests for the files you touch. Lint and the full unit suite once before each commit. e2e only before a deploy.

## Rigor tier

Full.

## PASS line

Every requirement in `.kiro/specs/attract/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint` and `npm run check:build` pass. Source files under 150 lines; nothing over 250. Shara has watched the demo on the preview and paused it. Reviewer and a11y-auditor: deferred to the Block 16 combined run.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
