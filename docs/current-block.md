# Current block

**Block 2: engine core** (PRD G5, backlog item 2, size W). Spec: `.kiro/specs/engine/`.

Block 1 (data contract) passed Nov 11, tag `block-1`.

## Files this block may touch

- `src/engine/config.js`, `rng.js`, `score.js`, `match.js`, `targets.js`, `round.js`, `lifecycle.js`, `result.js` (the last two added Nov 11 when `round.js` hit the line cap)
- `src/engine/*.test.js` (including `lifecycle.test.js` and `result.test.js`)
- `contract/schemas/roundResult.json`, `contract/rules.js`, `contract/types.js` (keyDeltas and `continued` only, design decision 8)
- `fixtures/normal/*.json`, `fixtures/ugly/*.json` (RoundResult updates and the two new ugly cases)
- `.kiro/specs/engine/*`
- `KIRO-NOTES.md`

Anything else: stop and ask Shara.

## Rigor tier

Full. These functions produce every number a player sees.

## PASS line

Every requirement in `.kiro/specs/engine/requirements.md` has a test. `npm test` is green. `npm run lint` is clean. `node scripts/check-fixtures.js` passes. No engine file over 150 lines without Shara's OK. The reviewer agent has run and Shara has read its report.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent), `fixture-check` (until the contract freezes after Block 3).
