# Current block

**Block 1: data contract and fixtures** (PRD G4, backlog item 1, size W)

Block 0 (repo setup) was done by Claude on Nov 11: steering, hooks, settings, reviewer agent, docs.

## Files this block may touch

- `contract/schemas/*.json`
- `contract/types.js`
- `contract/validate.js`, `contract/rules.js` (added by design.md, Nov 11)
- `contract/schemas.js` (split from validate.js, Nov 11)
- `.kiro/hooks/line-cap.json` (trigger fix only, Nov 11)
- `fixtures/normal/*.json`
- `fixtures/ugly/*.json`
- `scripts/check-fixtures.js`
- `contract/contract.test.js` (runs the fixture checks so `npm test` covers them; added Nov 11)
- `.kiro/specs/contract/*`
- `.kiro/hooks/fixture-check.json` (hook H3, added this block, retired when the contract freezes)
- `KIRO-NOTES.md`
- `biome.json` (added Nov 11: Biome had no config, so it ran on defaults)

Anything else: stop and ask Shara.

## Rigor tier

Full for the schemas and the fixture checker. Working for everything else.

## Decided in design.md

Hand-written schema-subset validator in `contract/validate.js`, extra rules in `contract/rules.js`. No library.

## PASS line

Every normal fixture validates. Every ugly fixture case passes or fails exactly as its expectation says. `npm test` is green. `npm run lint` is clean. The reviewer agent has run and Shara has read its report.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent). Add `fixture-check` this block.
