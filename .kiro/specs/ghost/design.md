# Ghost race: design (Block 13a)

## Files

| File | Job |
| --- | --- |
| `src/ghost/ghost.js` | Pure: which modes, build, find and save a ghost, the ghost's right letters at a moment (binary search), your lead, the words |
| `src/render/ghostHud.js` | The HUD box, updated each frame, and the one "passed" line |
| `src/render/stage.js` | Puts the box in either HUD's first group |
| `src/ui/screens/round.js` | Finds the ghost for the round; hands the keystrokes to `finishRound` (not for Play these keys) |
| `src/ui/roundRecord.js` | A new best in a ghost mode saves the ghost; returns `ghost: { raced, saved }` |
| `src/ui/screens/resultsDrill.js`, `results.js` | The ghost line under the mode line |
| `src/ui/components/menuDaily.js` | The daily panel's ghost line and pace |
| `src/styles/playHud.css` | The box and the results line |

No engine change: keystrokes already carry `t` in active milliseconds (engine Req 11 made runs replayable).

## Mock-to-build map (binding)

| Mock | Build |
| --- | --- |
| "Race yesterday's ghost: 36 WPM" | "Race your ghost: 36 WPM". The ghost is your best daily run, which may not be yesterday's, so the words say only what is true |
| "TARGET PACE: 180 CPM // SAME SEED FOR EVERYONE TODAY" | "TARGET PACE: 180 CPM // SAME WORDS FOR EVERYONE TODAY" |
| Ghost icon | Unchanged, `aria-hidden` |
| Play HUD | No mock for the ghost box: built from the HUD's own box style |

## Copy table (binding)

| Where | Words |
| --- | --- |
| HUD box | GHOST: {wpm} WPM, then +{n} AHEAD, {n} BEHIND or LEVEL |
| Live, passed | You passed your ghost. |
| Results, beat | You beat your ghost: {you} WPM to {ghost}. |
| Results, tie | You tied your ghost at {wpm} WPM. |
| Results, lost | Your ghost was faster: {ghost} WPM to your {you}. |
| Results, saved | New ghost saved. Race it next time. |
| Menu, daily | Race your ghost: {wpm} WPM |
| Menu, pace | TARGET PACE: {wpm × 5} CPM // SAME WORDS FOR EVERYONE TODAY |

## Decisions

1. Built by Claude to save Kiro credits; Kiro commits and deploys.
2. The race compares right letters at the same moment of active play, not words on screen: it is fair at any speed setting and needs no second field.
3. The ghost is only replaced by a new personal best (90% accuracy or better), so it is always your best run, and a sloppy fast round never becomes it.
4. Ghost race (13a) ships before attract mode (13b), per the PRD build order.
