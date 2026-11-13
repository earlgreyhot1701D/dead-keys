# Design: Block 10, AI drills

## Files

| File | Job |
|---|---|
| `api/drill.js` | The Vercel function: method, size and origin checks, validate, limits, call, validate, respond, ledger |
| `api/limits.js` + test | Per-visitor hourly limit and daily cap, in memory |
| `api/bedrock.js` + test | The only AWS SDK import: Converse call, returns `{ text, stopReason, usage, ms }` |
| `api/prompt.js` + test | Builds the system and user message from a DrillRequest. No player text |
| `api/answer.js` + test | Stop-reason check, split into lines, validate as DrillResponse |
| `api/ledger.js` + test | One JSON log line per call |
| `src/drills/aiClient.js` + test | Browser POST, 4 s timeout, validate, words from lines |
| `src/drills/aiWords.js` + test | Lines to deduplicated pack-charset words |
| `src/ui/screens/drillRound.js` | AI first when on, then built-in |
| `src/ui/components/drillButton.js`, `drillLabel.js`, `src/ui/screens/resultsDrill.js`, `progressPanels.js` | Waiting line, nudge line, AI badge and row |
| `src/ui/screens/howWeCountDrills.js` + test, `.kiro/specs/drills/design.md` (its copy row) | The Drills section's last line |
| `src/storage/settings.js`, `src/ui/screens/settings.js` | The AI switch works (it already stores) |
| `evals/golden.json`, `evals/run.js` | Golden set |
| `.kiro/hooks/golden-set.json` | Hook H5 |
| `docs/aws-teardown.md` | Teardown checklist |
| `e2e/aiDrills.spec.js` | Req 7.2 |

Split any file that would pass 150 lines; list each split in KIRO-NOTES.

## Charset

The contract checks `DrillResponse` lines against `ctx.charset`. Lines have spaces between words and the general pack's charset is `a` to `z`, so both server and browser pass `pack.charset + " "`.

## Prompt (`api/prompt.js`)

System: you write typing practice. Output only plain lines of lowercase English words separated by single spaces, nothing else. No numbers, no punctuation. Up to 8 lines, each at most 80 characters. Every word must be a real common English word. Most words must contain at least one of the target keys.
User: target keys with miss rates (for example `q 0.50, z 0.30`), and the typist's speed (`about 24 words per minute`). Nothing else.
Temperature 0.7. `maxTokens` 300.

## Order of the drill start

1. Read settings and weak keys. AI off or no weak keys: built-in (Block 9 path).
2. Show the waiting line, disable the button, POST.
3. AI words (at least 8): AI drill. Else built-in. Either way the round starts with its own label.

## Mock-to-build map

| Mock element | Build |
|---|---|
| Four-corner HUD `[ DRILL: AI-GENERATED ]` with a small filled square | Keep the words; the badge looks like the built-in one (no square), so the two only differ in words. The square is dropped |
| Everything else | As Block 9 |

## Copy table (binding)

| Where | Words |
|---|---|
| HUD and results badge, AI | `[ DRILL: AI-GENERATED ]` |
| Results row, AI | `DRILL SOURCE` / `AI-GENERATED` |
| Live region, AI | `Drill: AI-generated.` |
| Progress, waiting | `Writing your drill...` |
| Results pack line, AI drill | `PACK: AI WORDS` |
| Progress, AI off and weak keys (nudge) | `Want fresh words? Turn on AI drills in Settings.` |
| How we count, Drills, last line (replaces `Every drill says where its words came from.`) | `With AI drills on, the AI gets only your weak keys and speed. Every drill says where its words came from.` |

## Decisions

1. The function answers 200 with `{ error }` for caps and model failures, so the browser's fallback is one path.
2. Words, not lines, become the drill, because drills are falling words. The lines exist so the model writes natural word lists.
3. The AI badge drops the mock's square so the label is the only difference (no color-only signal).
4. Limits are in memory and approximate, as PRD G8 accepts. The ledger replaces the usage guesses after a week.
5. **Rulings on Batch A flags, Shara, Nov 12.** Helpers live in `api/_lib/` (Vercel makes every `.js` in `api/` a function; `_` folders are skipped); hook H5 watches `api/_lib/prompt.js`. Only weak keys in the pack charset are sent; none left means built-in. A daily cap refusal is quiet and doesn't count against the visitor. The Bedrock call has a 3.5-second server timeout (Req 2.8). Same origin means a matching `Origin` header; no header is refused. The AI fetch lives in `src/drills/aiClient.js`. The lockfile's two optional `@emnapi` entries are re-added by Claude after Kiro's commit (they matter for `npm ci` on Linux, where Vercel builds).
6. **Rulings on the e2e stop, Shara, Nov 12.** The note under the drill buttons spans the whole button row (option 1), no copy or spacing change. An AI drill's results read `PACK: AI WORDS`. The shared polite note, the `announce` argument and the two splits stand as built. Fit fix (Claude, Nov 12): the Progress speed chart is 92% of its column, centered, so it is shorter and the page fits at all three sizes with the nudge showing. The lockfile carries the two optional `@emnapi` entries again; without them `npm ci` fails on Linux.
