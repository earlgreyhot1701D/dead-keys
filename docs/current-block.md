# Current block

**Block 12: Daily drill** (PRD G5). Spec: `.kiro/specs/daily/`.

Blocks 1 to 4, 6 to 11 and 8a passed. Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen. Block 8b comes later.

## Spec for how screens look

The locked mock's main menu (screen 2), Daily drill panel, filtered through the map and copy table in `.kiro/specs/daily/design.md`. Binding: anything they don't cover, stop and ask.

## Files this block may touch

- `src/drills/daily.js` (new) and its test
- `src/ui/screens/menuRounds.js` (new), `play.js`, `drillRound.js`, `round.js`, `menu.test.js`, `round.test.js`, and their tests
- `src/render/stage.js`, `src/render/playHud.js`
- `src/ui/components/menuDaily.js` (new), `menuSide.js`, and their tests
- `src/styles/menuDaily.css` (new), `src/main.js`
- `e2e/daily.spec.js` (new), `e2e/flows.spec.js` (the "not built" flow: nothing is unbuilt now)
- `.kiro/specs/daily/*`, `docs/current-block.md`, `KIRO-NOTES.md`

Anything else, including `contract/**`, `src/engine/**` and `api/**`: stop and ask Shara.

## Secrets

None. This block makes no network call.

## Testing rule

While building, run only the tests for the files you touch. Lint and the full unit suite once before each commit. e2e only before a deploy.

## Rigor tier

Full.

## PASS line

Every requirement in `.kiro/specs/daily/requirements.md` has a test or an e2e flow. `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint` and `npm run check:build` pass. Source files under 150 lines; nothing over 250. Shara has played a daily drill on the preview from the menu panel. Reviewer and a11y-auditor: deferred to the Block 16 combined run.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent).
