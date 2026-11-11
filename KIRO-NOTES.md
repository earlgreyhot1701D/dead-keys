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
| `keyDeltas` keys are not checked to be one character | Deferred: the schema subset has no `propertyNames`; Req 6 does not ask for it | `contract/` |
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
| `bests` keys are not checked to be real modes or to exclude practice (the schema subset has no `propertyNames`; `rules.js` is not on this block's allowlist) | Deferred to Block 4: storage validates on load, and `updateBests` is the only writer | `progress.json` |
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
| `dayStreak.lastDay` format is not checked by the schema (no `pattern` keyword); it only checks a string of length 10 or null | Deferred to Block 4: `updateDayStreak` throws on a bad day, and storage validates on load | `progress.json` |
| Nothing yet calls `updateDayStreak` | Deferred to Block 4: wiring must call it for every round, practice included, and save the result | Block 4 |
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
| Reviewer 5: saved data is only partly validated at the engine boundary (`mergeRound` does not check `misses <= attempts` or key length; `updateBests` throws a raw TypeError on a malformed `bests[mode]`) | Deferred to Block 4: storage validates saved data on load | Block 4 |
| Reviewer 6: one missed `Q` can flag top row, left hand and shift, giving three overlapping sentences | Deferred to Block 11: check how the overlap reads when the results screen renders it | Block 11 |
| Reviewer 7: `fixture-check` was meant to retire when the contract freezes | Fixed: Block 3 passes and the contract is frozen, so the hook is switched off with `"enabled": false` (a documented field at kiro.dev/docs/hooks). The file stays for the record, and its description says it is retired. The checker script stays and `npm test` still runs it. Not re-proven by a save: hooks load at session start, so the switch takes effect from the next session | `.kiro/hooks/fixture-check.json` |
| Reviewer 8: the milestone tone regex left out "bad" | Fixed: `/bad\|slow\|dip\|worse\|decline/i` | `milestonesAward.test.js` |

Contract frozen at the end of Block 3 (tag `block-3`): the eleven shapes, `keyDeltas`, `continued`, `Diagnosis.severity`, `Milestone.kind`, `Progress.bests` and `Progress.dayStreak`. Any change from here is a new decision, not a drive-by edit.
