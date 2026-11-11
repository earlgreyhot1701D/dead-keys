# Current block

**Block 3: progress math** (PRD G5, backlog item 3, size D). Spec: `.kiro/specs/progress/`.

Block 1 passed Nov 11 (tag `block-1`). Block 2 passed Nov 11 (tag `block-2`).

## Files this block may touch

- `src/engine/progressConfig.js`, `keystats.js`, `heatmap.js`, `diagnose.js`, `milestones.js`, `dayStreak.js` (the last added Nov 11 when `milestones.js` hit the line cap)
- Their `*.test.js` files in `src/engine/`
- `contract/schemas/diagnosis.json`, `milestone.json`, `progress.json`, `contract/types.js` (design decision 8 only)
- `fixtures/normal/*.json`, `fixtures/ugly/*.json` (updates for those shapes and the new ugly cases)
- `.kiro/specs/progress/*`
- `KIRO-NOTES.md`

Anything else: stop and ask Shara.

## Rigor tier

Full. These produce what the player sees about their own typing.

## PASS line

Every requirement in `.kiro/specs/progress/requirements.md` has a test. `npm test` is green. `npm run lint` is clean. `node scripts/check-fixtures.js` passes. Source files under 150 lines without Shara's OK; nothing over 250. The reviewer has run and Shara has read its report.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent), `fixture-check` (retires when the contract freezes at the end of this block).
