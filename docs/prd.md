# Dead Keys: PRD

**Status:** v1.5, approved by Shara Nov 7 2026. No open decisions block the build.
**Hackathon:** Kiroween 2026 (Devpost), category Resurrection. Hard deadline Fri Dec 4 2026, 2:00 PM PT.
**Sources:** `claude/kiroween-typing-game-seed.md` (decisions), `claude/dead-keys-curriculum-research.md` (research), `claude/dead-keys-start-here.md` (build kickoff).
**One line:** The typing games that taught a generation, rebuilt as a real trainer for anyone starting or rebuilding keyboard skills.

AI assisted. Human approved. Powered by NLP.

---

## How to read this document

One document, gated sections. A closed gate is not reopened. If something later conflicts with a closed gate, say so in one line and follow the gate.

| Gate | Section | Status |
|---|---|---|
| G1 | Purpose and player | Closed |
| G2 | Scope (MUST / STUB / NEVER) | Closed |
| G3 | Architecture, stack, longevity | Closed |
| G4 | Data contract and fixtures | Closed |
| G5 | Engine rules and "How we count" | Closed |
| G6 | Content sources | Closed |
| G7 | Lesson ladder | Closed |
| G8 | Adaptive drills and the AI route | Closed |
| G9 | Storage, privacy, analytics | Closed |
| G10 | Accessibility | Closed |
| G11 | UI track | Closed |
| G12 | Kiro plan (per Kiro's own docs) | Closed |
| G13 | Sprint plan | Closed |
| G14 | README plan | Closed |
| G15 | Security, ship, teardown | Closed |

---

## G1. Purpose and player

**Manifesto (locked, D6):**
> I learned on a typewriter in middle school, and the Mac games at home helped me improve. In 2000, almost half of US high school grads took a typing class. By 2019 it was 2.5%. So I brought the games back.

"Improve" is deliberate: for one player it means faster, for another more accurate or more efficient. Dead Keys measures all three and passes lessons on accuracy.

**Tagline (locked, D7):** "a typing game, back from the dead." Used on the X image, the app, the README, Devpost, and all future posts. Exception: a post may carry its own article-specific line on its cover (the Builder Center warm-up uses "planned with kiro + amazon bedrock").

**The cited why:** US high school graduates who earned keyboarding credit fell from 44.1% in 2000 to 2.5% in 2019 (NCES, NAEP High School Transcript Study, Table 1).

**Two resurrections:**
1. The 1980s typing games: MasterType (1981) and Type Attack (1982).
2. Office Keys, Shara's first Lovable build (August 2025): a no-login typing practice app for court staff with passages from letters to numbers to punctuation, a results screen, next-practice suggestions, high-contrast options, and history kept on the device. Live at type-speed-boost.lovable.app, code at github.com/earlgreyhot1701D/office-keys. Dead Keys carries over its ideas, not its code.

**Who it's for:** anyone starting or rebuilding keyboard skills. Never described by age.

**The name:** a dead key types nothing until you press the next one. Yours have been asleep. Let's wake them up.

**Voice:** go old school. Typewriter warmth, arcade energy, plain words. Halloween is a light touch.

**What "done" looks like for a player:**
1. Land on the page. The game is playing itself. Press any key. No sign-up.
2. Sixty seconds of calibration. See your first heat map and up to three plain sentences about your typing.
3. Pick a style: four corners or falling. Play.
4. Come back for the daily drill. Race yesterday's ghost.
5. Two weeks later the progress line is up, the red keys are cooling, and a milestone card says so.

**Success for the hackathon:** a judge opens the URL, sees attract mode, presses a key, and within two minutes has seen their own heat map.

**End state (D3, decided):** shipped build, not an ongoing product. Site stays up on Vercel Hobby. AI route turns off after judging closes (Jan 29 2027) unless v2 is chosen. v2 (court pack, other layouts) decided after winners are announced (about Feb 3 2027).

---

## G2. Scope

### MUST

**Core play**
- Two mechanics, one engine: four-corner defense (MasterType, 1981) and falling targets (Type Attack, 1982). Player chooses.
- Practice mode (untimed): its own main-menu entry.
- Pause (Escape), speed slider for every mode, settings, first-run onboarding.

**Learning**
- Lesson 0 "Meet your keyboard" and the lesson ladder (G7). Passed on accuracy, not speed.
- **Test out:** every lesson after Lesson 0 has a "Test out" button. A 60-second check on that lesson's keys. 95% accuracy passes it. Calibration also recommends a starting lesson.
- Next lesson recommended from the heat map. In-order path always available.
- "Why these lessons" page citing the research, honest that this is a game informed by research, not a study.
- Glossary taps ("what's this?") for home row, WPM, accuracy, dead key.

**Transparency**
- **"How we count" page in the main menu:** WPM, accuracy, what counts as a miss, how the heat map is colored, when a key has enough data, how drills are chosen, what is stored, what leaves the browser. Plain words, the same rules as G5, with a link to the source code.
- Every drill labeled "built-in" or "AI-generated."

**Diagnosis and adaptation**
- Heat map, deterministic diagnosis, two-layer adaptive drills (G8).

**Progress and sharing**
- Local progress memory, export, import, clear data.
- First-launch privacy card (G9).
- Milestones: WPM bands, personal bests, accuracy streaks, consistency. The early speed dip is never punished.
- Share card, ghost race, daily drill, attract mode.

**Content**
- General pack and Spanish dead-keys pack (G6). Community pack format plus validator.

**Product shell**
- **Sound sets:** Off (default), Typewriter (clack, carriage return, bell), Arcade (laser on clear, thud on hit, chime on wave up). All synthesized with the Web Audio API, so there are no audio files to license.
- **Kiro easter egg:** type `kiro` on the title screen and a bonus "Spec Wave" starts: a wave of words like spec, steering, hook, requirements, design, tasks, agent. Drawn with our own ghost, never Kiro's logo or brand art.
- PWA: installable, works offline except AI drills.
- About: clewlabs.org, X @clewlabs, dev.to/earlgreyhot1701d, linkedin.com/in/la-shara-cordero-a0017a11, GitHub repo, MIT license, "Built with Kiro for Kiroween 2026," credit to MasterType and Type Attack, a line on Office Keys as the app this one grew from, word list attribution (G6), dead-key explainer, Tally feedback link, Buy Me a Coffee (buymeacoffee.com/earlgreyhot1701d). Vercel's Fair Use Guidelines state that asking for donations is not commercial use, so the tip link is fine on Hobby.
- Tally link also on the results screen.
- Phone visitors told plainly the game needs a keyboard; practice mode offered. QWERTY only in v1, stated.
- Vercel Web Analytics, page views only, declared on the page (G9).

**Build and Kiro:** steering, scoped hooks, specs per block, property-based tests, MCP server, Vercel deploys driven from Kiro (G12). AWS teardown checklist (G15).

### STUB (comment with implementation notes, not half-built)
- Court pack: first community pack, v2.
- Graveyard Shift: endless late-night mode name.
- Other keyboard layouts (AZERTY, QWERTZ, Dvorak).
- Spanish-language UI.
- **Research data warehouse:** opt-in, anonymous contribution of aggregate per-key stats (never keystroke logs, never text) to a future dataset. Needs a consent screen, a way to withdraw, a retention rule, and a privacy review before it exists. Notes only in v1.
- Shared rate-limit counter (Upstash Redis or similar) if usage outgrows in-memory limits (G8).

### NEVER (v1)
- Music. Sound sets are the audio identity.
- Accounts, server-side user data, cookies, third-party trackers. (Vercel Web Analytics is cookieless and aggregate; it is the only analytics.)
- Typing data, keystrokes, or progress sent to analytics.
- Payment inside the app.
- `innerHTML`, `eval`, API keys in the browser.
- Free text from the player sent to the model.
- Kiro's logo or brand art anywhere in the app or video.
- Code copied from Office Keys, README Clew 2, or the Oct 17 feel test. (Design token values from README Clew 2 are reused by decision, D4, and disclosed.)
- Secrets (AWS keys) passed through the agent's chat or written by the agent. Shara enters them in the Vercel dashboard.
- Claims that typing games alone are proven, that phones are faster, or any MasterType lesson count without a primary source.

---

## G3. Architecture, stack, longevity

```
Browser (static, Vercel)                          Server (one Vercel function)
  index.html, styles, ES modules                   api/drill.js     validates, calls Bedrock, returns lines
  engine (pure functions, no DOM)                  api/limits.js    rate limit + daily cap (in-memory)
  ui (DOM, textContent only)          POST         api/bedrock.js   the only file that talks to AWS
  storage (localStorage, try/catch)  ------->      api/validate.js  request and response checks
  service worker (never caches /api)  <-------
                                     { lines, source } or error -> built-in drill
```

**Decided:** D1 Vercel function calling Bedrock. D2 vanilla JavaScript with JSDoc types.

**Spike 0, longevity check (done Nov 7, web research, no Kiro credits):**

| Tool | Status found | Verdict |
|---|---|---|
| Vite | 8.x line, patch 8.0.11 shipped May 2026 | Pass. Pin exact version at repo creation. |
| Biome | Active, 13 commits and release work week of May 25, 2026 | Pass |
| fast-check | 4.3.0, MIT, maintenance score 100, no deprecated deps | Pass |
| Amazon Nova Micro | AWS model card: Lifecycle Active. Launched Dec 2024, "EOL no sooner than" Dec 2025, legacy period at least 6 months. Other Nova models (Premier, Sonic, Canvas, Reel) went legacy in March 2026. | Pass with a known risk: Micro could be moved to legacy at any time, but the 6-month legacy period covers judging. Recheck before Block 7. Cost $0.035 per 1M input tokens, $0.14 per 1M output. |
| Vercel Web Analytics | Cookieless, request hash, session discarded after 24 hours, aggregate only | Pass |
| Vercel Hobby | 1,000,000 function invocations a month included; donations are not commercial use | Pass |
| Tally | Free: answer charts and 7 days of visit data; drop-off by question is Pro-only; no cookies | Pass |
| Ponytail | MIT, about 185k stars, active | Pass |
| Playwright, axe-core, AWS SDK v3, MCP TypeScript SDK, Vercel CLI, Vercel MCP server | Widely used; MCP SDK has a v2 beta in progress | Pin when the block that needs them starts. Use the stable MCP SDK, not the beta. |

**Pinned Nov 11 2026** (newest release at least two weeks old, in `package.json`): Vite 8.3.5 (Oct 21), Biome 2.6.4 (Oct 28), fast-check 4.10.2 (Sep 19). Tests run on `node --test` with fast-check, so there's no separate test runner.

---

## G4. Data contract and fixtures

Block 1. Both tracks build against these shapes. A layout that survives both the normal and ugly fixtures is ready to wire.

| Shape | Fields (summary) |
|---|---|
| `Pack` | `id`, `name`, `lang`, `version`, `license`, `attribution`, `charset`, `pools` (named lists of `Item`), `lessons` |
| `Item` | `id`, `text`, `kind` (word, sentence, number, mixed, pair), `source` (citation or "original") |
| `KeyStat` | `key`, `attempts`, `misses`, `lastSeen` |
| `Keystroke` | `t` (ms from round start), `expected`, `typed`, `ok` |
| `RoundResult` | `id`, `date`, `mode` (corners, falling, practice, lesson, testout, daily, specwave), `packId`, `lessonId`, `durationMs`, `correctChars`, `totalKeystrokes`, `wpm`, `accuracy`, `cleared`, `wave`, `keyDeltas`, `drillSource` |
| `Progress` | `schemaVersion`, `createdAt`, `rounds` (last 200), `keys`, `bests`, `lessonsPassed` (with how: lesson or testout), `milestones`, `settings`, `ghosts` |
| `GhostRun` | `mode`, `packId`, `wpm`, `keystrokes` (capped at 2,000) |
| `Diagnosis` | `sentences` (`{ text, severity, keys }`), `weakKeys` (top 6), `sufficientData` |
| `DrillRequest` | `packId`, `weakKeys` (up to 6, from the pack charset, rate 0 to 1), `recentWpm` (0 to 250) |
| `DrillResponse` | `lines` (1 to 8, each 1 to 80 chars, charset only), `source` ("ai") |
| `Milestone` | `id`, `kind`, `threshold`, `label` |

**Ugly fixture must include:** zero rounds; 200 rounds and every key; a key with 3 attempts; 100% and 0% accuracy rounds; the longest sentence; a Spanish item with ¿ and ñ; an older `schemaVersion`; corrupted JSON; an AI response with an out-of-charset character; an AI response truncated mid-line.

---

## G5. Engine rules and "How we count"

All deterministic, all pure functions, all covered by property-based tests. This table is also the source for the in-app "How we count" page, so the page and the code never disagree.

| Rule | Definition |
|---|---|
| WPM | (correct characters ÷ 5) ÷ minutes |
| Accuracy | correct keystrokes ÷ total keystrokes. Backspace is not counted as a keystroke. |
| Lock | The first character typed locks the target nearest to danger that starts with it. Escape drops the lock. |
| Miss | A typed character that doesn't match the expected next character. Counted against the expected key. |
| Case | Case and punctuation always count, except lessons 1 to 6, which use lowercase letters only. |
| Miss rate | misses ÷ attempts per key. A key needs 10 attempts before it's colored. Below that it shows a hatched "not enough data" pattern. |
| Heat bands | 4 bands plus "no data," each with its own pattern, never color alone. |
| Diagnosis | A key group (row, hand, shift, digits, symbols) is flagged when its miss rate is at least 2× the player's overall rate with 20+ attempts. Max 3 sentences, worst first. |
| Weighted sampling | Item weight = sum over its characters of (miss rate + 0.05). Sampled with the seeded RNG. |
| Seeded RNG | mulberry32. Same seed, same sequence. |
| Daily drill | Seed = local date as YYYYMMDD. 2 minutes, general pack. |
| Lesson pass / test out | 95% accuracy or better over the minimum characters, at any speed. |
| Milestones | WPM bands every 10, new personal best, 3 sessions in a row at 95%+, 7-day streak, each lesson passed. Never "you got slower." |
| Dip notice | If WPM drops more than 15% across the first 3 lesson sessions: "Speed often dips while your fingers relearn. It comes back faster." |

---

## G6. Content sources

**Status: the general pack was an assumption until Nov 7. Sources below are chosen and licensed; content is assembled in Block 1.**

| Pool | Source | License | Notes |
|---|---|---|---|
| Words | top-english-wordlists (github.com/david47k/top-english-wordlists), built from Google Books Ngrams, 1950 to 2012 | CC BY 3.0 | Attribution in About and README. Curated by hand: remove offensive words and proper nouns. |
| Not used | google-10000-english | LDC license; its own license file advises against commercial use | Rejected to keep licensing clean |
| Letter pairs | Computed from the word list (most frequent pairs) | Derived | Feeds Lesson 13 (rollover) |
| Sentences | Written for the game, plus short public-domain excerpts (US public domain) | Original / public domain | Every sentence carries `source` |
| Numbers, dates, money, codes, addresses | Generated by seeded rules. Invented street names. | Original | Never real addresses, names, or phone numbers |
| Spanish | Open-licensed frequency list, chosen in the pack block | Must allow redistribution | Research step in Block 9 |

---

## G7. Lesson ladder

Built from the research rules: accuracy first, one finger per key, eyes on the screen, short and daily, expect the dip, lessons plus play. 2 to 4 minutes each. Finger colors on in lessons 0 to 6, optional after.

| # | Lesson | New keys |
|---|---|---|
| 0 | Meet your keyboard | Layout check by picture, F and J bumps, finger colors, posture, eyes on screen |
| 1 | Home row, left hand | a s d f |
| 2 | Home row, right hand | j k l ; |
| 3 | Full home row | g h, space |
| 4 | Top row, index fingers | r t y u |
| 5 | Top row, full | q w e i o p |
| 6 | Bottom row | z x c v b n m , . |
| 7 | Capitals | Shift with the opposite hand |
| 8 | Punctuation | ' ? ! : " - |
| 9 | Numbers, left | 1 2 3 4 5 |
| 10 | Numbers, right | 6 7 8 9 0 |
| 11 | Symbols | $ % & ( ) / @ # |
| 12 | Real-world strings | Addresses, dates, money, codes |
| 13 | Common pairs | th he in er an re on (rollover) |

**Spanish pack lessons S1 to S3:** á é í ó ú; ñ and ü; ¿ ¡. Each teaches the dead-key press on US-International, with a plain note that layouts differ.

**Recommendation:** earliest unpassed lesson containing one of the top 3 weak keys; otherwise next in order.

---

## G8. Adaptive drills and the AI route

**Layer 1, built-in:** weighted sampling (G5). Always on, offline.
**Layer 2, AI:** up to 8 new lines aimed at weak keys. Optional, one settings switch.

**Request path:** `DrillRequest` (weak keys and recent WPM only) → validate → rate limit and daily cap → Bedrock (Nova Micro, Converse API, `us.amazon.nova-micro-v1:0`) → validate response → lines, or built-in fallback.

**Brake settings, from cost math, not guesses.** One call at about 250 tokens in and 300 out costs $0.00005075; the table rounds every row the same way.

| Item | Number |
|---|---|
| Tokens per call (estimate) | about 250 in, 300 out (hard ceiling `maxTokens` 300) |
| Cost per call | about $0.00005 |
| 1,000 calls | about $0.05 |
| 100,000 calls | about $5 |
| Monthly budget | $5 (AWS Budgets alert) |
| Daily cap | 3,000 calls (about $4.57 a month if hit every day) |
| Per-visitor limit | 30 calls an hour |

**Expected usage (guesses, replaced by the ledger after week one):**

| Scenario | Calls a day | Cost a day |
|---|---|---|
| Judges only | under 100 | under $0.01 |
| Launch post day, 500 players × 4 AI drills | about 2,000 | about $0.10 |
| Cap reached | 3,000 | about $0.15 |

**Known limit:** rate limits and the daily cap live in memory, so each running function instance counts separately. The caps are approximate. At $0.00005 a call, even a 10× overrun is cents, and the Budgets alert catches anything larger. A shared counter is stubbed (G2).

**Other brakes:** stop reason other than a normal end means discard and fall back; usage ledger line per call (time, tokens, stop reason, latency, result); IAM user can invoke one model ARN only; no player text reaches the model; output checked character by character against the pack charset; golden set (6 weak-key profiles) runs before wiring and on every prompt change; 4-second client timeout.

**Failure behavior:** any error, timeout, cap, or rejected response returns a built-in drill labeled "Drill: built-in." Never a blank screen or an error code.

---

## G9. Storage, privacy, analytics

- One localStorage key, `deadkeys:v1`. try/catch everywhere. If storage is blocked, the game runs in memory and says so in one line.
- `schemaVersion` plus migration. Corrupted records backed up to `deadkeys:v1:corrupt`, fresh start, plain notice.
- Rounds capped at 200. Export to JSON, import with validation and on-page confirmation, Clear Data with on-page confirmation.
- Vercel Web Analytics: page views only. No custom events carrying typing data.

**First-launch privacy card (copy draft):**
> Your progress is saved only in this browser. There's no account. If you clear your browser data, your progress is gone, so export a backup anytime from Settings.
>
> Two things leave your browser. When AI drills are on, we send which keys you miss and your recent speed, nothing else, so the AI can write practice lines for you. You can turn AI drills off in Settings. We also count page visits with Vercel Web Analytics, which uses no cookies and can't identify you. Your typing is never part of it.

---

## G10. Accessibility

Target WCAG 2.2 AA, built in from Block 1, checked at every gate.

- Speed slider on every mode. Untimed practice on the main menu. Test out available, so no one is forced through lessons they don't need.
- Live region: target cleared, life lost, wave up, milestone, lesson passed, drill source.
- Never color alone. Reduced motion respected. Visible focus. Full keyboard menus. Escape pauses into a real dialog.
- Contrast checked on every token pair at token lock. Sound off by default.
- Attract mode: visible Pause (WCAG 2.2.2), silent, live region quiet, still frame under reduced motion.

**Scoped claim (no stronger):** menus, settings, lesson instructions, results, progress, heat map summary, "How we count," and share card are fully usable with a screen reader. Gameplay is visual. Practice mode with announcements is the accessible path to practice.

---

## G11. UI track

**Direction (D4, decided Nov 7): the README Clew 2 aesthetic.** Phosphor terminal: teal-black ground, glowing teal type, condensed uppercase headings, monospace body, double rules, zero border radius, faint static scanlines (off under reduced motion), and warm colors used only for status. Reference: github.com/earlgreyhot1701D/readme-clew-2 (`web/tokens.css`, `web/chrome.css`) and readme-clew-2.vercel.app. The Nov 8 cover art (no glow, proofreader's marks) shows the restrained version to aim for.

**Starting tokens (values re-entered, not files copied; disclosed in prior work):**

| Token | Value | Dead Keys role |
|---|---|---|
| `--bg` | #0A1214 | Page ground |
| `--panel` | #0E1C1F | Panels, keycaps at rest |
| `--rule` | #3CA89C | Rules, outlines |
| `--text` | #4FE3D1 | Text; heat band "steady" |
| `--label` | #79C7C5 | Labels |
| `--muted` | #9BB0AD | Secondary text; "no data" hatch |
| `--missed` | #FF7A6B | Heat band "missed" (coral) |
| `--shaky` | #F2C14E | Heat band "shaky" (amber) |
| `--head` | Arial Narrow, Roboto Condensed, fallbacks | Headings, labels, uppercase |
| `--mono` | ui-monospace, Cascadia Mono, Consolas, fallbacks | Body, typed text |

The fourth heat band (between steady and shaky) is chosen at token lock. Contrast is checked for every pair, including coral and amber text on `--bg`, before tokens freeze.

**Steps:** design brief for screens and states → token lock with contrast verified → frozen. Runs in parallel with Blocks 1 to 3 on the G4 fixtures.

| Screen | Must handle |
|---|---|
| Title + attract mode | Idle demo, paused, reduced-motion still frame, `kiro` easter egg |
| Main menu | Play, Lessons, Practice, Daily drill, Progress, How we count, Settings, About |
| Privacy card | First launch, then in Settings |
| Lesson 0 / ladder | Locked, available, recommended, passed, passed by test out |
| Play: corners / falling | Locked target, lives, wave, paused, drill source label |
| Results | New best, milestone, dip notice, Tally link, share |
| Progress | Zero, few, 200 rounds; "not enough data" keys |
| How we count / Why these lessons / About | Plain text, links, citations |
| Settings | AI drills, sound set, speed, finger colors, export, import, clear |
| Share card | Preview, copy, download, share |
| Phone visitor, storage blocked | One-line notices, game still usable |

---

## G12. Kiro plan (checked against kiro.dev docs, Nov 7)

**Steering** (`.kiro/steering/`, front matter first, one domain per file, under 60 lines each):

| File | Inclusion | Contents |
|---|---|---|
| `product.md` | always | Purpose, player, MUST summary. Kiro foundation file. |
| `tech.md` | always | Stack, pinned versions, commands, rigor tiers, security rules, DO NOT refactor other code. Kiro foundation file. |
| `structure.md` | always | File map, one file one responsibility, 150/250 line caps. Kiro foundation file. |
| `a11y.md` | fileMatch: `src/ui/**`, `src/render/**`, `src/a11y/**` | G10 rules and the G11 tokens. Loads only when UI files are touched, so it doesn't add weight to engine work. |
| `ponytail.md` | always | Ponytail's own Kiro steering file, unchanged, plus an attribution line. `tech.md` states that `tech.md`, `structure.md` and `a11y.md` outrank it. (Ponytail ships a Kiro adapter, so it lives here instead of AGENTS.md.) |

Three always-on project steering files plus Ponytail. Steering can reference files instead of copying them (`#[[file:contract/schemas/progress.json]]`), so the contract lives in one place and can't drift.

**Specs** (`.kiro/specs/<block>/`, requirements-first, because this is greenfield with well-defined behavior):
- `requirements.md`: user stories plus acceptance criteria in EARS form ("WHEN … THE SYSTEM SHALL …"). Every criterion testable.
- `design.md`: architecture and components, sequence diagram, data models and interfaces (by file reference to `contract/`), error handling, testing strategy.
- `tasks.md`: one file per task, expected outcome, dependencies, optional tasks marked.
- Approval at each step: requirements confirmed before design, design checked against requirements before tasks.
- Run tasks one at a time. Never "run all."
- PRD sections map to specs: G4 → contract, G5 → engine, G7 → lessons, G8 → adaptive, and so on. The PRD lives in the repo at `docs/prd.md` as the planning disclosure.

**Hooks** (`.kiro/hooks/*.json`). Shell-command actions, not agent prompts, so they're fast and spend no credits. Kiro's file hooks fire on agent edits only, not manual edits.

| Hook | Trigger | Action | Alive | Retire when |
|---|---|---|---|---|
| H1 Line cap | Post Task Execution | `scripts/linecap.js` on changed files; warn at 150, fail at 250 | All blocks | Never |
| H2 Block scope | Session Start | Prints `docs/current-block.md` (block name, file allowlist, PASS line) | All blocks | Never |
| H3 Fixture check | File Save, `contract/**`, `fixtures/**` | Validate fixtures | Blocks 1 to 3 | Contract frozen |
| H4 Pack check | File Save, `packs/**` | Pack validator CLI | Content and pack blocks | Packs frozen |
| H5 Golden set | File Save, drill prompt file | `evals/run.js` | Block 7 | AI layer passes |

H1 fires once per task instead of on every save, which keeps the build fast. Two permanent hooks; the rest are retired at their gate. Tests, lint, format, and commits are not hooked.

**Vercel from the IDE:** Kiro wires and deploys Vercel from inside the IDE, through the Vercel CLI in Kiro's terminal and, where useful, Vercel's MCP server connected to Kiro. Kiro links the project, creates preview and production deploys, and reads deploy logs. Guardrails: Shara enters every secret (AWS access key, region, model ID) in the Vercel dashboard herself; the agent never sees, types, or commits a secret; production deploys happen only on Shara's instruction. Each deploy is written up in `KIRO-NOTES.md` for the write-up.

**Tests, each with a named reason:**

| Test | Catches |
|---|---|
| Property-based tests (fast-check) on the engine | Accuracy outside 0 to 1, negative WPM, RNG not deterministic, sampling leaving the pack, migration not round-tripping, validators letting an out-of-charset character through |
| Ugly fixture | Edge cases: zero rounds, 200 rounds, 3-attempt key, 0% and 100% rounds, longest sentence, ¿ and ñ, old schema, corrupted JSON, bad and truncated AI responses |
| Golden set | AI drills that miss the weak keys, break the charset, or run long |
| axe-core via Playwright at gates | Accessibility regressions on every screen |
| Playwright smoke on the deployed URL | A deploy that builds but doesn't play |

**MCP server:** `mcp/server.js` exposes `run_golden_set` and `validate_pack` as tools Kiro can call.

**Other `.kiro` setup (checked against kiro.dev docs, Nov 11):**

| Item | Where | Decision | Why |
|---|---|---|---|
| `.kiroignore` | Repo root | MUST, day one | Blocks agent reads of `.env`, `.env.*` (except `.env.example`), `*.pem`, `*.key`, `secrets/`. Enforces "the agent never sees a secret." |
| MCP config | `.kiro/settings/mcp.json` | MUST | Registers the Vercel MCP server (`https://mcp.vercel.com`, disabled at first) and, later, `mcp/server.js`. No secrets in the file. Kiro isn't on Vercel's supported-client list, so the Vercel CLI in Kiro's terminal is plan A. |
| Sandbox | `.kiro/settings/sandbox.json` | MUST: `{"enabled": true, "networkAccess": "COMMON_DEPENDENCIES"}` | OS boundary around agent shell commands. Windows needs a one-time admin setup for network modes; if unavailable, Kiro says so and runs without it. |
| Custom agent: `reviewer` | `.kiro/agents/reviewer.md` | MUST | Read-only tools. Reviews each block against the PRD and the block's spec in its own context, so the checker isn't the builder. |
| Custom agent: `a11y-auditor` | `.kiro/agents/a11y-auditor.md` | MUST from Block 4 | Read-only plus the axe run. Audits UI blocks against G10. |
| Skills | `.kiro/skills/` | STUB | Steering covers v1. Candidate later: the pack format as an on-demand skill for community pack authors. |
| Workflows | `.kiro/workflows/` | NEVER (v1) | Multi-agent background runs cost more tokens than block-by-block specs; the build stays one task at a time. |
| Foundation steering | `.kiro/steering/` | Written by hand from this PRD | Kiro's "Generate Steering Docs" button would write generic files; ours already exist in the plan. |
| Permissions | Outside the repo (`~/.kiro/workspace-roots/`) | Set in the IDE | Kiro keeps trust rules outside the repo by design. Approve shell commands per session. |

**Running notes:** `KIRO-NOTES.md` during the build, for the write-up: what each hook caught, where specs beat vibe coding, what Ponytail changed, what the property tests found, how Vercel was driven from the IDE.

---

## G13. Sprint plan

Weekend sprints, short builds on weekdays. Each sprint gets done what it gets done. No daily schedule.

**Fixed dates**

| Date | What |
|---|---|
| First build day | Register on Devpost, request Kiro credits (form closes Dec 1, noon), create repo with MIT license |
| Thu Dec 3 | Target submit |
| Fri Dec 4, 2:00 PM PT | Hard deadline |

**Weekends available:** Nov 14 to 15, Nov 21 to 22, Nov 28 to 29. Weekday sprints as they come (first one Wed Nov 11).

**Backlog in order, sized.** W = weekend sprint. D = weekday short build (an hour or two).

| # | Item | Size |
|---|---|---|
| 1 | Contract, fixtures, content assembly | W |
| 2 | Engine core: match, score, rng, round | W |
| 3 | Progress math: heatmap, diagnose, milestones | D |
| 4 | Storage: store, migrate, export/import | D |
| 5 | Design brief and token lock (from G11 starting tokens) | D |
| 6 | Shell UI: title, menu, settings, privacy card, About, How we count, keyboard, heat map | W |
| 7 | Renderers: corners, falling, pause, speed, live region, practice | W |
| 8 | Lessons: Lesson 0, ladder, test out, recommendation, dip notice, Why page | W |
| 9 | Built-in adaptive layer | D |
| 10 | AI route with brakes and golden set | D, D |
| 11 | Milestones and share card | D |
| 12 | Daily drill | D |
| 13 | Ghost race, then attract mode | D, D |
| 14 | Sound sets and Spec Wave easter egg | D |
| 15 | Spanish pack, validator CLI, MCP server | D, D |
| 16 | Ship: PWA, analytics, 11-point check, a11y pass, README, Kiro write-up, video, Devpost | W |

Six weekend-sized items and three building weekends left, so weekdays carry real weight and the cut order will likely be used.

**Checkpoint, not a deadline:** at the end of the Nov 21 to 22 weekend, look at the protect list. Anything on it still open moves to the top; the cut order starts from the bottom.

**Cut order if behind:** attract mode, MCP server, sound sets, ghost race, Spanish pack down to accented vowels.
**Protect list:** both mechanics, lesson ladder, heat map and diagnosis, built-in adaptive layer, local progress and privacy card, accessibility core, How we count page, share card.

---

## G14. README plan

The README carries what judges can't see by playing.

1. What it is, the tagline, the manifesto, the NCES number, a GIF of attract mode, live link.
2. The two resurrections: MasterType and Type Attack, and Office Keys (August 2025, first Lovable build), with what Dead Keys kept and what it changed.
3. How to play, in four lines.
4. How we count (links the in-app page).
5. Architecture: the diagram from G3, the file map, one file one responsibility.
6. **Decision records**, short form (context, decision, why, trade-off): contract first; local-only storage; two-layer adaptive with built-in fallback; Nova Micro and its lifecycle risk; Vercel function over Lambda; vanilla JS with JSDoc; synthesized sound over audio files; in-memory caps and why that's acceptable; README Clew 2 visual system.
7. **How it was built with Kiro:** steering files and inclusion modes, specs per block with an example EARS criterion, the hook table with lifecycles and why hooks are retired, Ponytail via AGENTS.md, Vercel driven from the IDE, the test table, the MCP server.
8. **Planning disclosure** (see G15).
9. Privacy and accessibility statements, same wording as the app.
10. Credits and licenses: MIT, word list CC BY 3.0, research citations, MasterType and Type Attack, Office Keys.
11. Run it locally.

---

## G15. Security, ship, teardown

**11-point check**

| # | Item | Dead Keys |
|---|---|---|
| 1 | Authorization | N/A: no accounts |
| 2 | Validation | Client and server, every request field and every response character |
| 3 | CORS | Own origin only |
| 4 | Rate limiting | Per-visitor hourly limit plus daily cap (approximate, G8) |
| 5 | Password reset | N/A |
| 6 | Frontend errors | try/catch on every fetch and storage call, fallback drill |
| 7 | DB indexes | N/A |
| 8 | Logging | Usage ledger, no player data beyond weak keys and WPM |
| 9 | Alarms | AWS Budgets at $5 |
| 10 | Rollback | Vercel redeploy, git tag per block |
| 11 | Prompt injection | No player text to the model, charset-checked output |

**Planning disclosure (README section and `docs/prior-work.md`):**
- Office Keys (github.com/earlgreyhot1701D/office-keys, type-speed-boost.lovable.app), built with Lovable in August 2025. Dead Keys grew from its ideas. No code is reused.
- README Clew 2 (github.com/earlgreyhot1701D/readme-clew-2), October 2026. Its color and type token values are reused as Dead Keys' starting design system. No code files are copied.
- A throwaway feel test comparing the two mechanics was made on Oct 17, 2026, before the submission window. No code from it is in this project.
- The PRD, research notes, seed decisions, cover art, and X image were made before the build. They are planning and marketing assets, not code, and live in `docs/`.

**Submission checklist:** public repo, MIT in About, `/.kiro` committed, live URL, video under 3 minutes on YouTube (synthesized sounds only, no copyrighted music, no Kiro logo), text description, Kiro write-up, category Resurrection, planning disclosure, Bonus Blog post (dev.to "Kiroween, Week Zero" post counts; a Builder Center post may not count as third-party), Social Blitz post starting #KiroweenHackathon26.

**Video beats (draft):** attract mode → press a key → calibration → heat map and diagnosis → lesson recommendation and test out → one round of each mechanic → AI drill label, cap hit, label flips to built-in → progress and milestone → share card → manifesto and the NCES number → tagline → credits.

**AWS teardown checklist:** IAM user and policy, access key, Budgets alert, log groups. After judging closes (Jan 29 2027) or at v2 decision: delete the access key, user, and policy; remove Vercel env vars; keep or delete the Budgets alert. Record the date.

---

## Ahead-of-Schedule Shelf

| Rank | Add | Time | Why |
|---|---|---|---|
| 1 | README GIF of attract mode | 20 min | First thing a judge sees in the repo |
| 2 | Open Graph image for link previews (reuse the X image) | 10 min | Every shared link looks finished |
| 3 | Streak calendar on Progress | 45 min | Makes "short and daily" visible |
| 4 | Court pack sample, 20 items | 45 min | Shows the pack system and your domain |
| 5 | Graveyard Shift endless mode | 60 min | Name already stubbed |
| 6 | Layout detection where the browser supports it | 30 min | Helps non-QWERTY visitors |

---

## Decisions

| # | Decision | Status |
|---|---|---|
| D1 | AI route on a Vercel function | Decided Nov 7 |
| D2 | Vanilla JS with JSDoc | Decided Nov 7 |
| D3 | End state: shipped build, v2 decided ~Feb 3 | Decided Nov 7 |
| D4 | UI direction | Decided Nov 7: README Clew 2 aesthetic (G11) |
| D5 | Tally form | Approach decided: short, mostly ratings and multiple choice so Tally's free answer charts do the analysis, one optional open question. Drop-off by question needs Tally Pro. Questions drafted in item 6. |
| D6 | Manifesto | Decided Nov 7 ("helped me improve" wording, G1) |
| D7 | Tagline | Decided Nov 7: "a typing game, back from the dead" (G1) |

---

## Changelog

- **Nov 11 2026, note.** H1 (line-cap) moved from Post Task Execution to Stop, because PostTaskExec only fires through Kiro's task runner and tasks here are ticked by editing `tasks.md`. The G12 table is unchanged.
- **Nov 11 2026, note.** UI track started (G11 already runs it in parallel with Blocks 1 to 3): `docs/design-brief.md`, mock round 1 compared across Claude Design, Google Stitch and ChatGPT. Added to steering: mock data and fixtures never ship; the build output is searched before every production deploy.
- **Nov 11 2026, note.** Sandbox not used: it blocked `npm install` on Windows, so `sandbox.json` was removed under G12's existing fallback. No gate reopened. Logged in `KIRO-NOTES.md`.
- **Nov 11 2026, v1.5.** Repo set up in `C:\Users\corde\projects\dead-keys`. Ponytail moved to `.kiro/steering/ponytail.md` (its own Kiro adapter). Versions pinned. Vercel MCP caveat recorded.
- **Nov 11 2026, v1.4.** G12 adds the rest of Kiro's project setup from kiro.dev docs: `.kiroignore`, MCP config, sandbox, two read-only custom agents (reviewer, a11y-auditor). Skills stubbed, workflows out of scope.
- **Nov 11 2026, v1.3.** Cost table: 100,000 calls now "about $5" (was $5.08), with the exact per-call figure stated above the table. Sprint plan: first build day Wed Nov 11. Points to the start-here doc.
- **Nov 7 2026, v1.2.** D4 decided: README Clew 2 aesthetic, starting tokens listed in G11. D7 tagline locked. Vercel wired and deployed from Kiro (CLI and MCP), with secrets entered by Shara only. Test table added to G12. Prior-work disclosure adds README Clew 2 token reuse and the cover art.
- **Nov 7 2026, v1.1.** Manifesto wording changed to "helped me improve." Office Keys added as the second resurrection. Planning disclosure added. Never-list line added: no code from Office Keys or the feel test.
- **Nov 7 2026, v1.0.** Approved. All gates closed.
- **Nov 7 2026, v0.2.** Spike 0 longevity check done. Kiro section rebuilt from kiro.dev docs. Brakes recalculated from Nova Micro pricing. Added test out, How we count page, Arcade sound set, Spec Wave easter egg, Vercel Web Analytics, research warehouse stub, content sources with licenses, README plan. Calendar replaced with sprint plan. D1 to D3 decided.
- **Nov 7 2026, v0.1.** First full draft.
