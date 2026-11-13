# Current block

**Block 15 part 2: MCP server** (PRD G12). Spec: `.kiro/specs/mcp/`. Part 1 (Spanish pack and pack validator) is committed at `97ca361`.

Blocks 1 to 4, 6 to 14 and 8a passed. Block 5 (design) is locked in `docs/design-brief.md`. The contract is frozen. Block 8b comes later.

## Spec for how screens look

No screens: the MCP server is a local developer tool, never in the build.

## Files this block may touch

- `mcp/**` (new)
- `.kiro/settings/mcp.json` (one entry: `dead-keys`, no secrets)
- `package.json`, `package-lock.json` (one dev dependency: `@modelcontextprotocol/sdk`, exact; keep the two optional `@emnapi` entries)
- `.kiro/specs/mcp/*`, `docs/current-block.md`, `KIRO-NOTES.md`

Anything else, including `scripts/check-pack.js`, `evals/**`, `api/**`, `contract/**` and `src/**`: stop and ask Shara. The server calls `check-pack.js` and `evals/run.js`; it does not change them.

## Secrets

None in any file. `run_golden_set` uses the local default AWS profile and calls real Bedrock only with `{ confirm: true }`; it never returns a credential, token or env value.

## Testing rule

While building, run only the tests for the files you touch. Lint and the full unit suite once before each commit. e2e only before a deploy.

## Rigor tier

Working; Full for the pack path check and the Bedrock gate.

## PASS line

Every requirement in `.kiro/specs/mcp/requirements.md` has a test or a recorded step. `npm test`, `npm run test:e2e`, `npm run lint`, `node scripts/check-pack.js` and `npm run check:build` pass. `validate_pack` answers through the MCP connection. Files under 150 lines. Reviewer and a11y-auditor: deferred to the Block 16 combined run.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent), `pack-check` (H4), `golden-set` (H5).
