# Tasks: Block 10, AI drills

**Spec:** `ai-drills`. Two batches, one stop each. Touch only the files the design names, plus allowed splits. If the copy table or design doesn't cover something, stop and ask.

Testing: while building, run only the tests for the files you touch. Lint and the full unit suite once before each commit. e2e only before a deploy.

## Batch A: code, no AWS yet

- [x] 1. Longevity check for `@aws-sdk/client-bedrock-runtime`: newest version at least two weeks old, not deprecated, license. Install with `--before`. Report version and date.
- [x] 2. `api/` files and their tests, AWS client faked (Req 2).
- [x] 3. `src/drills/aiClient.js`, `aiWords.js`, the drill start, waiting line, AI labels, Settings switch working, the Progress nudge and the How we count line (Req 1, 3, 4).
- [x] 4. `e2e/aiDrills.spec.js` with the route faked (Req 7.2). Lint, unit, e2e. Commit "Block 10 A: AI drill code, faked AWS". **No deploy.** Report.

## Batch B: AWS, with Shara

- [x] 5. AWS and Vercel setup per Req 6.1 to 6.6 (OIDC role, no user, no keys). Print only names and ARNs. **Stop** only if Req 6.2 finds OIDC or Team issuer mode switched off.
- [x] 6. Golden set and hook H5 (Req 5), run against real Bedrock through Shara's local profile. Report the per-profile lines (pass or fail, never the drill text).
- [x] 7. `docs/aws-teardown.md`. Commit "Block 10 B: AWS wired, golden set". `npm run deploy:preview`. **Stop:** Shara turns AI drills on and plays a drill.
- [ ] 8. KIRO-NOTES Block 10 entry, every flag with a status. Reviewer and a11y-auditor deferred to the Block 16 combined run.
