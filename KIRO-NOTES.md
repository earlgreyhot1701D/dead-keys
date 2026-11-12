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
| Tab hidden then shown sends one huge `dtMs`, so every target arrives at once and all lives are lost (Claude's review) | Deferred to Block 7: the renderer must auto-pause on `visibilitychange`, clamp `dt` per tick, and guard NaN (`tick` throws on a bad `dtMs`, so a NaN on the first frame would otherwise hit the "never a blank screen" rule) | Block 7 |
| `WAVE_SPEEDUP` has no ceiling: wave 20 is about 1.3 s per word, wave 30 about 0.5 s (Claude's review) | Deferred to Block 7: tune or cap it when it can be seen | Block 7 |
| A stray space counts as a miss in falling mode, where words have no spaces (Claude's review) | Deferred to Block 7: revisit after the first playtest | Block 7 |
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
| Three hand-written numbers on that page: five characters to a word, at most three sentences, six practice keys (the engine hard-codes them) | Deferred to Block 7, the next time engine files are on the allowlist: move them into config and read them on the page | `howWeCountText.js`, `score.js`, `diagnose.js` |
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
| Tasks 7 to 10: mock elements the map does not name, handled the way the map handles their kin | Open: for Shara (corners SOUND dropped as on falling; core ghost kept as part of "the core"; results SOUND and drill badge dropped; "// BUFFER STATUS: DUMP_COMPLETE ::", "[ STAT_0n ]", "[ RECORD ]", "MILESTONE:", "INTERCEPTED WORDS / WORD LOG" kept as mock flavor; "[+3 WPM]" and "STREAK: 3" dropped; the accuracy panel titled "ACCURACY" without "VS PASS LINE"; "STATUS: NOT SAVING" when the round was not saved) | `results.js`, `resultsPanels.js`, `cornersHud.js` |
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

### v2 list (from the playtest)

- Per-corner shields in Four corners.
- A WPM-labelled speed slider.
- Fair spawns for long words.
- Highest wave on results.
- Rename the HUD's SPEED to YOUR WPM.
- Escape labels in the pause and out-of-lives dialogs.
