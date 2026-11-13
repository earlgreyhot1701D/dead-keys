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
| validate.js is Node only (reads schemas with node:fs) | Fixed in Block 4: `schemas.js` uses static JSON imports; the spike passed (test suite, a throwaway Vite build, and the built output validating a fixture) | `contract/schemas.js` |
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
| `progress.old-schema` body is deliberately invalid | Fixed in Block 4: the migrate test uses it, and the upgrade drops its bad round and `keys` to give a fresh, valid save | `migrate.test.js` |
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

## Nov 11 2026: Block 2, engine core, flags and decisions (tasks 1 to 11)

Built: `config`, `rng`, `score`, `match`, `targets`, `round`, `lifecycle`, `result` in `src/engine/`, plus the `keyDeltas` and `continued` contract change. At task 11: `npm test` 91 of 91, `npm run lint` clean (74 files), checker 38 of 38. Source files all under 150 lines (largest: `round.js`, 144).

| Flag | Status | Where |
|---|---|---|
| `SLOTS` had no numbers in the spec | Fixed: falling 8, corners 4. Target cap is min(wave cap, slots for the mechanic), so corners holds at most 4 (one word per corner) | `config.js`, `targets.js` |
| Which mechanic do lesson, daily, testout, specwave and practice use | Fixed: `createRound` takes `mechanic` separately from `mode`; `SLOTS` keyed by mechanic. Practice uses a mechanic for layout but never moves | `round.js` |
| `accuracy` and `wpm` clamped bad input | Fixed: they throw `RangeError` on negative, non-finite, non-number input, and on correct > total (design decision 6) | `score.js` |
| Property test found `wpm(0, 5e-324)` returning NaN (`ms / 60000` underflowed to 0) | Fixed and Proven: rearranged to `chars x 12000 / ms`. The test caught what example tests would not | `score.js` |
| `wpm` overflow guard returns 0 on absurd valid inputs | No action: real rounds never reach it | `score.js` |
| RNG shape: `{ state, next }` with `next(state)` pure | No action: confirmed. State is a plain number, so a round can be copied | `rng.js` |
| `keyDeltas` shape, `continued`, and the misses-over-attempts rule | Fixed: schema, `rules.js`, `types.js`, and every fixture holding a RoundResult | `contract/` |
| Generated fixtures `progress.200-rounds-all-keys` and `progress.201-rounds` were reflowed by my script (large diffs) | No action: the only content change was `continued: false` | `fixtures/ugly/` |
| Misses over attempts nested inside a Progress round had no fixture | Fixed: `progress.round-keydelta-misses-over-attempts` | `fixtures/ugly/` |
| `keyDeltas` keys are not checked to be one character | Fixed in Block 4: `vet` rule 1 checks every `keyDeltas` and `keys` key is one character, on load, import and save | `src/storage/vet.js` |
| `pickLock` returns the target; `match` throws on bad input | No action: approved. The round filters bad input first (design decision 6) | `match.js` |
| `mechanic in SLOTS` accepted "constructor" and "toString" | Fixed: `Object.hasOwn`, with a test | `targets.js`, `round.js` |
| `nextId` added to round state | No action: needed so ids keep rising after targets leave | `design.md` |
| `spawn` adds one target per call; `round.js` loops to fill | No action: matches design decision 2 | `targets.js` |
| `advance` returns `{ state, arrived }`, not events | No action: arrival is not an event yet | `targets.js` |
| Stray key emits `miss` with `expected: null` | No action | `round.js` |
| Practice stays in wave 1 internally; `toResult` reports wave 0, cleared as counted | No action: decided (design 14) | `result.js` |
| Keystroke log is uncapped in state | Deferred: the 2,000 cap belongs to the ghost block | `round.js` |
| `round.js` was 153 lines after part 1 | Fixed: split approved. `lifecycle.js` (tick, resolveOutOfLives, endRound, resume) and `result.js` (toResult); allowlist, `structure.md`, `design.md` updated | design 12 |
| Keystroke time: `tMs` and `startMs` could not exclude paused time | Fixed: `t` is `activeMs` at the key (resolution one tick); `key` takes no time, `createRound` takes no start time. Req 5.1 edited to match | design 9 |
| No way to resume except Escape | Fixed: Escape while paused resumes, and `resume(state)` is exported for the dialog button. Both emit `resumed` | design 10 |
| `escape` shadows the old global; Biome rejected the declaration | Fixed: renamed `pressEscape` in code, tests and design, no alias | design 11 |
| `round.js` exports `fill` for `lifecycle.js` | No action: small addition to the export list, noted in the design table | `design.md` |
| Continue with targets near danger would waste the free continue | Fixed: continue releases the lock, clears the screen, respawns fresh targets. Req 5.5 and design 13 edited so the spec matches the code | `lifecycle.js` |
| Two targets arrive at 1 life: both removed, both emit `lifeLost`, lives stop at 0 | No action | `lifecycle.js` |
| Lock released on arrival with `lifeLost` only, no `unlocked` | No action: approved; `lifeLost` carries `targetId` | `lifecycle.js` |
| `toResult` returned the round's own `keyDeltas` object | Fixed: `structuredClone`, with a test that editing the result leaves the round alone | `result.js` |
| Contract property might never fail | Proven: a throwaway mutation (drop `Math.round` on `durationMs`) failed it with "expected integer"; the file was hashed in a separate call first, and the restored hash matched | `result.test.js` |
| `lifecycle.test.js` reached 306 lines, over the hard cap (found by running `scripts/linecap.js` by hand) | Fixed: random-play tests moved to `lifecycleRandom.test.js` | `src/engine/` |
| `round.test.js` (227), `lifecycle.test.js` (236), `targets.test.js` (185), `result.test.js` (175) over the 150 soft cap; `check-fixtures.js` at 151 | No action: approved. Each tests one source file and all are under 250 | n/a |
| Test helpers (`freeze`, `opts`, `items`) repeated across test files | No action: a shared test-kit file is not on the allowlist | n/a |
| Tab hidden then shown sends one huge `dtMs`, so every target arrives at once and all lives are lost (Claude's review) | Closed in Block 7 (task 4): `src/render/loop.js` clamps `dt` to 100 ms, turns NaN or negative into 0, and pauses on hidden or blur, with tests | `loop.js` |
| `WAVE_SPEEDUP` has no ceiling: wave 20 is about 1.3 s per word, wave 30 about 0.5 s (Claude's review) | Closed in Block 7 (task 2, retuned in the playtest): `WAVE_SPEEDUP` 1.05, capped at wave 10 (`WAVE_SPEEDUP_MAX_WAVE`) | `config.js` |
| A stray space counts as a miss in falling mode, where words have no spaces (Claude's review) | Closed in Block 7: a space is never counted, locked or not (Req 8.2) | `round.js`, `deferrals.test.js` |
| Reviewer: `structure.md` and `current-block.md` edited outside the allowlist | No action: the edits were approved in the split decision | n/a |
| Reviewer: `requirements.md` drifted from the code (targets "up to 8", "Shara to confirm" heading, short Scope list) | Fixed: targets row reads "up to 8 (falling), 4 (corners)", heading is "Confirmed numbers", Scope lists all eight engine files | `requirements.md` |
| Reviewer: the Req 1.4 test scanned two files; Req 5.2 (no clock) had no direct test | Fixed: one test scans every non-test file in `src/engine/` for `Math.random(`, `Date`, `performance.` and `setTimeout`, with comments stripped. A second test proves the scan finds a call in code and ignores one in a comment | `rng.test.js` |
| Reviewer: `createRound` kept the caller's `items` by reference | Fixed: shallow copy of the array and of each item. The new test failed without the fix and passes with it (proven by running it first, and again after moving it) | `round.js`, `roundInput.test.js` |
| `round.test.js` reached 255 lines after the new test, over the hard cap (found by running `scripts/linecap.js`) | Fixed: the new test moved to `roundInput.test.js` | `src/engine/` |
| Reviewer: `activeMs` counts the whole `dt` when a round ends mid-tick | No action: the error is at most one tick (design decision 9) | n/a |
| Reviewer: lives and waves apply to lesson, testout, daily and specwave; lessons pass on accuracy | Deferred to Block 8: decide whether those modes use lives and waves | Block 8 |

Pattern worth writing up: the spec said "flag, don't guess", and every gap in this block (slots, resume, key time, the continue reset) became a one-line question with a one-line answer. The one real bug a property test found (the `wpm` underflow) is one example tests would have missed, and a deliberate mutation showed the contract property can fail.

## Nov 11 2026: Block 3, progress math, flags and decisions (tasks 1 to 8)

Built: `progressConfig`, `keystats`, `heatmap`, `diagnose`, `milestones`, `dayStreak` in `src/engine/`, plus three contract changes (`Diagnosis.severity`, `Milestone.kind`, `Progress.bests`) and one late one (`Progress.dayStreak`). At task 8: `npm test` 164 of 164, `npm run lint` clean (91 files), checker 42 of 42. Source files all under 150 lines (largest: `milestones.js`, 121).

| Flag | Status | Where |
|---|---|---|
| `bests` keys are not checked to be real modes or to exclude practice (the schema subset has no `propertyNames`; `rules.js` is not on this block's allowlist) | Fixed in Block 4: `vet` rule 2 checks every `bests` key is a real mode and not `practice` | `vet.js` |
| `lastSeen` depended on merge order | Fixed: `lastSeen` is the later of the saved date and the round's date, and the order property now checks it. My first grouping test was wrong (one combined round has one date, so it cannot reproduce per-key `lastSeen`); grouping checks counts only | `keystats.js` |
| Zero-attempt deltas still touch a key | No action: the engine never emits one | `keystats.js` |
| `mergeRound`, `bandFor`, `diagnose`, `updateBests`, `updateDayStreak` throw on malformed input | No action: approved, design decision 6 | `src/engine/` |
| `heatmap` returns `missRate: null` for no-data keys | No action: approved. A rate from a few keystrokes should not read as a verdict | `heatmap.js` |
| Internal band names are camelCase (`noData`) | No action | `progressConfig.js` |
| Apostrophe, hyphen and brackets are only in "symbols" (design decision 1 defines the rows without them); space is in no group | No action: approved | `progressConfig.js` |
| Spanish accented letters (á, ñ) are in no group, and `Á` is only in shift | Deferred to Block 15 (Spanish pack): add an "accents" group so the diagnosis can say "your accented letters..." | `progressConfig.js` |
| WPM bands had no accuracy floor, so 30 WPM at 40% accuracy would earn "30 words per minute" | Fixed: bands need the same 90% floor as bests. Req 4.3 and design decision 9 updated; test: 30 WPM at 40% earns none, exactly 90% does | `milestones.js` |
| Weak keys with no misses (a flawless player would get six arbitrary keys) | Fixed in spec and code: weak keys need 10+ attempts and at least one miss. Req 3.5 and design decision 10 updated | `diagnose.js` |
| `newMilestones` took a fourth `dayOf` argument | Fixed: dropped when the day streak moved into Progress. Back to three arguments, as in the original design table | `milestones.js` |
| `newMilestones` assumes `progress` is the saved progress and `result` is the new round (counted once even if already in `rounds`); rounds are in saved order, ties keep it; lesson milestones come from `lessonsPassed` whatever the round's mode | No action: approved, design decisions 11 and 12 | `milestones.js` |
| The 7-day streak was worked out from saved rounds, but only 200 are kept, so a player doing about 30 a day would never show 7 days | Fixed: `Progress.dayStreak` `{ lastDay, count }` is required; `updateDayStreak` keeps the count on the same day, adds 1 on the next, resets to 1 after a gap; `newMilestones` awards from it. Req 4.8, 5.4 and design decision 14 added; types, nine fixtures and one ugly fixture (negative count) updated. Tests: month end, year end, leap day, a gap, same day twice, and a random-play property | `dayStreak.js`, `progress.json` |
| `milestones.js` reached 156 lines with the streak code | Fixed: streak code split into `dayStreak.js` (allowlist and `structure.md` updated) | `src/engine/` |
| An earlier day than `lastDay` (clock or time zone change) | No action: decided, it changes nothing, so travelling west cannot break a streak (design 14) | `dayStreak.js` |
| `newMilestones` updates the streak for `localDay` itself | No action: it gives the same answer whether or not the caller already updated it (tested) | `milestones.js` |
| `dayStreak.lastDay` format is not checked by the schema (no `pattern` keyword); it only checks a string of length 10 or null | Fixed in Block 4: `vet` rule 3 checks `dayStreak.lastDay` is null or a real calendar date (leap years included), on load, import and save | `vet.js` |
| Nothing yet calls `updateDayStreak` | Fixed in Block 4: `record` calls it for every round, practice included, before it works out milestones (tested: the 7th day's card is awarded in the same call). Saving the result is `save` | `src/engine/record.js` |
| An existing test (`milestones.test.js`) failed when `dayStreak` became required | Proven: the contract change was caught by a test that builds a Progress, not by luck. Fixed the helper | `milestones.test.js` |
| Sentence wording says "at least twice" and "at least three times", and "misses most keys" when over about two thirds | No action: approved; a test pins the ratios 2 and 3 the wording assumes | `diagnose.js` |
| Plural groups ("shift keys", "digits", "symbols") use "miss", singular ones "misses" | No action | `diagnose.js` |
| `updateBests` returns a boolean `newBest`, never sets a best at 0 WPM, and returns the same object when nothing changes | No action: approved, design decision 13 | `milestones.js` |
| WPM bands are capped at 1000 so bad data cannot loop forever | No action | `milestones.js` |
| Test files over the 150 soft cap: `keystats.test.js` (167), `milestonesAward.test.js` (207), `diagnose.test.js` (233) | No action: approved, each tests one source file and all are under 250 | n/a |
| The `Date` identifier is banned in engine source by the Block 2 scan test | No action: day math is plain arithmetic (`dayNumber`), and the scan still passes | `dayStreak.js` |

### Block 3 reviewer findings and decisions (Nov 11 2026)

| Flag | Status | Where |
|---|---|---|
| `newMilestones` back to three arguments (the `dayOf` argument was dropped when the day streak moved into Progress) | No action: approved | `milestones.js` |
| An earlier day than `lastDay` leaves the streak unchanged | No action: approved | `dayStreak.js` |
| Reviewer 1: Req 1.1 and task 2 said `lastSeen` is the round's date, but the code takes the later of the saved date and the round's | Fixed: Req 1.1, Req 1.3 and task 2 reworded; the code and the "older round never moves it back" test were already right | `requirements.md`, `tasks.md` |
| Reviewer 2: key groups had no independent test; `diagnose.test.js` looked groups up through the code under test | Fixed and Proven: a hand-written table of 43 keys (left vs right hand, digits, symbols, capitals and shifted keys counting toward their base key's row and hand, space in no group), plus letter and digit invariants. A throwaway mutation (adding `y` to the left hand) failed two tests; the file was hashed first and the restored hash matched | `progressConfig.test.js` |
| Reviewer 3: the spec's example sentence said "twice"; the code writes "at least twice" | Fixed: Req 3.4 and design decision 3 now give the real wording, and note "at least three times" and "misses most keys" | `requirements.md`, `design.md` |
| Reviewer 4: `structure.md` and `current-block.md` edited outside the allowlist | No action: those edits were approved | n/a |
| Reviewer 5: saved data is only partly validated at the engine boundary (`mergeRound` does not check `misses <= attempts` or key length; `updateBests` throws a raw TypeError on a malformed `bests[mode]`) | Fixed in Block 4 for saved data: `load`, `importText` and `save` all run the contract and `vet` checks, so `record` and the engine functions only ever get vetted input. The engine functions still throw on malformed input they are handed directly, as designed (decision 6) | `store.js`, `exportImport.js`, `saveClear.js` |
| Reviewer 6: one missed `Q` can flag top row, left hand and shift, giving three overlapping sentences | Deferred to Block 11: check how the overlap reads when the results screen renders it | Block 11 |
| Reviewer 7: `fixture-check` was meant to retire when the contract freezes | Fixed: Block 3 passes and the contract is frozen, so the hook is switched off with `"enabled": false` (a documented field at kiro.dev/docs/hooks). The file stays for the record, and its description says it is retired. The checker script stays and `npm test` still runs it. Not re-proven by a save: hooks load at session start, so the switch takes effect from the next session | `.kiro/hooks/fixture-check.json` |
| Reviewer 8: the milestone tone regex left out "bad" | Fixed: `/bad\|slow\|dip\|worse\|decline/i` | `milestonesAward.test.js` |

Contract frozen at the end of Block 3 (tag `block-3`): the eleven shapes, `keyDeltas`, `continued`, `Diagnosis.severity`, `Milestone.kind`, `Progress.bests` and `Progress.dayStreak`. Any change from here is a new decision, not a drive-by edit.

## Nov 11 2026: Block 4, storage, flags and decisions (tasks 1 to 8)

Built: `schemas.js` without `node:fs`, then `notices`, `vet`, `migrate`, `store`, `saveClear`, `exportImport` in `src/storage/` and `record` in `src/engine/`. At task 8: `npm test` 273 of 273, `npm run lint` clean (107 files), checker 42 of 42, nothing over 250. Every source file is under 150 lines (largest: `store.js`, 105). No shapes were added; the contract stayed frozen.

| Flag | Status | Where |
|---|---|---|
| The spike: could the schema files load in the browser build? | Proven: `import x from "./x.json" with { type: "json" }` passed all three criteria (suite green; a throwaway Vite 8.3.5 build of 18 modules, 22.5 kB; the built file validated a real fixture and held no `node:` code). The throwaway files were deleted. Plan B was not needed | `contract/schemas.js` |
| The `FILES` list in `schemas.js` is hand-kept, so a new schema file could be silently missing | Fixed: a test in `contract.test.js` fails if the list and the directory differ (proven with a stray file) | `contract.test.js` |
| Import attributes need Node 22 or newer | Fixed: `engines.node >= 22` in `package.json`; `npm ci --dry-run` still passes | `package.json` |
| `store.js` reached 173 lines, over the 150 soft cap | Fixed: `save` and `clear` moved to `saveClear.js`; `store.js` is 105. Allowlist, `structure.md` and the design file table updated | `src/storage/` |
| `load` writes only data that `migrate` or `freshProgress` just produced, so it needs no `save` | No action: this is what keeps `saveClear.js` importing `store.js` without a cycle (design 15) | `store.js` |
| `store.test.js` is 249 lines, one under the hard cap | No action: approved; the second half is `storeHelpers.test.js` (renamed from `storeActions.test.js`) | `src/storage/` |
| The corrupt copy cannot be written | Fixed: nothing is touched, the game runs in memory with `persist` false, and the notice is `blocked`, so a notice never promises a copy that does not exist. Req 2.3 and design 10 updated | `store.js` |
| Fresh progress is written right after a good copy | No action: approved, so the corrupt notice does not repeat on every load | `store.js` |
| `save` refusing invalid progress looked like a full disk | Fixed: it returns `reason: "invalid"` or `"storage"`, and a test shows a bug cannot pass as a full disk. Req 5.2 and design 11 updated | `saveClear.js` |
| An upgraded save that cannot be written | Fixed: it still loads and returns `saveFailed`. Req 2.4 and design 12 updated | `store.js` |
| `migrate(value, now)` takes the clock; `clear` returns `persist` | No action: approved, design 13 and 14 | `migrate.js`, `saveClear.js` |
| The fresh shape was written twice (`migrate.js` and `store.js`) | Fixed: `freshProgress` lives in `migrate.js` only and `store.js` re-exports it; tests check it is the same function and that an upgrade starts from it | `migrate.js` |
| A version 0 upgrade keeps only rounds that pass the contract | No action on the design (no real player has a v0 save). But it was lossy with no copy; see the reviewer rows below, where `load` now keeps the original text first | `migrate.js` |
| `window.localStorage` itself can throw when a browser blocks storage | Deferred to Block 6: the caller wraps the lookup and passes `null`, which `load` already treats as blocked | Block 6 |
| `vet` imports `dayStreak` and the contract's mode list | No action: approved, so the leap-year logic and the mode list each exist once | `vet.js` |
| Deeply nested JSON would make path strings cost quadratic time | Fixed: paths are linked and turned to text only when a problem is reported; a 100,000-level test passes | `vet.js` |
| My `__proto__` test used `Object.assign`, which sets the prototype instead of creating the key, so it never built what it meant to | Proven: the property test caught it. Tests now use `defineProperty` for own `__proto__` keys | `vet.test.js` |
| fast-check made null-prototype objects and `-0`, so round-trip equality failed on test data, not on code | No action: the settings generator now passes through a JSON round trip, as real settings do | `exportImport.test.js` |
| While splitting `store.js` I briefly dropped the integer check on `schemaVersion`, so `"9" > 1` would call a damaged save "newer" | Fixed and Proven: restored before the tests ran, then a test added for `"9"`, `"2"` and `[9]`; removing the check makes it fail, and the restored file's hash matched | `store.js`, `storeHelpers.test.js` |
| `exportText` throws on invalid or oversize progress | No action: approved. A backup that cannot be restored is worse than none | `exportImport.js` |
| The Settings click must handle that throw | Deferred to Block 6: wrap the click | Block 6 |
| The 2 MB import limit is checked against a compact export (my estimate: a save with ghosts for 14 mode and pack pairs is about 1.3 MB; not measured) | Deferred to Block 13: recheck the limit when ghosts are saved | Block 13 |
| `importText` accepts a leading byte order mark | No action: approved; Notepad adds one | `exportImport.js` |
| `record` first threw on a round it had already recorded | Fixed: it ignores a duplicate (same id) and returns the same progress, so a double-fired results screen cannot crash or double count. Req 4.4 and design 16 updated. A round with no id is a TypeError, so it cannot be mistaken for a duplicate | `record.js` |
| `record` only sees ids still among the last 200 rounds | No action: documented; a double-fire cannot reach an id that old | `record.js` |
| `record` stored the caller's result object | Fixed: it stores a `structuredClone`, with a no-shared-object test. Req 4.5 | `record.js` |
| The results screen needs "new best" and the new milestones | Deferred to Block 11: `record` returns only the progress. Today they can be derived (`after.bests !== before.bests`, and the milestone list's growth), documented in the function | Block 11 |
| `record.test.js` imports `vet` from storage | No action: approved; only the test does, the engine source imports no storage | `record.test.js` |
| `record.test.js` is 247 lines and `migrate.test.js` 226 | No action: each tests one file and both are under 250 | n/a |
| Earlier Deferred-to-Block-4 rows: Block 1 "validate.js is Node only", Block 2 `keyDeltas` key length, Block 3 `bests` keys, `lastDay` format, "nothing calls `updateDayStreak`", reviewer finding 5, and the old-schema fixture note | Fixed: each row above now says Fixed in Block 4 and names what fixed it | earlier entries |
| Block 1 row "No check that `packId` points at a real pack" | No action: still outside the contract. `vet` does not check it either | n/a |
| Import failure reasons shown on the screen could leak text from inside a hostile file | Proven: a test feeds hostile files and checks no braces, `__proto__` or field names leak into the reason | `exportImport.test.js` |

### Block 4 reviewer findings and decisions (Nov 11 2026)

| Flag | Status | Where |
|---|---|---|
| Reviewer 1 (Medium): a version 0 upgrade overwrote the original save with no copy and no notice | Fixed: before `load` writes an upgraded save it copies the raw text to `deadkeys:v1:corrupt`. If that copy cannot be written, nothing is touched, the upgraded progress runs in memory and the notice is `blocked` (as Req 2.3). A good upgrade shows no notice. Req 2.4 and design 17 updated; tests: copy comes first (call order), copy failure leaves the original, a current-version save is not copied | `store.js`, `storeHelpers.test.js` |
| The upgrade copy shares the one corrupt slot, so it replaces an earlier damaged copy the player never downloaded | Known limit: same one-slot limit as below | `store.js` |
| `importText` with an older backup also drops data | No action: the backup file is still on the player's disk | `exportImport.js` |
| Reviewer 2: `save` cannot refuse to write when `persist` is false; the rule lives in the caller | Deferred to Block 6: the caller must not call `save` when `persist` is false, and Block 6 adds a test for it | Block 6 |
| Reviewer 3: design decision 4 says the one-slot corrupt copy is a known limit, but the notes had no row | Known limit: one slot. A second damaged save replaces the first copy, so a player who ignores the notice twice loses the first copy. Tested (`store.test.js`) | `store.js` |
| Reviewer 4: the import failure reasons are new copy that Shara has not approved word for word | Deferred to Block 6: all five reason strings are listed in `requirements.md` under "Reasons (Shara to approve)", to approve when the screen shows them | `requirements.md` |
| Reviewer 5: `importText` found the "newer version" case by matching the start of a message | Fixed: `migrate` failures carry a `code` (`notASave`, `newer`, `noPath`, `badStep`, `stepFailed`, `format`, `unsafe`) and `importText` reads it. Test: every failure has its code. Proven: with the newer-version message reworded, all 14 import tests still passed, and the restored file's hash matched. Req 6.4 and design 18 | `migrate.js`, `exportImport.js` |
| Reviewer 6: `load` called `migrate` outside a try/catch | Fixed: a throw means a damaged save and takes the corrupt path. `load` has an optional third argument (the migrate function) that only tests pass, to prove it. Design 19 | `store.js` |
| Reviewer 7: `record` returns a shallow copy, so `settings`, `ghosts` and `lessonsPassed` are shared with the input | No action: nothing mutates progress, and the engine is pure | `record.js` |
| Reviewer 8: two tabs both save the whole Progress, so the last writer wins | Deferred to Block 6: consider listening for the `storage` event | Block 6 |
| The spike (Req 1.1 and 1.2) rested on the notes, with no automated test | Fixed and Proven: a test reads every import specifier in `schemas.js`, `validate.js`, `rules.js` and `types.js` and fails on any `node:` or bare Node module name. Two throwaway mutations (`import ... from "node:fs"` and `from "fs"` added to `schemas.js`) both failed it, and the restored file's hash matched. It also covers the three files besides `schemas.js` that the browser build loads | `contract.test.js` |
| `migrate.test.js` is now 247 lines, `storeHelpers.test.js` 165 | No action: under 250. `store.test.js` stays at 249 (one assertion changed in place) | n/a |
| When the upgrade copy fails, `load` returns the upgraded progress in memory (not fresh) | No action: Req 2.3 returns fresh progress because the damaged text is unreadable, but here the upgraded data is good and the player can still see it. `persist` is false, so nothing is written over the original | `store.js` |

Block 4 ends with 279 tests, lint clean (107 files), checker 42 of 42, nothing over 250. Tagged `block-4`.

## Nov 11 2026: Block 6, shell screens, flags so far (tasks 1 to 5)

Pinned, exact, installed with `--before=2026-10-29` so every package in the tree is at least two weeks old: `@fontsource/jetbrains-mono` 5.3.0, `@fontsource/roboto-condensed` 5.3.0, `@playwright/test` 1.64.1, `@axe-core/playwright` 4.14.0, `vercel` 65.5.0. Engines raised to `>=22.12` (axe needs it).

| Flag | Status | Where |
|---|---|---|
| `npm audit` after the install: 37 vulnerabilities (1 critical, 21 high, 15 moderate), all inside the `vercel` CLI's own dependency tree (`tar`, `zod`, `undici`, `js-yaml`, `minimatch`, `path-to-regexp`, `smol-toml` and the `@vercel/*` packages). Nothing from Playwright, axe, the fonts, Vite, Biome or fast-check. `npm audit --omit=dev` finds 0 | Deferred, Nov 11: accepted for now. It is dev-only, nothing ships, and the CLI only reads our own files. On or after **Nov 23 2026**, upgrade `vercel` to 65.14.0 (or the newest fixed version that is at least two weeks old), then re-run `npm audit`. No `overrides` | `package.json` |
| `npm ls` shows five "extraneous" packages (`@emnapi/wasi-threads`, `@napi-rs/wasm-runtime`, `@tybys/wasm-util`, `tslib`, `undici-types`) | No action: traced with `npm explain` and the lockfile. All are optional dev packages: the wasm fallback helpers for Vite's bundler (rolldown) and the oxc tools, plus type definitions | `package-lock.json` |
| OFL license text did not ship in `dist/`, though design 1 says it does | Fixed: the two texts are in `public/licenses/` (byte-identical to the packages, checked by a test), served from our own origin. About credits both fonts with a link in task 11. `public/licenses/` added to the allowlist | `public/licenses/` |
| The build ships the legacy `.woff` files as well as `.woff2` (about 95 KB more than needed) | Deferred to Block 16 | `dist/` |
| Export failed with no approved notice | Fixed: new `exportFailed` notice, "We couldn't make a backup file just now. Your progress is still saved in this browser. Try again in a moment." Button "Try again". In the design copy table and tested word for word. Also shown when the old-data download is refused | `notices.js`, `backup.js` |
| Clear would delete a newer-version save the app refused to touch | Fixed: the app remembers a newer save (`state.newerSave`) and the Clear confirm adds "This also deletes progress saved by a newer version of Dead Keys." (in the copy table; the dialog is task 6) | `app.js` |
| Defaults the spec did not give: AI drills, finger colors | No action: approved. AI drills off (data leaves only on opt-in), finger colors on (PRD G7) | `settings.js` |
| Settings clean-up on load: a bad field gets its default, unknown fields are dropped | No action: approved | `settings.js` |
| The old reasons table in the storage requirements still showed the draft wording | Fixed: a pointer says it is superseded by the shell design's copy table | `.kiro/specs/storage/requirements.md` |
| `appTestKit.js` sits in `src/ui/` | No action: approved, as long as nothing in the build imports it. It is imported only by `*.test.js`; `main.js` never reaches it | `src/ui/` |
| The `!important` in the reduced-motion reset tripped Biome | Fixed: three `biome-ignore` comments with a reason | `base.css` |
| My safety scan flagged the word `srcdoc` inside the list in `dom.js` that bans it | Fixed: the scan now looks for assigning `.srcdoc` | `safety.test.js` |
| `app.js` reached 175 lines | Fixed: the backup actions moved to `backup.js` (129 and 81 lines) | `src/ui/` |
| `dismissPrivacy` used `this`, which breaks if a screen passes the method on | Fixed: the app object refers to itself by name | `app.js` |
| Proof the "nothing written while persist is false" guard works | Proven: with the guard removed, three tests fail (the example and the random-play property); the restored file's hash matched | `app.test.js`, `appSync.test.js` |

## Nov 12 2026: Vercel from the IDE, first deploy (Block 6 task 14)

Driven with the pinned Vercel CLI 65.5.0 through `npx` in Kiro's terminal. Shara was already signed in as `earlgreyhot1701d` and confirmed it was the right account and team. No secrets were typed, read or printed by the agent.

What ran, in order:

| Step | Result |
|---|---|
| `npx vercel whoami` | `earlgreyhot1701d`. Shara confirmed the account before anything else ran |
| `npx vercel link --yes --project dead-keys` | Created the project `dead-keys`, wrote `.vercel/` (git-ignored) and an `.env.local` holding a Vercel OIDC token (matched by the existing `.env.*` ignore rule, and blocked from the agent by `.kiroignore`; never read) |
| `npx vercel git disconnect --yes` | See the first surprise below |
| `npx vercel deploy` (no `--prod`) | Built on Vercel (Vite, `dist/`), ready in 12 s |

Preview URL (deployment-specific, behind Vercel sign-in): https://dead-keys-cfyvom22k-earlgreyhot1701ds-projects.vercel.app

Three surprises, each logged with its status:

| What happened | Status | Where |
|---|---|---|
| `vercel link --yes` connected the GitHub repo to the project, so a push to `main` would have deployed to production. That breaks "production deploys only on Shara's instruction" | Fixed: disconnected right after linking, before any push. Reversible with `vercel git connect`. Production deploys stay manual (Block 16) | Vercel project settings |
| `vercel link` appended `.vercel` and `.env*` to `.gitignore`. The new `.env*` line comes after `!.env.example` and would have ignored the example file again | Fixed: reverted with `git checkout -- .gitignore`. The original rules already cover `.vercel/` and `.env.local`. Not committed | `.gitignore` |
| **Vercel put the first deployment of a new project in Production even without `--prod`.** Its rule: the first deployment of a project becomes production. So `https://dead-keys.vercel.app` is live and public (HTTP 200), though the deployment URL above is protected (HTTP 302 to sign-in) | **Open, needs Shara's decision.** What the public page serves: the Block 6 shell build, same asset hashes as the local build, no fixture ids in it (`check-build` clean before the deploy, and `round-001` is absent from the live JS), no secrets, no AI route, no analytics. Options: (a) leave it, (b) remove the production deployment so the alias goes dark, which also means the next deploy would again be a "first" one and need `--prod` handled deliberately, (c) turn on Deployment Protection for production in the dashboard if the plan allows | Vercel project `dead-keys` |

Lesson for the write-up: the CLI said "Deployed to production" only after the fact. Before the first `vercel deploy` on a new project, create the project and set its production branch rules first, or expect the first deploy to be public. `vercel link --yes` also takes actions (Git connection, `.gitignore`, a token file) that the command name does not suggest.

## Nov 12 2026: Block 6, shell screens, flags from tasks 6 to 13

Built: router and notice bar, confirm dialog, title, menu, privacy card, keyboard heat map, progress, settings (with the data section), How we count, About, the build check, the `a11y-auditor` agent, and Playwright with axe. At task 13: `npm test` 480 of 480, `npm run test:e2e` 26 of 26 (axe: 0 violations on every screen), `npm run lint` clean (160 files), checker 42 of 42, `check-build` clean. No source file over 150 lines (largest `router.js`, 149); nothing over 250.

| Flag | Status | Where |
|---|---|---|
| `screens.css` reached 277 lines, over the hard cap. The line-cap hook printed it; I had read only the last three lines of the `linecap` output and said all was well | Fixed: split into `screens.css` (shared), `title.css`, `menu.css`. Lesson: read the whole output, not the tail | `src/styles/` |
| Phone notice wording | Fixed: approved word for word and tested against the design table | `phoneNotice.js` |
| "Dismiss" button was unapproved chrome | Fixed: now "Got it" (approved) on the notice bar. The phone notice got its own "Got it" button that hides it for the visit and moves focus to the heading | `noticeBar.js`, `phoneNotice.js`, `router.js` |
| Progress, settings, import, Clear, How we count and About copy | Fixed: every line approved by Shara, listed in the design copy table, tested word for word against it (no DRAFT rows left) | `design.md` |
| Personal bests showed internal mode names and no date | Fixed: "Four corners: 30 WPM, set Nov 11" | `progress.js` |
| Keycaps for shifted characters and accented letters | Deferred: shifted keys to Block 8 (capitals lesson), accents to Block 15 (Spanish pack). Their stats still count in the diagnosis | `keyboardLayout.js` |
| Privacy card and How we count say Vercel Web Analytics counts visits, which is not wired until Block 16 | No action: they describe the shipped game and the preview is private (but see the Open production item above) | `privacy.js` |
| `exportFailed` also used when the old-data download fails | No action: approved | `backup.js` |
| Keyboard detection for the phone notice is best-effort | No action: approved. It only ever hides a notice | `phoneNotice.js` |
| `fakeDom.js` and `appTestKit.js` live in `src/ui/`; `fakeDom` has no live `textContent`; `withFakeDocument` restores `document` at the first `await` | No action: approved. Async tests use a local helper | `src/ui/` |
| Notice slot sits outside `<main>` | No action: axe, using its full default rule set, reported no "region" issue | `router.js` |
| Axe cannot judge text over a gradient or single characters (one "needs review" color-contrast item per screen) | No action: the scanlines only darken the ground (token pairs already tested); the keycaps are covered by `keyboardContrast.test.js` | `src/styles/` |
| Keycap pattern contrast | Fixed and Proven: the new test failed the shaky amber dots (45% strength gave 3.34:1); lowered to 30% and every band now passes 4.5:1 | `keyboard.css`, `keyboardContrast.test.js` |
| e2e found: after Clear everything or an import, focus fell to the page body (the screen redraws and the buttons had no `data-focus-id`) | Fixed: buttons and the file input carry `data-focus-id`; an e2e step checks focus returns | `settingsData.js` |
| e2e found: Escape from the menu after the first-run privacy card went back to the card | Fixed: `nav.replace()` and `ctx.replace()`; Continue uses it. Approved by Shara as Block 6's own bug | `nav.js`, `router.js`, `privacy.js` |
| Proof that Clear asks before it clears | Proven: a throwaway mutation (call `clear()` while building the dialog) failed a test. My first run of the mutation was invalid because the test and the restore ran in parallel; redone in sequence, and the restored file's hash matched | `settingsData.test.js` |
| Lock rule on "How we count" said nothing about Escape | Fixed: "Escape drops the lock. If nothing is locked, Escape pauses." (the layered rule decided Nov 11) | `howWeCountText.js` |
| "How we count" leaves out rules whose code is not built | Deferred: each block adds its own rule and config number. Block 8: lesson pass (95%) and the speed-dip notice. Block 9: how drills are chosen. Block 12: the daily drill. Approved for the preview | `howWeCountText.js` |
| Three hand-written numbers on that page: five characters to a word, at most three sentences, six practice keys (the engine hard-codes them) | Closed in Block 7 (task 2): `CHARS_PER_WORD`, `MAX_SENTENCES` and `MAX_WEAK_KEYS` are in config and the page reads them; a test ties 3 and 6 to the contract | `config.js`, `progressConfig.js`, `howWeCountText.js` |
| About has no Tally feedback link (the form has no URL yet) | Deferred to Block 16: Shara will make the form | `about.js` |
| `check-build.test.js` and `keyboardContrast.test.js` were not named in the tasks | No action: approved and added to the allowlist record | `docs/current-block.md` |
| `a11y-auditor` has `read` and `shell` tools | Fixed: a permission rule allows only `npm run test:e2e` and `npm run build`, and the prompt says the same. **Known limit:** not tested at runtime, so whether other commands are blocked or only ask first is unverified | `.kiro/agents/a11y-auditor.md` |
| Playwright wrote `test-results/` into the repo | Fixed: `outputDir` points into `node_modules/.cache` (already ignored); `.gitignore` untouched. Approved | `playwright.config.js` |
| Chromium for Playwright 1.64.1 | No action: the matching builds were already installed by other projects, so nothing was downloaded | n/a |
| Test files over the 150 soft cap: `settingsData.test.js` (206), `app.test.js`, `appSync.test.js`, `confirmDialog.test.js`, `menu.test.js`, `dom.test.js`, `contrast.test.js` | No action: each tests one source file and all are under 250. `scripts/check-fixtures.js` is 151 | n/a |
| `npm audit`: 37 findings, all in the `vercel` CLI tree | Deferred (unchanged): upgrade on or after Nov 23 2026, then re-run `npm audit` | `package.json` |
| Legacy `.woff` files in the build (about 95 KB extra) | Deferred (unchanged): Block 16 | `dist/` |
| Vercel's first deploy went to production | Open: see the task 14 entry above; needs Shara's decision | Vercel project |

### Block 4 deferrals closed in Block 6

| Deferred from Block 4 | Status | Evidence |
|---|---|---|
| `window.localStorage` can throw: the caller must wrap the lookup | Fixed | `app.js` wraps the lookup in try/catch and passes `null`; `app.test.js` covers a throwing and a missing lookup |
| `exportText` throws on invalid or oversize progress: the Settings click must handle it | Fixed | `backup.js` catches it and shows the `exportFailed` notice; tested; the Download backup button in Settings only announces on success |
| `save` cannot refuse to write when `persist` is false: the caller must not call it, with a test | Fixed and Proven | `app.js` never saves while `persist` is false; with the guard removed three tests fail, restored hash matched |
| Two tabs both save the whole Progress: consider the `storage` event | Fixed | `app.js` listens for it, stops saving and shows the `otherTab` notice with a Reload button; `appSync.test.js` and an e2e test with two pages |
| Import failure reasons need Shara's word-for-word approval | Fixed | The five reasons are in the shell design copy table, approved, and tested word for word; the old table carries a "Superseded" pointer |

Block 6 pattern worth writing up: the tests that mattered most were the ones that looked at the real browser. Unit tests had passed for the focus loss, the Escape path and the dot contrast, and the e2e run and a contrast calculation found all three.

## Nov 12 2026: Block 6 gate FAIL, and why the screens didn't match the mock

Both reviewers recommended FAIL (title-screen keyboard bug and a set of a11y and test gaps), and Shara failed the block. The bigger finding was hers: the built screens do not look like the locked design.

| Finding | Status | Where |
|---|---|---|
| **Spec gap (Claude's):** `mock/index.html` was listed in the spec only as a reference. No task said to match it, and the PASS line had no visual check, so Kiro built a plainer version of each screen and every check still passed | Fixed in the process: `mock/index.html` and `docs/design-brief.md` are now the spec for how every screen looks. The PASS line adds "Each screen's 1440x900 screenshot matches its mock screen, side by side, approved by Shara." Screenshots of both are saved to `docs/screens/` | `docs/current-block.md` |
| `https://dead-keys.vercel.app` went live when Vercel made the project's first deployment production | **Production live by Shara's decision, Nov 11.** Left as it is | Vercel project |
| How to stop it happening again | Fixed: every deploy uses `--environment=preview` (CLI 65.5.0; `--prod` is shorthand for `--environment=production`) through `npm run deploy:preview`, which runs `check:build` first. Vercel's community forum notes the first-deploy rule applies even with a preview target, so the flag alone would not have saved the first one; now that a production deployment exists, previews stay previews. Nothing goes to production without Shara's word | `package.json` |

Lesson for the write-up: a green test suite can only check what the spec asked for. "Looks like the mock" was never written down, so nothing tested it, and two reviewers who read the spec didn't raise it either.

## Nov 12 2026: fix round, screens rebuilt to the mock, two preview deploys

| Deploy | Command | Result |
|---|---|---|
| a11y and reviewer fixes (`3da3ce7`) | `npm run deploy:preview` | Preview, https://dead-keys-gpzw3v7f3-earlgreyhot1701ds-projects.vercel.app. `vercel ls` lists it as Preview; production untouched |
| Screens rebuilt to the mock (`dc822b9`) | `npm run deploy:preview` | Preview, https://dead-keys-oforax22n-earlgreyhot1701ds-projects.vercel.app. Listed as Preview; production (`dead-keys.vercel.app`, Nov 11 build) untouched |

Both ran `check:build` first (clean: 13 files, 216 fixture ids, 32 sample strings).

| Flag | Status | Where |
|---|---|---|
| Title, menu and progress did not look like the locked mock | Fixed: rebuilt from the mock's markup, value for value; settings, privacy, How we count and About restyled in the same panel system. Screenshot pairs in `docs/screens/`, compared by Kiro, differences listed in the report | `src/ui/`, `src/styles/` |
| Mock items that were not true today | Fixed by Shara's Nov 12 calls: demo controls, sound button, "first run" labels, SHIELD, CAPACITOR, word codes, KEY_ codes, SESSION, ROOT_OP, "+4 THIS WEEK", "LAST: 34", "BEST: 7", "LEFT PINKY" left out; each returns in the block that makes it true | `title.js`, `menu.js`, `progressPanels.js` |
| The mock's 55% shaky dots fail 4.5:1 for the cap's letter | Fixed and Proven: 45% in the build; `keyboardContrast.test.js` checks every band's letter on its fill and its brightest pattern pixel, and a test shows 55% fails | `heatBands.css` |
| The mock's chart and icons are SVG; `dom.js` bans svg | Fixed: a separate safe builder (`svg.js`: svg, path, rect, circle; fixed attributes; every value checked), with tests that refuse script, text, links, events and bad values | `src/ui/svg.js` |
| The title strip sat outside any landmark (axe "region", moderate) | Fixed: both bars sit in the page's `<header>` | `chrome.js` |
| New CSS reached 307 lines in one file | Fixed: split by concern, every stylesheet under 150 | `src/styles/` |
| The mock's chart labels are SVG text, not allowed in the builder | Known limit: gridline labels are HTML text placed over the chart; x labels are OLDEST and LATEST instead of every few rounds | `speedChart.js` |

## Block 6 final round (Nov 11, evening): made by Claude in a copy of the repo, to save Kiro credits

Shara asked Claude to make this round's changes directly, then have Kiro review, commit and deploy. Claude worked in a copy of the repo at ebf924d, ran `npm test`, `biome check .`, the full Playwright suite (with axe) and the screenshot spec there, then wrote the changed files back. Kiro has not run anything yet for this round.

| Item | What changed | Status |
|---|---|---|
| Way home | Every page but title, menu and the first-launch privacy card has a "Main menu" button; the wordmark goes home too (screen-reader name "Dead Keys // Terminal 84 (main menu)", no aria-label, so WCAG 2.5.3 holds) | Fixed |
| No page scrolls | New `src/ui/fit.js`: from 1100x600 up to 1440x900 the page is drawn at the design size and zoomed as one piece; below that it reflows, so browser zoom and text resize still work. How we count is three columns. Progress's right column is capped at 480px so the chart keeps its size on wide screens. e2e checks 1440x900, 1366x768 and 1280x720 | Fixed |
| Known limit of fit | Browser zoom from 100% to about 130% on a 1440x900 screen is absorbed by the fit; past that, the page reflows and text grows | Known limit |
| Privacy | Panel centered vertically | Fixed |
| Settings | "Not built yet" under Sound, Speed, Finger colors and AI drills, tied by aria-describedby; still saving | Fixed |
| Chart title | "SPEED // LAST n ROUNDS", n real | Fixed |
| Title footer | "Progress isn't being saved right now." while not saving | Fixed |
| Settings save failure | New `settingsFailed` notice instead of "That round didn't save" | Fixed |
| Clock | Removed (auto-updating with no stop, WCAG 2.2.2); `src/ui/components/clock.js` deleted | Fixed |
| Menu focus | Every item has the focused box size, so the list never shifts | Fixed |
| Link buttons | At least 24px | Fixed |
| Future buttons | Pressing "Drill these keys" or "Lessons" says "<label>: not built yet" | Fixed |
| e2e | `fit.spec.js` (no scroll at three sizes, the way home), `failures.spec.js` (blocked storage, refused download) | Fixed |
| Screenshots | 1366x768 set added (`built-<screen>-1366.png`) | Fixed |
| Privacy-card claims, scanline contrast, build check short strings, Vercel rebuild, menu screenshot focus | Shara's decisions and eye checks | No action |
| Lockfile out of sync | `npm ci` failed: @emnapi/core and @emnapi/runtime 2.0.0-beta.2 were missing from package-lock.json (the "extraneous" packages from Block 6 task 5). Vercel runs `npm install`, so deploys worked, but `npm ci` did not | Fixed (Kiro, Nov 12): `npm install` refreshed the lockfile (it dropped 11 stale `"peer": true` lines; no package added or changed), and `npm ci` now succeeds (exit 0). npm still does not write the two @emnapi packages: they are optional peers of the extraneous wasm fallback `@emnapi/wasi-threads`, which this Windows install never uses, so `npm ls --all` still lists them as unmet under that helper |

## Nov 12 2026: Block 7, Shara's decisions after playing falling words (running list for task 13)

| Flag | Status | Where |
|---|---|---|
| `src/render` imports `crtOn` and `svg` from `src/ui` | No action (Shara): logged | `falling.js`, `playHud.js` |
| Kiro's guard blocked `git push` and the preview deploy | Shara pushes and deploys herself from here on | n/a |
| US English pack: SCOWL en_US list (ESDB, wordlist-diff commit 7f2f407, MIT-like notice) kept in `packs/source/`; the build stops on any word not in it | Done: removed labour, centre, der, des, les, pre, und, von | `build-pack.js`, `blocklist.txt` |
| Tasks 7 to 10: mock elements the map does not name, handled the way the map handles their kin | Shown for Shara in the screenshot pairs (`docs/screens/`), with the gameplay she approved Nov 12 (corners SOUND dropped as on falling; core ghost kept as part of "the core"; results SOUND and drill badge dropped; "// BUFFER STATUS: DUMP_COMPLETE ::", "[ STAT_0n ]", "[ RECORD ]", "MILESTONE:", "INTERCEPTED WORDS / WORD LOG" kept as mock flavor; "[+3 WPM]" and "STREAK: 3" dropped; the accuracy panel titled "ACCURACY" without "VS PASS LINE"; "STATUS: NOT SAVING" when the round was not saved) | `results.js`, `resultsPanels.js`, `cornersHud.js` |
| `round.js` passed 150 lines at task 10 | Split into `src/render/stage.js` (field, HUD, moments, word log), inside the `src/render/**` allowlist | `stage.js` |

### Block 7: Playtest fixes (Claude, Nov 12; approved by Shara)

Claude made these directly in the repo after Shara played the preview. Kiro ran the reviewer on the uncommitted diff only, then every check, then committed.

| Fix | Where |
|---|---|
| Unique first letters on spawn: a new word never shares a first letter with one on screen; when none is free, spawn waits | `targets.js`, `targets.test.js` |
| Backspace lets go of a locked word (Escape's first layer); unlocked, it does nothing and never pauses | `round.js` (screen), `round.test.js` |
| Footer hints: "LOCKED: [BKSP] OR [ESC] LETS GO" while locked, "CAPS LOCK IS ON" read from each key press | `playHud.js`, `cornersHud.js`, `playStation.css` |
| Starting speed on the picker and in Settings, with a WPM pace line ("About N WPM keeps up") | `pace.js`, `play.js`, `settings.js` |
| New curve: 1× is about 30 WPM at wave 1, +5% per wave up to wave 10, +1 word on screen every 3 waves | `config.js`, `targets.js`, `pace.test.js` |
| 3-word warm-up that never costs a life ("WARM-UP · n LEFT", then "Warm-up done. Wave 1.") | `lifecycle.js`, `round.js`, `announce.js`, `warmup.test.js` |
| Spaces are never a miss, locked or not | `round.js` (engine), `deferrals.test.js` |
| Scanlines moved behind content | `chrome.css` |

Reviewer (read-only, ran without a shell, so it estimated line counts and could not see the diff): no High findings. Its Medium items, checked by Kiro afterwards:

| Reviewer flagged | Status | Where |
|---|---|---|
| Changed files might be outside the allowlist | Checked: all 29 are on the allowlist; `title.js` is untouched | `git status` |
| Line caps likely exceeded | Checked: `linecap.js` warns only on `check-fixtures.js` (151, from Block 1) | n/a |
| Scanline z-index change could shift overlaps (wave banner vs locked card) | Open: e2e and axe pass; the screenshot pairs (task 12) will show it | `chrome.css` |
| `requirements.md` drift: Req 8.1 says wave 12 (code: 10), Req 8.2 says a space "with no word locked" (code: any space), Req 4.3 does not mention Backspace letting go | Open: for Shara (spec text, not code) | `requirements.md` |
| Unique first letters had no test | Checked: two tests exist (never shared; spawn waits when none is free) | `targets.test.js` |

Second round of playtest fixes (Claude, Nov 12; approved by Shara): Backspace no longer lets go (typo habit dropped words); strict-but-clear misses with an amber letter; footer coaching; results Main menu button.

| Reviewer flagged (second round) | Status | Where |
|---|---|---|
| Results "Main menu" button label has no copy-table row (it reuses chrome.js `MAIN_MENU`) | Open: for Shara | `design.md`, `results.js` |
| `round.test.js` header still says "Backspace letting go" | Open: comment only | `round.test.js` |
| Falling cards now cache `c.cls`; anything still reading `c.locked` / `c.danger`? | Checked: nothing does | `src/render/` |

Third round (Claude, Nov 12; approved by Shara): Wrong key shown in red, waiting letter amber, Backspace clears the red key only; footer coaching; results Main menu button. Block 8 note: first-visit nudge 'New to typing? Start with Lesson 1.'

| Reviewer flagged (third round) | Status | Where |
|---|---|---|
| Req 4.3, 7.4, 8.1, 8.2 not in the diff | Checked: 7.4, 8.1 and 8.2 landed in `92070fa` and match the code; Backspace clearing the red key is in Req 5.1; 4.3 ("never reaches `key`") is still true | `requirements.md` |
| Test gaps: `backspace` while paused, held, ended; corners card, input stream and corners buffer red key; "<" as the key; `wrong` absent from `toResult` | Open: for Shara | `wrongKey.test.js`, `playHud.test.js` |
| `round.js` key map `{ Escape, Backspace }[e.key]` reads the prototype ("toString", "__proto__") | Open: one-line `Object.hasOwn` fix, for Shara | `src/ui/screens/round.js:130` |
| A wrong space key may collapse in the card | No action: Req 8.2 ignores every space, so a space is never the wrong key | n/a |

Fourth round (Claude, Nov 12; approved by Shara): Wrong key shown red, waiting letter amber, Backspace clears it; footer coaching; leftover letters of a landed word swallowed (one lost word was costing two); breach flash; results Main menu button. Block 8 note: first-visit nudge 'New to typing? Start with Lesson 1.'

| Reviewer flagged (fourth round) | Status | Where |
|---|---|---|
| The swallow survives Continue: `resolveOutOfLives` spreads `...state` and never clears `lostTail`, so the first key matching the old tail is eaten in the fresh screen (held time adds no `activeMs`) | Fixed (Nov 12): `resolveOutOfLives` sets `lostTail: null`, with a test | `src/engine/lifecycle.js`, `lostTail.test.js` |
| Breach edge may be hidden under the field's children | Checked: not hidden. Set by hand in a browser, the coral edge shows clearly around the falling field | `playMoments.css` |
| a11y.md says reduced motion means "no flash"; the breach edge is a static color for 400 ms with no movement, so it shows under reduced motion too | Decided by Shara (Nov 12): the breach edge stays under reduced motion; it is one 400 ms color change, not repeated flashing | `playMoments.css` |
| Swallow can eat a key the player meant, when a new word starts with the tail's next letter | No action: inherent to the design, up to 1.5 s | `lostTail.js` |
| Escape and pause do not end the swallow (it is 1.5 s of active play, since time only runs in `tick`) | Fixed (Nov 12): `pause` and `pressEscape` with nothing locked clear it, with tests | `lifecycle.js`, `round.js`, `lostTail.test.js` |
| Test gaps: breach on `lifeLost` and not on a warm-up landing; swallow after a warm-up landing, Escape, pause, Continue, a part-swallowed tail then a non-matching key | Open: for Shara | `moments.test.js`, `lostTail.test.js` |

Fifth round (Claude, Nov 12; approved by Shara): the locked card's top bar reads 'TYPE "<letter>" TO FIX' while a wrong key shows; `lostTail` cleared on Continue and on pause. Decided by Shara: new players start at 0.7× so beginners are not discouraged (saved speeds are unchanged; `src/storage/settings.js` DEFAULTS, one change on the allowlist).

| Reviewer flagged (fifth round) | Status | Where |
|---|---|---|
| Fix-bar copy tested thinly: only "x" against "b"; no quote, "<", capital, or `wrong: false` case; nothing pins the revert | Fixed (Nov 12): tests for a capital, "<", and the bar back to normal once cleared | `hud.test.js` |
| `lockBar` indexes the waiting letter by code point, the rest of the HUD by UTF-16 unit (differs only for astral characters; no pack has any) | Open: for Shara | `src/render/hud.js` |
| `config.js` comment still says the speed default is 1 | Fixed (Nov 12): it says new players start at 0.7 | `src/engine/config.js` |
| Escape that only drops a lock, and resume, leave `lostTail` alone (untested) | No action: safe, since `key()` drops a tail before it locks and a pause already cleared it | `lostTail.test.js` |
| Diff showed mojibake in ×, ═, ✓ | Checked: only in the exported diff file; the sources are UTF-8 | n/a |

Sixth round (Claude, Nov 12; approved by Shara): falling ship slides to the locked lane (Shara, Nov 12). It uses the locked card's x (`cardX`), keeps its last lane when the lock drops, slides over 180 ms, and jumps under reduced motion. One lint fix (the `shipAt` assignment on its own line) went in before the commit.

| Reviewer flagged (sixth round) | Status | Where |
|---|---|---|
| Edge lanes 0 and 5 not checked in the `shipX` test | Fixed (Nov 12): both asserted | `falling.test.js` |
| Beam snaps to the new lane while the ship takes 180 ms to follow (they agree at rest) | Accepted (Shara, Nov 12) | `falling.js`, `playFalling.css` |
| The write-only-on-change `--ship-x` path is untested (the fake page has no `style`) | Accepted (Shara, Nov 12) | `falling.js` |

### v2 list (from the playtest)

- Per-corner shields in Four corners.
- A WPM-labelled speed slider.
- Fair spawns for long words.
- Highest wave on results.
- Rename the HUD's SPEED to YOUR WPM.
- Escape labels in the pause and out-of-lives dialogs.

## Nov 12 2026: Block 7, play, close-out (tasks 11 to 13)

Built in Block 7: the 1,500-word US English general pack; the mode picker with Starting speed; Falling words (six lanes, the ship under the locked word), Four corners, and Practice; the warm-up; the strict-but-clear lock; the three moments plus the breach edge; pause and out-of-lives dialogs; results with recording through `app.finishRound` (`src/ui/roundRecord.js`). Shara played it on the preview and approved the gameplay Nov 12.

Task 11 added `e2e/play.spec.js` (keyboard only: lock, a wrong key shown red with 'TYPE "<letter>" TO FIX', Backspace clearing it, finish and the "Cleared" announcement, in both mechanics; the ship sliding under the locked lane and staying; unique first letters on screen after the warm-up; Escape pauses and resumes; End round saves; results' Main menu, Enter and Escape; Practice ended from the pause dialog) and `e2e/playChecks.spec.js` (axe on the picker, both play screens, a wrong key, Practice, the pause and out-of-lives dialogs and results; the warm-up never costing a life; out of lives with Escape continuing; no scroll at 1440x900, 1366x768 and 1280x720). Screenshot pairs for picker, falling, corners and results, at 1440x900 and 1366x768, are in `docs/screens/` next to the mocks.

Checks at task 12: `npm test` 626 of 626, `npm run lint` clean (235 files), `npm run test:e2e` 57 passed and 28 skipped (the opt-in screenshots), checker 42 of 42, `check:build` clean, line caps exit 0 (no source file over 150; test files under 250).

Block 7 deferrals: all closed (tab-hidden `dt`, wave speed-up cap, stray space, the three How we count numbers, the settings `later-hint` rename, `pause(state)`). See the Block 2 and Block 6 rows above.

| Flag | Status | Where |
|---|---|---|
| Vercel preview toolbar binds c to comments and blocks it before the page sees it | Shara turns the toolbar off for previews. Production unaffected | Vercel project settings |
| axe moderate (not blocking): `region` on both play screens and Practice (the field is `aria-hidden` art outside a landmark), `landmark-unique` on results | Open: for the a11y-auditor | `stage.js`, `results.js` |
| Screenshots against the mocks, differences still visible: falling shows wave 1 with two or three words where the mock shows wave 4 with six; the locked card is wider than a lane; results' milestone list scrolls inside its panel when a first round earns many WPM bands, and the mock's coach note is dropped (Block 8); the picker's speed hint has a dashed rule under it from the shared `.set-row` style | Open: for Shara's visual sign-off | `docs/screens/` |
| `e2e/screenshots.spec.js` now waits for the h1 to be attached, not visible (the play screens' h1 is screen-reader only) | Done | `screenshots.spec.js` |
| A leftover preview server held port 4173 once after an interrupted run | No action: it exited on its own; e2e reran clean | n/a |

### Block 7 gate (task 14, Nov 12)

Reviewer: PASS, no High. a11y-auditor: PASS, no High (axe finds only part of the problems; full WCAG validation needs manual testing with assistive technologies). Neither agent had a shell; both used Kiro's check numbers above.

| Gate finding | Status | Where |
|---|---|---|
| Reviewer: `.kiro/steering/structure.md` and `docs/current-block.md` changed but are not on the allowlist | Checked: `structure.md` changed only in `0cd35c4` "Block 7: play spec approved", Shara's spec commit; `current-block.md` is Shara's block record | n/a |
| Reviewer: Block 7 flags still Open (copy-table row for results' Main menu, the test gaps, `round.js` prototype lookup, `lockBar` code points, a stale test comment) | Open: carried to v2 or a later block, for Shara | rows above |
| Reviewer: the breach edge under reduced motion conflicts with a11y.md "no flash" | Recorded as a deliberate exception (Shara, Nov 12): one 400 ms color change, not repeated flashing | `playMoments.css` |
| a11y: duplicate "Accuracy" landmark on results (the tile and the bar panel), axe `landmark-unique` | Open: for Shara (drop the panel's label or rename it "Accuracy bar") | `results.js`, `resultsPanels.js` |
| a11y: axe `region`: the play screens' sr-only h1 and results' h1 sit outside `<main>` | Open: for Shara (move the h1 inside a landmark) | `stage.js`, `results.js` |
| a11y: Practice has no speed control of its own (words don't move; Settings and the picker set the speed) | Open: for Shara (accept, or word the rule "every timed mode") | `round.js` |
| a11y: "Paused." and "Out of lives." are spoken by the live region and again as the dialog opens | Open: Low, for Shara | `announce.js` |
| a11y: Enter while the milestones scroll region has focus plays again; its name reads "[═]" aloud | Open: Low, for Shara | `results.js`, `resultsPanels.js` |
| PASS-line items for Shara: screenshot sign-off on the four pairs at both sizes; playing a round on the preview (gameplay approved Nov 12) | For Shara | `docs/screens/` |

## Nov 12 2026: Block 8a, lessons (letters), close-out (tasks 1 to 14)

Built in Block 8a: the ladder (Lessons 0 to 13, 0 to 6 built), fingers, the early lesson words, the seeded lesson generator, the typing-line engine, the lesson result and the pass handed to `record()`, the recommendation and its Why line, the dip notice, the desk look, the Lesson screen, the Lesson done card, the Lessons menu, Lesson 0's keyboard question, the main menu's recommended lesson panel, How we count's Lessons section, Play these keys (Claude), and the e2e and screenshots. Commits: `554dd22` (Batch A), `d25f4e3` (Batch B), `4b7c2fc` (task 11), `1df79db` (11b, Claude), `abeb634` (tasks 12 and 13, Claude's blocker fixes, WPM rounding, lockfile sync). Previews: task 11, 11b and `dead-keys-1yyuzng0c-earlgreyhot1701ds-projects.vercel.app` (`dpl_5SLB6zp8WxDW3cf5JkJV9A92UesU`, Ready). No production deploy.

Checks before the commit and deploy (Nov 12): `npm ci` exit 0; `npm run lint` clean (274 files); `npm test` 721 of 721; `node scripts/linecap.js` nothing over 250, the only source file over 150 is `scripts/check-fixtures.js` (151, Block 1); `npm run test:e2e` 67 passed, 34 skipped (opt-in screenshots and the like), 0 failed; `check:build` clean as part of `deploy:preview`.

| Flag | Status | Where |
|---|---|---|
| Lesson 0's keys are F and J; L00 never recommended for a weak key; anchors; the Check uses real words only at 6+ words; `--paper-todo` `#5f655f` (4.80:1, the mock's was 2.65:1); milestone reads "Lesson 3 passed"; the dip counts lesson rounds only | Decided: design decision 9 | `ladder.js`, `recommend.js`, `generate.js`, `desk.css`, `milestones.js`, `dip.js` |
| CSS split into `desk.css`, `deskLesson.css`, `deskDone.css`; copy in `src/lessons/copy.js`; the pill is the h1; accuracy shows `--` before the first key; Check accuracy rounds down; Again after a failed test out repeats the test out; L03 coach line from the copy table | Accepted by Shara (Batch B) | `src/styles/desk*.css`, `copy.js`, `lessonView.js`, `lessonDone.js` |
| Task 11 split files `lessonsMenuParts.js`, `deskMenu.css`, `deskMenuSide.css` (line cap) | Built as flagged; the two CSS files are on the allowlist, `lessonsMenuParts.js` is not named there (corrected after the reviewer's gate note) | `src/ui/components/`, `src/styles/` |
| Task 11 choices: `{n} OF {m} PASSED` on every group; key labels as the mock writes them; the map's NEXT legend hidden when nothing is recommended; `text-transform: none` on the card and done titles | Built as flagged; not overruled | `lessons.js`, `lessonsMenuParts.js`, `deskMenu*.css` |
| Play these keys: a Practice round on the lesson's words, no button under 6 words, Play again keeps the words | Decided: design decision 10 (Claude built it, 11b) | `keysRound.js`, `play.js`, `results.js`, `lessonDone.js` |
| After Play these keys, results reads `PACK: YOUR KEYS` | Done (Shara, Batch C): copy-table row added, unit and e2e tests | `results.js`, `design.md` |
| Lesson 0's panel line is its first card part ("Your keyboard. Is it this one?") | Accepted (decision 11) | `menuSide.js` |
| Lesson 0's "picture of the US keyboard" is the lesson keyboard, F and J lit | Accepted (decision 11) | `lessonView.js` |
| `lessonAsk.js` and its test split out of `lessonView.js` for the line cap | Accepted (decision 11) | `src/ui/components/lessonAsk.js` |
| The done card's `.btn:hover` put a dark fill under paper ink (1.04:1, axe); hover now keeps the button's own fill, no new color | Accepted (decision 11) | `deskDone.css` |
| Heading count tests 8 to 9 for How we count's new section; header comment trims and one merged line for the 150 cap | Accepted (decision 11) | `about.test.js`, `screens.spec.js`, `results.js`, `howWeCountText.js`, `lesson.js` |
| Blocker 1: How we count no longer fit on one screen with nine sections | Fixed by Claude (decision 11): four columns, 13px body, no copy cut; `fit.spec.js` green at all three sizes | `pages.css` |
| Blockers 2 and 3: Later rows (mock opacity .5/.6) and L00's space key (opacity .45) failed contrast | Fixed by Claude (decision 11): dimmed by `--dim` color with a dashed edge, never opacity; axe 0 serious or critical on every lesson state | `deskMenu.css`, `deskLesson.css` |
| The Lessons menu kept its last selection within a visit (Req 5.5) | Fixed by Claude (decision 11): starts on the recommended lesson every visit | `lessons.js` |
| The Progress screen's Lessons button still said Not built yet | Fixed by Claude (decision 11): it opens the Lessons menu | `progress.js`, `progress.test.js` |
| Personal bests and the menu's Best speed tile showed raw WPM ("20.037849") | Fixed by Claude (demo review): rounded, with a test | `progressPanels.js`, `menuSide.js`, `progress.test.js` |
| `npm ci` failed: lockfile out of sync | Fixed by Claude: only the two missing optional entries @emnapi/core and @emnapi/runtime 2.0.0-beta.2 (published Oct 15, past the two-week rule) added; Kiro verified `npm ci` exit 0 before the checks | `package-lock.json` |
| `npm audit` reports high and moderate advisories (undici, path-to-regexp, minimatch, js-yaml, ajv, glob, @fastify/busboy), all under the pinned `vercel` CLI's own packages; `package.json` unchanged since `block-7` | Open: no action (dev tooling only, never in the build); for Shara, recheck when the CLI is next pinned | `node_modules/vercel` |
| e2e: the bot types instantly, so lesson screenshots show speeds like 2,903 WPM | No action: a test artifact, real play times every key | `docs/screens/built-lesson-done*.png` |
| Screenshot differences still visible against the mocks: the shared header is shorter (50px against 72px) and carries the terminal icon; Lesson 3's New keys has 2 lines (mock: "LINE 2 OF 3"); the paper text is slightly larger; the Lessons menu drops "Why these lessons" (per the map), writes "0 OF 2 PASSED" (mock "0 OF 2"), has a narrower key map and a taller card (the test out note); the done card sits near the top, not centered, and its four buttons wrap so All lessons takes its own row | Open: for Shara's visual sign-off at 1440x900 and 1366x768 | `docs/screens/` |
| One earlier full e2e run had a flaky failure in two `keyboard.spec.js` title tests | No action: reruns green, and the final run before deploy was 67 of 67 | `e2e/keyboard.spec.js` |
| PASS-line items for Shara: screenshot sign-off; play Lesson 1, a test out and Lesson 0 on the preview (Vercel toolbar off) | For Shara | preview URL above |

Lesson for the write-up: three blockers (a page that stopped fitting, and two contrast fails copied faithfully from the mock) were found only by the e2e and axe run, not by unit tests or the map. Kiro stopped instead of picking colors or cutting copy; the rulings went into design decision 11.

### Block 8a gate (task 14, Nov 12)

Reviewer: PASS, no High or Medium. a11y-auditor: FAIL, two High (read from code and CSS, not run in a browser; axe finds only part of the problems, and full WCAG validation needs manual testing with assistive technologies). Neither agent had a shell; both used Kiro's check results in `node_modules/.cache/gate-8a.md`. Kiro fixed nothing.

| Gate finding | Status | Where |
|---|---|---|
| Reviewer Low: `lessonsMenuParts.js` and `package-lock.json` are not named on the allowlist | Done (Shara): both added to `docs/current-block.md` | `docs/current-block.md` |
| Reviewer Low: Req 10.4 has no written finding: `deploy:preview` calls bare `vercel`, `npm run` puts `node_modules/.bin` first, so it runs the pinned 65.5.0 | Open: recorded here; for Shara | `package.json` |
| Reviewer Low: Check accuracy shown with `Math.floor(x * 100)` can read one point low from floating point (29/50 shows 57%); the pass test uses the raw ratio, so no pass is hidden | Open: Low, for Shara | `lessonDone.js`, `lesson.js` |
| Reviewer Low: the dip compares with the first lesson round still saved; only matters if it fell out of the 200-round cap, which can't happen on rounds 2 and 3 | No action proposed | `dip.js` |
| Reviewer: "no e2e leaves a lesson and checks nothing is recorded" | Correction: `e2e/flows.spec.js` "leaving a lesson goes to the Lessons menu and records nothing" covers it (green in the 67) | `flows.spec.js` |
| a11y High: the global focus ring (`--text` teal) is about 1.3:1 on paper, so focus on Lesson 0's buttons, the done card's buttons and the Lessons card's buttons is hard to see (2.4.7, 1.4.11) | Fixed by Claude (decision 12): the ink ring, `--paper-ink`, on `.desk-card` and `.desk-paper`; an e2e checks the ring color | `deskDone.css`, `lessons.spec.js` |
| a11y High: on the Lessons menu, Up/Down may lose focus: `select()` refreshes, then focuses the row from the old map (detached), so focus can drop to the page while `aria-current` moves (2.4.3, 4.1.2) | Fixed by Claude (decision 12): Up and Down focus the new render's row; an e2e checks focus | `lessons.js`, `lessons.spec.js` |
| a11y Medium: Lesson 0's question points at a picture that is `aria-hidden` with no text equivalent; `showAsk`'s focus on Yes runs before the screen is attached, so focus lands on the h1 (Enter still takes Yes) | Deferred to Block 8b (decision 12) | `lessonAsk.js`, `lessonKeyboard.js` |
| a11y Medium: part changes and their coach lines are not announced; the steps have no `aria-current="step"`; the first line is announced before the heading focus; the done result is heard twice | `aria-current="step"` fixed by Claude (decision 12, `lessonView.js`); the rest deferred to Block 8b (decision 12) | `lesson.js`, `lessonView.js` |
| a11y Medium: the waiting letter and the typed run are both underlined and differ mainly by color; finger identity is color only, and Lesson 0's fingers line names no finger (1.4.1) | Deferred to Block 8b (decision 12) | `desk.css`, `copy.js` |
| a11y Low: unlit letters on the Lessons key map use `--line`, about 2:1 | Deferred to Block 8b (decision 12) | `deskMenuSide.css` |
| a11y Low: group headings are `<p>`; the pill h1 reads "//"; `[WHY]` and `[TEST OUT]` look like buttons; the lesson h1 sits in `<header>`, not `<main>` | Deferred to Block 8b (decision 12) | `lessons.js`, `menuSide.js`, `lessonView.js` |
| a11y Low: reflow at 200% zoom not tested (fixed widths in the lesson CSS) | Deferred to Block 8b (decision 12) | `deskLesson.css`, `deskDone.css`, `deskMenu.css` |

## Nov 13 2026: Block 9, built-in drills, tasks 1 to 5 (running notes for task 6)

Splits made at the line cap (allowed by the design; each sits next to the file it came from):

| New file | Split from | Holds |
|---|---|---|
| `src/engine/weightedPick.js` (+ test) | `targets.js`, `round.js` | `withWeights` (copies items with their weight, checks one per item, finite and above 0) and `pickFrom` (uniform, or the running-sum walk) |
| `src/ui/screens/drillRound.js` (+ test) | `round.js` | `roundOptions`: createRound's options; a drill adds weights and says `Drill: built-in.` |
| `src/ui/screens/resultsDrill.js` | `results.js` | the mode line with the drill badge under it, `againKind` for Play again |
| `src/ui/components/drillLabel.js` | `playHud.js`, `results.js`, `resultsPanels.js` | the badge, the DRILL SOURCE row, `isDrill` |
| `src/ui/components/drillButton.js` | `progressPanels.js` | Drill these keys and its no-weak-keys line |
| `src/ui/screens/howWeCountDrills.js` (+ test) | `howWeCountText.js` | the Drills section |

The results badge CSS sits in `playHud.css` with its HUD twin, because `results.css` is at the line cap (`main.js` is not on the allowlist, so no new CSS file).

## Nov 13 2026: Block 9, built-in drills, close-out

Built in Block 9: item weights (`src/drills/weights.js`, PRD G5), weighted spawning with one random number per pick (non-drill rounds replay the recorded pre-Block 9 sequences exactly), the drill round (Practice on the falling layout, `drillSource: "built-in"`), the `[ DRILL: BUILT-IN ]` badge on the HUD and results, the DRILL SOURCE row, Play again for a drill, the working Drill these keys button with its no-weak-keys line, the live line `Drill: built-in.`, How we count's Drills section (last), and `e2e/drills.spec.js` plus screenshot pairs. Commits: `be4df7c` (tasks 1 to 5), `0651c9f` (Claude's drill pool, design decision 5). Previews: `dead-keys-m2fq7gw34` (task 5) and `dead-keys-36olut8ag-earlgreyhot1701ds-projects.vercel.app` (`dpl_DNwRbjHCsQGN8s2Qk3e5XfEwXR2U`, Ready). No production deploy.

Checks before `0651c9f` and its deploy: `npm run lint` clean (285 files); `npm test` 748 of 748; `npm run test:e2e` 75 passed, 40 skipped, 0 failed (axe 0 serious or critical on the drill HUD and drill results; no scroll at 1440x900, 1366x768, 1280x720, How we count included); `check:build` clean in `deploy:preview`. Earlier at `be4df7c`: `node scripts/check-fixtures.js` 42 of 42, nothing over 250, only `scripts/check-fixtures.js` over 150 (151, Block 1).

| Flag | Status | Where |
|---|---|---|
| 1. Weights alone barely move one weak key: with q missed half the time, about 1 drill in 5 showed a q-word in the first 8 (2,000 simulated seeds), so Req 7.1's e2e could not be reliable | Fixed by Claude (design decision 5): a drill draws only from words with at least one weak key when the pack has 8 or more, else the whole pack; G5 weights still order the pool; How we count, tests and `drills.spec.js` updated | `weights.js`, `drillRound.js`, `howWeCountDrills.js`, `drills.spec.js` |
| 2. Weights live on the round's item copies (`item.weight`), not a separate `state.weights`; non-drill items get no field | Accepted as built (Shara) | `weightedPick.js`, `round.js` |
| 3. The badge pushed the practice note's one line and TIME off the HUD's right edge; in a drill only, the note wraps | Accepted as built (Shara) | `playHud.css` |
| 4. Splits at the line cap: `weightedPick.js`, `drillRound.js`, `resultsDrill.js`, `drillLabel.js`, `drillButton.js`, `howWeCountDrills.js`; the results badge CSS in `playHud.css` (results.css at the cap, `main.js` off the allowlist) | Accepted as built (Shara); listed in the tasks 1 to 5 note above | see the split table above |
| 5. Trims for the 150 cap: header comments in `targets.js`, `play.js`, `howWeCountText.js`; a blank line and a JSDoc line in `round.js`, one blank line in `howWeCountText.js`; the round screen's `speed` local and one comment line | Accepted as built (Shara) | those files |
| 6. Test edits: `about.test.js` (off the allowlist) and `screens.spec.js` heading counts 9 to 10; the Progress "not built yet" drill test replaced by tests of the working button | Accepted as built (Shara) | `about.test.js`, `screens.spec.js`, `progress.test.js` |
| 7. axe once caught a cleared word mid-fade on the drill HUD; four reruns clean; the test waits 600 ms first | Accepted as built (Shara) | `drills.spec.js` |
| 8. Map-true labels: results read `MODE: PRACTICE // PACK: GENERAL` and `ROUND_OVER // PRACTICE`; the Practice footer's "FINISH IT BEFORE IT LANDS" is unchanged from Block 7 | Accepted as built (Shara) | `resultsDrill.js`, `playHud.js` |
| 9. Screenshot pairs for the drill HUD and results at both sizes; differences: the badge follows the practice note (Practice has no lives or sector), word codes and baseline dropped, PRACTICE in place of the mock's FALLING | Accepted as built (Shara) | `docs/screens/built-drill*.png`, `mock-drill*.png` |
| Reviewer and a11y-auditor for Block 9 | Deferred (Shara): one combined run at Block 16, to save credits | n/a |
| PASS-line items for Shara: screenshot sign-off; playing a drill on the preview (Vercel toolbar off) | For Shara | preview above |

Lesson for the write-up: a simulation of 2,000 seeds turned a vague "drills don't feel different" into a number (about 20%), which made the design change an easy call. The test that couldn't be written reliably was the signal.

## Nov 12 2026: Block 10, AI drills, Batch A (tasks 1 to 4, AWS faked)

Built: the AI route (`api/drill.js`, the only Vercel function; helpers in `api/_lib/`: `limits`, `prompt`, `bedrock` (the only AWS SDK import), `answer`, `ledger`), the browser client (`src/drills/aiClient.js`, `aiWords.js`), the drill start with the waiting line (`drillStart.js`), the AI badge, row, live line and `drillSource: "ai"`, Play again on the same AI words, the Progress nudge, the Settings switch, How we count's new last line, and `e2e/aiDrills.spec.js` with `/api/drill` faked. No deploy, no AWS calls, no key read, typed or printed.

Dependency (task 1): `@aws-sdk/client-bedrock-runtime` 3.1160.0, published Oct 29 2026 (18:46 UTC), Apache-2.0, not deprecated; newer releases (3.1161 to 3.1168) were under two weeks old. Installed with `--save-exact --before=2026-10-30T04:00:00Z`, the only `dependencies` entry; `npm audit --omit=dev`: 0 vulnerabilities. The install dropped the two optional `@emnapi` lockfile entries; Claude put them back (needed for `npm ci` on Linux, where Vercel builds).

Checks before the commit: `npm run lint` clean (303 files); `npm test` 800 of 800 (including 30 `api/_lib` tests, AWS faked); `npm run test:e2e` 83 passed, 40 skipped, 0 failed; `node scripts/check-fixtures.js` 42 of 42; only `scripts/check-fixtures.js` over 150 (151, Block 1).

Splits (allowed; each next to its source): `src/ui/screens/drillStart.js` (from `progress.js`), `src/ui/screens/drillAi.test.js` (the AI drill UI tests). No trims were needed: every changed source file stays at or under 149 lines.

| Flag | Status | Where |
|---|---|---|
| Vercel makes every `.js` in `api/` a function (tests included; Hobby caps the count), so helpers live in `api/_lib/` (`_` folders are skipped); hook H5 watches `api/_lib/prompt.js` | Accepted (design decision 5) | `api/_lib/` |
| Only weak keys in the pack charset are sent (the contract rejects `;`); none left means built-in | Accepted (decision 5) | `aiClient.js` |
| A daily cap refusal is a quiet 200 and doesn't count against the visitor | Accepted (decision 5) | `limits.js`, `drill.js` |
| No server timeout on the Bedrock call | Fixed (Req 2.8): 3.5 s abort answers `{ error: "timeout" }`, with tests | `bedrock.js`, `drill.js` |
| Same origin means a matching `Origin` header; none, or a cross-site `Sec-Fetch-Site`, is refused | Accepted (decision 5) | `drill.js` |
| The fetch lives in `src/drills/aiClient.js`, not `src/net/` (structure.md) | Accepted (decision 5) | `aiClient.js` |
| `npm install` dropped the `@emnapi` entries | Done by Claude: re-added | `package-lock.json` |
| Five files off the allowlist were needed to wire an AI drill (`round.js`, `progress.js`, `stage.js`, `playHud.js`, `resultsPanels.js`) | Allowed (Shara) | those files |
| Play again after an AI drill | Decided (Req 3.5): the same AI words, no new request, labeled AI-generated | `resultsDrill.js`, `results.js` (unchanged) |
| An AI drill's results pack line | Decided (decision 6, copy table): `PACK: AI WORDS`, unit and e2e tests | `resultsDrill.js` |
| The nudge, the no-weak-keys line and the waiting line share one `aria-live="polite"` note; the button is always described by it | Accepted (decision 6) | `drillButton.js` |
| `weakPanel`'s `announce` argument lost its default (line length); every caller passes it | Accepted (decision 6) | `progressPanels.js` |
| The nudge made Progress scroll (920 px at 1440x900) | Fixed (decision 6's fit fix): the note spans the whole button row (`.drill-act` `display: contents`, `.drill-note` on its own row, `.weak-actions` `row-gap: 0`, Shara's ruling), which cleared 1440x900; Claude then made the speed chart 92% of its column, centered, which cleared 1366x768 and 1280x720 (they were 14 px over) | `progressWeak.css`, `progressRight.css` |
| AWS setup, golden set and hook H5, teardown doc, preview deploy | Batch B, with Shara | tasks 5 to 7 |

Lesson for the write-up: one plain line of copy (the nudge) broke "no page scrolls" three times, at three sizes, for three different reasons. The fit test caught each one; a screenshot alone would have looked fine.

## Nov 13 2026: Block 10, task 8 close-out

Shara played an AI drill on the preview: the label read `[ DRILL: AI-GENERATED ]`, results read `PACK: AI WORDS`, and Play again made no second call. With AI drills off, she saw the nudge and `[ DRILL: BUILT-IN ]`. Block 10 PASS at `72c6c17`. Reviewer and a11y-auditor deferred to the Block 16 combined run.

## Nov 13 2026: Block 11, share card

Built by Claude, to save credits; Kiro ran the checks, committed and deployed. Spec at `.kiro/specs/share/`. The card is drawn in the browser on a 1200x630 canvas, and nothing is uploaded. The meta line uses the app's mode name (FALLING WORDS), not the mock's FALLING TARGETS. The Share button shows only where the browser can share files.

## Nov 13 2026: Block 12, daily drill

Built by Claude, to save credits; Kiro ran the checks, committed and deployed. Spec at `.kiro/specs/daily/`. The seed is the local date as YYYYMMDD. It is a Falling words round with a 2-minute cap on active play, so pausing stops the clock. The clock lives in the UI (`src/drills/daily.js` `clockFor`, run by `round.js`), so there is no engine change. Practice moved from `round.js` to `menuRounds.js` at the line cap. The mock's ghost line and target pace are stubbed until Block 13. `e2e/flows.spec.js`: the "not built" flow became "every menu item is built", since Daily drill was the last unbuilt item.

## Nov 13 2026: Block 13a, ghost race

Built by Claude, to save credits; Kiro ran the checks, committed and deployed. Spec at `.kiro/specs/ghost/`. A new personal best in falling, corners or daily saves its keystrokes (up to 2,000) as that mode's GhostRun, one per mode and pack. The race compares letters typed right at the same moment of active play. There is no engine change: keystroke `t` was already active milliseconds. Play these keys never saves or races a ghost. The daily panel says "Race your ghost", not the mock's "yesterday's ghost", because the ghost is the best daily run. `e2e/daily.spec.js` now accepts the ghost line after a first daily best. Attract mode is Block 13b.

## Nov 13 2026: Block 13b, attract mode

Built by Claude, to save credits; Kiro ran the checks, committed and deployed. Spec at `.kiro/specs/attract/`. After 15 s idle on the title, the real engine plays itself behind the panel. A typist (`src/attract/bot.js`) locks the word nearest danger, types one key every 250 ms and never misses, and the demo alternates falling and corners every 40 s. The header shows `[Demo playing]` and Pause demo (`aria-pressed`, WCAG 2.2.2). Any key, click or scroll restores the still frame. It is `aria-hidden` and silent, and never starts under reduced motion. Decision: a live typist, not a recording, because a saved ghost has keystrokes but not its words. Ghost Req 5: the Play rules gained a ghost hint, and How we count's Bests line gained one sentence; a separate section made the page scroll at 1440x900. `fakeDom` gained `removeAttribute`. The e2e test uses Playwright's clock for the 15 s wait.

## Nov 13 2026: Block 14, sound sets and Spec Wave

Built by Claude, to save credits; Kiro ran the checks, committed and deployed. Specs at `.kiro/specs/sound/` and `.kiro/specs/specwave/`.

Sound: Off by default. Typewriter (clack per key, carriage return per word, bell per wave, thunk on a landed word) and Arcade (laser per word, thud on a landed word, chime per wave) are synthesized with Web Audio, so there are no audio files. The cues come from the engine's own events. Settings plays a sample on change. Where Web Audio is missing, the game is silent. The attract demo is always silent.

Spec Wave: typing `kiro` on the title (after the privacy card has been seen) starts one falling wave of spec words, mode `specwave`, pack `specwave`. It ends itself after wave 1 and saves no ghost. A `k` waits 600 ms for the next key. Moves at the line cap: `ROUND_KINDS` to `roundKinds.js` (re-exported from `play.js`), and `clockFor` to `src/drills/limits.js`. The mock's `SOUND: OFF` footer label is not added.

## Nov 13 2026: Production deploy of Block 14 (956ca98)

On Shara's instruction. Before the deploy, at `956ca98` with a clean tree: `npm run lint` clean (340 files), `npm test` 886 of 886, `npm run check:build` clean, `npm run test:e2e` 96 passed, 40 skipped, 0 failed (0 serious or critical axe issues).

- Deployment: `https://dead-keys-emhvl7ndt-earlgreyhot1701ds-projects.vercel.app`, aliased to `https://dead-keys.vercel.app` (`vercel deploy --prod`).
- Live check: `curl -sI https://dead-keys.vercel.app` returned `200 OK`; the live index.html loads `/assets/index-q8uk-VYd.js`, the same asset as local `dist/index.html`. Match.
- Env vars (names only): `AWS_REGION` (Config, Production and Preview), `AWS_ROLE_ARN` (Config, Production and Preview). No AWS key exists.
