# Current block

**Block 4: storage** (PRD G9, backlog item 4, size D). Spec: `.kiro/specs/storage/`.

Blocks 1 to 3 passed Nov 11 (tags `block-1`, `block-2`, `block-3`). The contract is frozen: no new shapes.

## Files this block may touch

- `contract/schemas.js` (browser switch only, design decision 1; spike passed Nov 11, so plan B is not needed)
- `contract/contract.test.js` (one test that the `FILES` list matches `contract/schemas/`, added Nov 11)
- `package.json` (the `engines` field only, added Nov 11)
- `src/storage/notices.js`, `vet.js`, `migrate.js`, `store.js`, `saveClear.js`, `exportImport.js`, and their `*.test.js` (`saveClear.js` was split from `store.js` at the line cap, Nov 11; `storeHelpers.test.js` holds the `freshProgress` and `readCorrupt` tests)
- `src/engine/record.js`, `src/engine/record.test.js`
- `.kiro/specs/storage/*`
- `KIRO-NOTES.md`

Anything else: stop and ask Shara.

## Rigor tier

Full. Every input checked, every failure path handled.

## PASS line

Every requirement in `.kiro/specs/storage/requirements.md` has a test. `npm test` is green. `npm run lint` is clean. `node scripts/check-fixtures.js` passes. Source files under 150 lines without Shara's OK; nothing over 250. The reviewer has run and Shara has read its report.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent). `fixture-check` retired at the end of Block 3.
