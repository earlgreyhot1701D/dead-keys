# Requirements: Block 10, AI drills

**Spec:** `ai-drills` (PRD G3 architecture, G8 AI route and brakes, G9 privacy, G15 security and teardown). **Rigor:** Full. This is the only code that leaves the browser and the only code that costs money.
**Status:** Approved by Shara, Nov 12. Kiro builds all of it and wires AWS through Shara's account.
**Sources:** PRD G8 (request path, brake table, failure behavior), G12 (golden set, hook H5), G15 (11-point check, teardown). `mock/index.html` "Play: four-corner defense" draws the `[ DRILL: AI-GENERATED ]` badge. The copy table in `design.md` is binding: anything it doesn't cover, stop and ask.

## Introduction

When a player turns on AI drills in Settings, Drill these keys asks Amazon Nova Micro on Bedrock for up to 8 practice lines aimed at their weak keys. The words from those lines become the drill. Any failure, timeout, cap or bad answer gives the built-in drill instead, labeled built-in. Never a blank screen, never an error code.

## Scope

**In:** the Vercel function and its helpers, the prompt, validation both ways, rate limit and daily cap, the usage ledger, the browser client with a 4-second timeout and fallback, the AI label, the golden set and hook H5, the AWS setup (IAM user and policy, Budgets alert), the env vars, the teardown checklist.
**Out:** the MCP server (Block 15), a shared rate-limit counter (STUB, PRD G2), AI for any mode but the drill.
**Never:** player text sent to the model (only weak keys, their rates and recent WPM); an AWS key seen, typed, printed or committed by the agent; AI drills on by default.

---

## Requirement 1: The request

1. WHEN the player starts a drill with AI drills on and at least one weak key, THE browser SHALL send one `DrillRequest` (contract): `packId` "general", up to 6 weak keys from Progress with their miss rates, `recentWpm` from the last round (0 if none), rounded and clamped to 0 to 250.
2. WHEN AI drills are off, or there are no weak keys, THE browser SHALL make no request and run the built-in drill.
3. The request is validated in the browser before it is sent (contract `validate` with the pack charset).

## Requirement 2: The function (`api/drill.js`)

1. SHALL accept POST only, JSON only, body under 2 KB, same origin only (G15 item 3). Anything else: 4xx with a short JSON error, no stack.
2. SHALL validate the body as a `DrillRequest` with the pack charset before anything else.
3. SHALL apply, in order: a per-visitor limit of 30 calls an hour and a daily cap of 3,000 calls, in memory (approximate, PRD G8 known limit). A visitor is a hash of the forwarded IP with a per-instance salt; the IP is never stored or logged.
4. SHALL call Bedrock Converse with model `us.amazon.nova-micro-v1:0`, `maxTokens` 300, through `api/bedrock.js`, the only file that imports the AWS SDK.
5. SHALL discard the answer unless the stop reason is a normal end. Then (Shara, Nov 13, after the golden set showed long lines and numbered lists) the answer is a bag of words: each lowercased word is kept only if it is pack-charset letters, 2 to 12 long and not on `packs/blocklist.txt`; everything else is dropped word by word. The kept words are packed into lines of at most 80 characters, at most 8 lines, and validated as a `DrillResponse` with the pack charset plus space. No usable word gives `{ error: "empty" }`.
6. SHALL return `{ lines, source: "ai" }` on success, or `{ error: "<short code>" }` with 200 for caps and model failures so the browser falls back quietly (429 only for the per-visitor limit).
7. SHALL write one ledger line per call to the function log: time, input and output tokens, stop reason, latency, result code. No weak keys, no IP, no lines.
8. SHALL give up on the Bedrock call after 3.5 seconds (abort signal) and answer `{ error: "timeout" }`, so a hung call never runs to the function's time limit (Kiro flag 4, Shara, Nov 12).

## Requirement 3: The browser client and fallback

1. `src/drills/aiClient.js` SHALL POST with a 4-second timeout (AbortController), inside try/catch, and validate the response again in the browser.
2. The drill's words are every word in the lines, split on spaces, lowercase, deduplicated, each word only pack-charset letters. WHEN there are at least `DRILL_MIN_WORDS` (8) words, the drill uses them, weighted by G5 as in Block 9, with `drillSource: "ai"`.
3. Otherwise, on any error, timeout, cap or rejection, the built-in drill runs with `drillSource: "built-in"`. The player sees only the label.
4. While the request is out, the Progress screen shows the copy-table waiting line under the button and the button can't be pressed twice.
5. Play again after an AI drill SHALL replay the same AI words with no new request, labeled AI-generated (as Play these keys keeps its words). Play again after a built-in drill stays as Block 9 (Shara, Nov 12).

## Requirement 4: Labels and privacy

1. An AI drill shows `[ DRILL: AI-GENERATED ]` in the HUD and on results, and `AI-GENERATED` in the DRILL SOURCE row. The live region says `Drill: AI-generated.` once.
2. The Settings AI drills switch now works and stays off by default. Its hint and the privacy card already say what leaves the browser; no wording changes.
3. How players find it (Shara, Nov 12): WHEN AI drills are off and the player has weak keys, THE Progress drill panel SHALL show the copy-table nudge line under Drill these keys, in the same slot as the no-weak-keys line. With no weak keys, the Block 9 line shows instead. With AI on, no nudge.
4. How we count's Drills section: its last line becomes the copy-table line that says what the AI gets. Claude checked it still fits at 1440x900; fit.spec.js must stay green.

## Requirement 5: Golden set and hook

1. `evals/golden.json` SHALL hold 6 weak-key profiles (single key, a home-row pair, a rare key like q, a top-row group, a bottom-row group, mixed with high WPM).
2. `evals/run.js` SHALL call the same prompt and Bedrock path for each profile and pass only when every answer ends normally and, after the route's cleaning (Req 2.5), has at least `DRILL_MIN_WORDS` (8) different words with a weak key: the words a drill actually keeps, since the drill round narrows AI words to weak-key words the same way as built-in ones (drills decision 5; Shara, Nov 13). The share of weak-key words is printed for watching, not judged.
3. Hook H5 (`.kiro/hooks/golden-set.json`): on save of `api/prompt.js`, run `node evals/run.js`. Retire when the AI layer passes (PRD G12).

## Requirement 6: AWS setup, no IAM user and no keys (Vercel OIDC federation; Shara, Nov 13)

0. Bedrock model access is automatic for serverless models since Oct 2025. Nova Micro is an Amazon model, so nothing is enabled in the console.
1. Account 831889733571 through the `default` CLI profile (Shara, Nov 13). Kiro SHALL create no IAM user and no access key.
2. Kiro SHALL find the Vercel team slug and project name (`vercel project inspect`, `vercel teams ls`) and confirm the project's OIDC issuer mode is Team. If OIDC federation or Team issuer mode is off in the project's settings, stop and tell Shara where to switch it on.
3. Kiro SHALL create the IAM OIDC identity provider for `https://oidc.vercel.com/<TEAM_SLUG>` with audience `https://vercel.com/<TEAM_SLUG>` (check for an existing one first).
4. Kiro SHALL create the IAM role `dead-keys-drill` with:
   - a trust policy allowing `sts:AssumeRoleWithWebIdentity` from that provider, with `StringEquals` `oidc.vercel.com/<TEAM_SLUG>:aud` = `https://vercel.com/<TEAM_SLUG>` and `StringLike` `oidc.vercel.com/<TEAM_SLUG>:sub` in [`owner:<TEAM_SLUG>:project:<PROJECT>:environment:preview`, `owner:<TEAM_SLUG>:project:<PROJECT>:environment:production`] (this project only, never development);
   - one inline policy, `bedrock:InvokeModel` only (Converse uses it): on `arn:aws:bedrock:us-east-1:831889733571:inference-profile/us.amazon.nova-micro-v1:0`, and on the foundation-model ARNs in us-east-1, us-east-2 and us-west-2 with `StringEquals bedrock:InferenceProfileArn` = that profile ARN.
5. Kiro SHALL create a $5 monthly AWS Budgets alert named "dead-keys", emailing cordero.lsj@gmail.com.
6. Kiro SHALL add two Vercel env vars for Preview and Production through the Vercel CLI: `AWS_ROLE_ARN` (the role ARN, not a secret) and `AWS_REGION` = `us-east-1`. No AWS key exists anywhere.
7. `api/_lib/bedrock.js` (Claude, Nov 13) trades the request's `x-vercel-oidc-token` header for role credentials with `fromWebToken` from `@aws-sdk/credential-provider-web-identity` 3.972.85 (Oct 29, already in the SDK's tree; pinned directly). It never logs the token. Locally it uses the default profile. Claude chose this over `@vercel/oidc-aws-credentials-provider`, whose two-week-old versions carry a high zod advisory and whose fix is one day old.
8. Kiro SHALL write `docs/aws-teardown.md`: the role, its inline policy, the OIDC provider (shared only if another project uses it), the budget, the log groups, the two Vercel env vars, and the steps to delete them after judging (Jan 29, 2027).

## Requirement 7: Checks

1. Unit tests for every `api/` file with the AWS client faked: validation, both limits, stop reasons, charset rejection, truncated answers, the ledger line's fields.
2. e2e (`e2e/aiDrills.spec.js`) with `/api/drill` faked by Playwright route: AI on gives the AI badge and the AI words; a timeout, a 429, an error and a bad character each give the built-in drill and badge; AI off makes no request.
3. The golden set passes against real Bedrock before the preview deploy that turns it on.
4. No new runtime dependency except `@aws-sdk/client-bedrock-runtime`, pinned to a version at least two weeks old, installed with `--before`, checked for deprecation.
