# Current block

**Block 16: Ship** (PRD G13 row 16, G14, G15). No separate spec folder: this file is the scope. Shara played the preview on Nov 13 (8624583) and passed it.

Blocks 1 to 15 passed. The contract is frozen.

## What this block changed

| Commit | What |
|---|---|
| 9eeb039 | Feedback link (Tally) on About and results; Vercel Web Analytics loader (page views only, Vercel hosts only); AI drill words must be real words (SCOWL en_US); README per G14 |
| ae9891b | robots.txt, sitemap.xml, llms.txt, og.png; canonical, Open Graph, Twitter card and JSON-LD in index.html; a no-JavaScript fallback inside #app that the router replaces |
| 8624583 | Attract demo: Falling words only, no warm-up, speed 1.5, 25 s rounds, outer lanes 0 and 5 only (attract spec 2.2 changed); About button top right on title and menu; lifecycleRandom test allows a swallowed key to clear lostTail |

## PRD G15 11-point check (Nov 13, at d57e68f, plus the review fixes)

| # | Item | Result | Evidence |
|---|---|---|---|
| 1 | Authorization | N/A | No accounts (PRD G2) |
| 2 | Validation | Pass | Client `src/drills/aiClient.js`; server `api/drill.js` and `api/_lib/answer.js`, both through `contract/validate.js` |
| 3 | CORS | Pass | `api/drill.js` refuses any Origin but its own and cross-site requests; no CORS headers |
| 4 | Rate limiting | Pass (approximate, G8) | `api/_lib/limits.js`: 30 an hour per visitor, 3,000 a day |
| 5 | Password reset | N/A | No accounts |
| 6 | Frontend errors | Pass | `src/drills/aiClient.js` try/catch and 4 s timeout; storage try/catch in `src/storage/` |
| 7 | DB indexes | N/A | No database |
| 8 | Logging | Pass | `api/_lib/ledger.js`: time, tokens, stop reason, time taken, result; no keys, IP or lines |
| 9 | Alarms | Pass | AWS Budgets `dead-keys`, $5 a month, Bedrock only (`docs/aws-teardown.md`) |
| 10 | Rollback | Pass once tagged | Vercel redeploy, plus a git tag per block: Kiro adds block-8a and block-9 to block-16 at the push |
| 11 | Prompt injection | Pass | `api/_lib/prompt.js` sends only weak keys, rates and WPM; answers are charset and real-word checked |

## Files this block may touch

- `README.md`, `index.html`, `public/**`, `docs/current-block.md`, `docs/prior-work.md`, `docs/aws-teardown.md`, `docs/attract.gif`, `KIRO-NOTES.md`, `.github/workflows/ci.yml`
- `src/analytics/**`, `src/main.js`, `src/attract/**`, `src/styles/base.css`, `src/styles/chrome.css`
- `src/ui/components/feedback.js`, `src/ui/components/aboutButton.js` and their tests
- `src/ui/screens/about.js`, `results.js`, `title.js`, `menu.js` and their tests; `src/ui/safety.test.js`
- `api/_lib/answer.js` and its test; `src/engine/lifecycleRandom.test.js`; `mcp/tools.js` and its test
- `src/ui/isTyping.js`, `src/ui/nav.js`, `src/ui/router.js`, `src/ui/screens/round.js`, `src/ui/components/packPick.js`, `src/styles/titlePanel.css`, `src/styles/attract.css` and their tests
- `scripts/build-pack-es.js`, `scripts/check-pack.js` (Job lines only); `.kiro/specs/attract/requirements.md`, `.kiro/specs/spanish/tasks.md`
- `e2e/helpers.js`, `e2e/keyboard.spec.js`, `e2e/screens.spec.js`, `e2e/flows.spec.js`, `e2e/attract.spec.js`, `e2e/spanish.spec.js`
- `.kiro/specs/attract/requirements.md`

Anything else, including `contract/**` and `src/engine/**` (tests aside): stop and ask Shara.

## Secrets

The AI route reaches AWS through Vercel OIDC (role dead-keys-drill). No AWS keys exist. Never print or write a token, key or bypass secret. Production deploys only on Shara's word.

## Testing rule

Touched tests while building. Lint and the full unit suite before each commit. e2e before each deploy.

## Rigor tier

Full. The 11-point check in PRD G15 applies before production.

## PASS line

Shara has played the preview (done Nov 13). `npm test`, `npm run test:e2e` (0 serious or critical axe issues), `npm run lint` and `npm run check:build` pass. Source files under 150 lines; nothing over 250. The reviewer and a11y-auditor have run on Blocks 15 and 16 together and every finding is fixed or deferred by Shara. Then production deploy and push, on Shara's word.

## Hooks alive

`line-cap` (permanent), `block-scope` (permanent), `pack-check` (retires when the packs freeze; they freeze with this block).
