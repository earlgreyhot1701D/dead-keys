# Attract mode: design (Block 13b)

## Files

| File | Job |
| --- | --- |
| `src/attract/bot.js` | Pure: the demo typist's next key, a demo round, one demo step, the timings |
| `src/attract/demo.js` | The title's demo: idle wait, live field, Pause demo, stop on input, reduced motion |
| `src/ui/screens/title.js` | Uses the demo: its scene, its header controls, and input from keys, clicks and scrolls |
| `src/styles/attract.css` | The live field's place and the header controls |
| `src/ui/fakeDom.js` | `removeAttribute`, for the demo's tests |
| `src/ghost/ghost.js`, `src/ui/screens/play.js` | The Play screen's ghost hint |
| `src/ui/screens/howWeCountText.js` | One line in Bests about the ghost |

## Decisions

1. A live typist, not a recording. The PRD says "a recorded run" that "reuses ghost-race playback". A saved ghost is keystrokes only, without its words, so replaying it on new words would miss. A typist on the real engine is the game playing itself, labeled DEMO, and needs no stored file.
2. The demo uses the game's own field renderers, so it can never drift from how the game looks.
3. Words fall behind the panel in the middle lanes and come out below it; the side lanes stay in view, as in the mock.
4. The ghost line went into Bests, not a section of its own: a ninth panel made How we count scroll at 1440 x 900 (the fit test caught it).
5. Built by Claude to save Kiro credits; Kiro commits and deploys.

## Copy table (binding)

| Where | Words |
| --- | --- |
| Header status | [Demo playing] / [Demo paused] |
| Header button | Pause demo / Resume demo |
| Field tag | STATION_ID: TER-84 // DEMO |
| Play rules, ghost hint | Beat your best at 90% accuracy or better and it becomes your ghost. Next round, you race it. |
| How we count, Bests (added to the first line) | Each new best becomes your ghost: AHEAD and BEHIND count letters typed right at the same moment. |
