# Kiro notes

Running log for the Kiroween write-up: what each hook caught, where specs beat vibe coding, what Ponytail changed, what the property tests found, how Vercel was driven from the IDE. Newest entries at the bottom.

## Nov 11 2026: Block 0, repo setup (Claude, before Kiro)

- Checked the setup against Kiro's own docs. Added what the plan was missing: `.kiroignore`, `.kiro/settings/sandbox.json`, `.kiro/settings/mcp.json`, and a read-only `reviewer` custom agent.
- Ponytail ships its own Kiro steering file, so it lives at `.kiro/steering/ponytail.md` instead of AGENTS.md.
- Hook trigger names verified against the v1 schema: `PostTaskExec` for the line cap (fires once per task, not on every save), `SessionStart` for the block scope.
- Vercel MCP is in `mcp.json` but disabled. Kiro isn't on Vercel's list of supported MCP clients, so authorization may fail. Plan A is the Vercel CLI in Kiro's terminal. Try enabling the MCP server once; record what happens here.
- Pinned versions at least two weeks old: Vite 8.3.5 (Oct 21), Biome 2.6.4 (Oct 28), fast-check 4.10.2 (Sep 19). Vite 8.3.8 came out the same morning.
- Foundation steering written by hand from the PRD instead of Kiro's "Generate Steering Docs" button, which would write generic files.

## Nov 11 2026: sandbox dropped, setup by hand

- Kiro couldn't run `npm install`: PowerShell and the sandbox blocked it. Shara ran it herself.
- `.kiro/settings/sandbox.json` was removed and never committed. Kiro's own delete was blocked by a permission rule on `.kiro/settings/`, so Shara deleted it. This is the fallback PRD G12 already allows ("if unavailable, Kiro says so and runs without it"). Agent shell commands still need per-session approval in the IDE.
- Kiro handled `git init`, the remote, and staging. Lesson: keep setup prompts light; Kiro handles the basics.

## Nov 11 2026: what Kiro flagged while writing the schemas (article material)

Kiro wrote all 11 schemas in Block 1 and stopped to flag gaps instead of guessing. Each flag and the call made:

| Kiro flagged | Call |
|---|---|
| `type: integer` wasn't in the validator's keyword list | Added the full list of type names to design.md |
| Timestamp format undefined (`lastSeen`, `date`, `createdAt`) | Epoch milliseconds everywhere |
| `Pack.pools` impossible with `additionalProperties: false` only | Validator supports a schema-valued `additionalProperties` |
| `Milestone.threshold` might not be a number | Number or null |
| `schemaVersion` minimum 1 would make old saves invalid | Minimum 0; 0 reads as needs-migration |
| `const` without `type` might pass non-strings | Validator handles both; schema pairs them |
| No cap on ghost count could overflow localStorage | One ghost per mode and pack (rule) |
| Duplicate KeyStats pass the schema | One KeyStat per key (rule) |
| Empty `weakKeys` would still call the AI | `minItems: 1`; no weak keys means built-in drill |
| `lessonId` format | String for now; Block 8 decides |

Pattern worth writing up: the spec said "don't invent," so the agent surfaced every gap as a question. Ten small decisions, about five minutes, zero rework.


## Nov 11 2026: flags from tasks 11a to 13 (validate.js), and what happened to each

| Kiro flagged | Status | Where |
|---|---|---|
| rules.js interface needed before task 14 | Fixed: Kiro's proposal approved | design.md, Rules |
| validate.js can't run until rules.js exists | No action: expected, task 14 closes it | n/a |
| validate.js is Node only (reads schemas with node:fs) | Deferred to Block 4: switch to static JSON imports | design.md, Known limits |
| Bad schema throws, bad data never does | No action: matches design; checker catches throws | design.md, Error handling |
| validate.js at 144 lines | No action: under the 150 soft cap | n/a |
| const/enum compare with JSON.stringify | Logged: fine for scalar values | design.md, Known limits |
| `required` names not vetted against `properties` at load | No action now: no schema does this; reviewer can recheck at the gate | n/a |
| NaN and Infinity rejected | No action: JSON can't produce them | n/a |

## Nov 11 2026: flags from tasks 14 to 16 (rules.js, normal fixtures, checker)

| Kiro flagged | Status | Where |
|---|---|---|
| Checker's FAIL paths never ran | Fixed: task 16a adds a throwaway negative run; task 17 exercises invalid and needs-migration | tasks.md 16a, 17 |
| A missing `ugly/` folder passes silently | Fixed: checker fails on a missing or empty folder | tasks.md 16a |
| Coverage reads the shape from the file name | Fixed: coverage reads the wrapper's `shape` field | tasks.md 16a |
| No check that `packId` points at a real pack | No action: cross-shape references are outside the contract; Block 4 storage can check on import | n/a |
| `pack.mini` has empty `lessons` | Deferred to Block 8, which defines the lessons shape | design.md loose fields |
| Drill lines with spaces need space in the charset | No action: `pack.mini` includes the space; ugly cases follow it | n/a |
| Lint not yet run on new files | Fixed: run `npm run lint` now, fix only Block 1 files | next prompt |
| Kiro added a coverage line beyond the tasks | Kept: it enforces Req 5.1 | check-fixtures.js |

## Nov 11 2026: planned vs actually on (article material)

The plan was thorough. Nobody checked that the plan was switched on. Found only because Shara asked whether Kiro's flags were really being checked.

| Planned | Actually | Fix |
|---|---|---|
| Biome lints and formats | No `biome.json`, so Biome ran on defaults (tabs, 80 columns) across the whole repo, docs and `.kiro/` included: 47 errors | Add `biome.json`; lint scoped to code and fixtures |
| "Lint runs on commit" (tech.md) | No git hook exists, and PRD G12 says lint is not hooked. The steering file contradicted the PRD. | tech.md now says lint runs at every block gate; added to the Block 1 PASS line |
| Hook H1 line-cap runs after each task | Not yet confirmed it fires on its own (Kiro may have run it by hand) | Ask Kiro to confirm it saw hook output |
| Sandbox | Off (blocked npm on Windows) | Already decided and logged |
| Vercel MCP | Disabled | As planned |
| Hook H3 fixture-check, `npm test` test file | Not built yet | Tasks 18 and 19, as planned |

## Nov 11 2026: flags from tasks 16a, lint and 17 (ugly fixtures)

| Kiro flagged | Status | Where |
|---|---|---|
| No `biome.json`, Biome on defaults, whole repo red | Fixed: add `biome.json` (2 spaces, width 100, code and fixtures only) | current-block.md allowlist |
| `validate.js` 191 lines, `check-fixtures.js` 166 after tab reformat | Fixed: recheck after `biome.json`; split only if still over 150 | next prompt |
| Validator suite not re-run after the reformat | Fixed: task 18 makes the tests permanent | tasks.md 18 |
| Checker compares status, not the reason | Fixed: `expectError` phrase must match a real error | tasks.md 17a, 17b |
| Cases 9 and 11 hit the same "not JSON" path | No action: two real sources of bad JSON (saved data, cut-off network reply); both kept | n/a |
| `progress.old-schema` body is deliberately invalid | Logged for Block 4: migration tests must not assume it parses | this note |
| Case 2 has no pack context | No action: the heat map block uses it as the every-key case | n/a |
| `mock/` and `design-brief.md` untracked | No action: Claude made them for the UI track; they commit at the gate | n/a |

## Nov 11 2026: flags from biome.json, 17a, 17b, 18

| Kiro flagged | Status | Where |
|---|---|---|
| Line-cap hook never fired: `PostTaskExec` needs Kiro's task runner, and tasks were ticked by editing tasks.md | Fixed: switch to the agent-stop trigger and prove it fires (18b). Same proof required for H3 (19) | tasks.md 18b, 19 |
| `validate.js` 169 lines, over the soft cap | Fixed: split schema loading into `schemas.js` (13a), which also isolates the Node-only code for Block 4 | tasks.md 13a |
| `check-fixtures.js` 151 lines | No action: one line over the soft cap is a warning, not a stop | n/a |
| Two tasks numbered 17a | Fixed: the optional boundary task is now 17c | tasks.md |
| design.md doesn't list `expectError` | Fixed: added to the wrapper table | design.md |
| Property test never shown to fail | Fixed: throwaway mutation check (18a) | tasks.md 18a |
| Cases 9 and 11 share the "not JSON" path | No action: logged earlier, both kept | n/a |

The hook finding confirms the "planned vs actually on" row: line-cap had not run on its own once all day.


## Nov 11 2026: hooks H1 and H3, triggers confirmed, firing not yet proven (tasks 18b, 19, 20)

Trigger names confirmed against kiro.dev/docs/hooks and /docs/hooks/types, not memory:

| Hook | Trigger (v1, PascalCase) | Docs name | Notes |
|---|---|---|---|
| line-cap (H1) | `Stop` | Agent Stop | Fires when the agent finishes its turn. Replaces `PostTaskExec`, which only fires when Kiro's task runner completes a task. We tick `tasks.md` by editing it, so it never fired. |
| fixture-check (H3) | `PostFileSave` | File Save | `matcher` is a regex on the file path: `(^|[\\/])(contract\|fixtures)[\\/]`, written to accept both slash styles on Windows. |

What happened:

- Both hook files are written (`line-cap.json` edited, `fixture-check.json` created with the `createHook` tool). Kiro's tool said the new hook "will be active on the next session start," so neither hook can fire in the session that wrote it.
- A no-op save of `fixtures/normal/item.word.json` in that same session produced no hook output, as expected.
- Output visibility is a separate question. The `createHook` description says command stdout is forwarded to the agent only for SessionStart, UserPromptSubmit, PreTaskExec, PreCompact and PostCompact. `Stop` and `PostFileSave` are not on that list, so a working hook may still print nothing the agent can see.
- Proof still owed, next session: (1) `Stop`: end of a turn should run `node scripts/linecap.js`; the two over-cap warnings (`check-fixtures.js`, `validate.js` before the split) are the thing to look for. (2) `PostFileSave`: agent saves a fixture and the checker's 24 PASS lines should appear. If nothing is visible, add a temporary marker (a log line to `$env:TEMP`) to the command to prove it ran, then remove it.

Other results from the same run:

- `validate.js` split done: schema loading and vetting now live in `contract/schemas.js` (74 lines); `validate.js` is 103. Checker, lint and `npm test` unchanged.
- Mutation check on the property test: with the DrillResponse charset rule removed from `rules.js`, both tests failed (counterexample: an empty prefix, `"\u0000"`, an empty suffix). Rule restored; tests green.
- Lesson: I recorded a file hash in the same tool batch as the edit I was hashing against, and the batch ran out of order, so the "before" hash was of the mutated file. Hash first, edit in a later call.

## Nov 11 2026: flags from 13a, 18a, 18b, 19, 20

| Kiro flagged | Status | Where |
|---|---|---|
| `Stop` hook not proven | Proven: right after Kiro's turn ended, the Kiro panel showed "Run Command Hook: line-cap". First time the line-cap hook ran on its own all day. What it printed is still unseen | this note |
| Hooks load at session start, so `fixture-check` can't fire until a restart | Next step: Shara restarts the Kiro session, Kiro saves one fixture and reports | next prompt |
| `Stop` fires on every turn, not once per task | No action: linecap is cheap, and once per turn is close to the original intent | n/a |
| `createHook` field order and escaped backslashes | No action: valid JSON | n/a |
| Duplicate 17a IDs | Already fixed earlier (optional boundary task is 17c); Kiro saw a stale view | tasks.md |
| 18a "before" hash taken after the edit | No action: Kiro caught its own slip and verified the file is original (tests green, Biome clean) | n/a |

## Nov 11 2026: hook proof, flags for this batch (tasks 18b, 19, 20)

| Flag | Status | Where |
|---|---|---|
| fixture-check (`PostFileSave`) | Proven: a temporary marker logged one timestamp per agent save (two saves, two entries); marker removed, command back to `node scripts/check-fixtures.js` | `.kiro/hooks/fixture-check.json` |
| line-cap on `Stop` | Proven: Shara saw "Run Command Hook line-cap" in the panel after a turn ended | `.kiro/hooks/line-cap.json` |
| Hook output can't be seen by the agent | No action: a limit of how Kiro works; the proof comes from a person or a file | n/a |
| Failure visibility | Deferred: fixture-check runs on save; whether a failure is visible in the panel is unconfirmed. Test run: `item.word.json` saved with `text` deleted, then restored byte for byte; checker passes 24 of 24 by hand | this note |

## Nov 11 2026: reviewer's Low findings, and task 17c

| Reviewer flagged | Status | Where |
|---|---|---|
| `fixture-check` matcher too wide (also fires on `.kiro/specs/contract/*`) | Deferred: harmless extra run; hook retires after Block 3 | `.kiro/hooks/fixture-check.json` |
| Item id uniqueness promised in `item.json` but not enforced | Deferred: not in Req 2; enforce or reword the description later | `contract/schemas/item.json` |
| Pack name from a fixture not sanitized (`../` accepted) | Deferred: fixtures are repo-owned and the checker is read-only | `scripts/check-fixtures.js` |
| `check-fixtures.js` about 155 lines (soft cap 150) | Deferred: warning only, under the 250 hard cap | `scripts/check-fixtures.js` |
| 200-rounds fixture contents unconfirmed | Deferred | `fixtures/ugly/progress.200-rounds-all-keys.json` |
| `linecap.js` on the allowlist? | Fixed: `git status` shows it unchanged | n/a |
| Rules and limits with no fixture (Medium) | Fixed: task 17c, 11 ugly cases added. All 11 came back invalid on the first run, so no rule was missing. One fixture had my own typo (85 characters, not 81); the checker's `expectError` caught it | tasks.md 17c |
