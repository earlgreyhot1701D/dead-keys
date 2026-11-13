# Daily drill: design (Block 12)

## Files

| File | Job |
| --- | --- |
| `src/drills/daily.js` | Pure: the date seed, the 2-minute limit, the clock watch (`createWatch`, `clockFor`), today's best |
| `src/ui/screens/menuRounds.js` | The menu's one-step rounds: Practice (moved from round.js at the line cap) and Daily drill |
| `src/ui/screens/play.js` | `ROUND_KINDS.daily`: falling layout, `limitMs` |
| `src/ui/screens/drillRound.js` | A daily round's seed and start line |
| `src/ui/screens/round.js` | Runs the clock after each frame and ends the round at the limit |
| `src/render/stage.js`, `src/render/playHud.js` | TIME LEFT, counting down, when the round has a limit |
| `src/ui/components/menuDaily.js` | The menu's Daily drill panel |
| `src/styles/menuDaily.css` | The panel's layout, as the mock |

No engine change: the engine already knows mode `daily`, and the clock lives in the UI, which already owns frames.

## Mock-to-build map (binding)

| Mock | Build |
| --- | --- |
| DAILY DRILL, TODAY tag, LIMIT: 02:00 | As drawn |
| Ghost icon | Kept, `aria-hidden` |
| "Race yesterday's ghost: 36 WPM" | STUB until Block 13. Today's best, or the ready line, takes its place |
| "TARGET PACE: 180 CPM" | STUB until Block 13 (needs the ghost) |
| "SAME SEED FOR EVERYONE TODAY" | "SAME WORDS FOR EVERYONE TODAY" (a player doesn't know what a seed is) |
| [ START ] | Start, named "Start daily drill" for a screen reader |

## Copy table (binding)

| Where | Words |
| --- | --- |
| Panel title | DAILY DRILL |
| Tag | TODAY |
| Limit | LIMIT: 02:00 |
| Best today | Today's best: {wpm} WPM |
| None today | Today's words are ready. |
| Same words | SAME WORDS FOR EVERYONE TODAY |
| Button | Start (screen reader: Start daily drill) |
| HUD clock | TIME LEFT: {m:ss} |
| Live, start | Daily drill: two minutes. Same words for everyone today. |
| Live, 30 s left | 30 seconds left. |
| Live, end | Time's up. |
| Results mode line | MODE: DAILY // PACK: GENERAL |

## Decisions

1. Built by Claude to save Kiro credits; Kiro commits and deploys.
2. The daily drill is a Falling words round with lives and waves and a 2-minute cap, not a practice round, so it counts toward bests (`bests.daily`).
3. Active time only, so pause is always fair and the WCAG timing rule holds: the player can stop the clock at any time.
4. Practice moved to `menuRounds.js` to keep `round.js` under 150 lines; no change to how it plays.
