# Current block

**Block 1: data contract and fixtures** (PRD G4, backlog item 1, size W)

Block 0 (repo setup) was done by Claude on Nov 11: steering, hooks, settings, reviewer agent, docs.

## Files this block may touch

- `contract/schemas/*.json`
- `contract/types.js`
- `fixtures/normal/*.json`
- `fixtures/ugly/*.json`
- `scripts/check-fixtures.js`
- `contract/contract.test.js` (runs the fixture checks so `npm test` covers them; added Nov 11)
- `.kiro/specs/contract/*`
- `.kiro/hooks/fixture-check.json` (hook H3, added this block, retired when the contract freezes)
- `KIRO-NOTES.md`

Anything else: stop and ask Shara.

## Rigor tier

Full for the schemas and the fixture checker. Working for everything else.

## Open decision for design.md

How to validate JSON against the schemas: small hand-written validators in `contract/types.js`, or a validation library. If a library, ask Shara first and run a longevity check.

## PASS line

Every normal fixture validates. Every ugly fixture case passes or fails exactly as its expectation says. `npm test` is green. The reviewer agent has run and Shara has read its report.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent). Add `fixture-check` this block.
