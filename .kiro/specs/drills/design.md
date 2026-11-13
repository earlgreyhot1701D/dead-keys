# Design: Block 9, built-in drills

## Files

| File | Change |
|---|---|
| `src/drills/weights.js` (new) + test | `DRILL_BASE`, `itemWeights(items, keyStats)` |
| `src/engine/targets.js` + test | `spawn`: weighted pick when `state.weights` is set; uniform otherwise, same random number |
| `src/engine/round.js` + test | `createRound({ ..., weights })`: optional, copied, length must match items |
| `src/ui/screens/play.js` | `ROUND_KINDS.drill` |
| `src/ui/screens/round.js` | weights from `ctx.state.progress.keys` for a drill; `drillSource` from the kind; the live line |
| `src/ui/screens/results.js`, `src/ui/components/resultsPanels.js` | header badge, DRILL SOURCE row, Play again for a drill |
| `src/render/stage.js`, `src/render/playHud.js`, `src/styles/playHud.css` | the HUD badge |
| `src/ui/components/progressPanels.js`, `src/ui/screens/progress.js`, `src/styles/progressWeak.css` | the real button and the no-weak-keys line |
| `src/ui/screens/howWeCountText.js` | the Drills section |
| `e2e/drills.spec.js` (new), `e2e/screenshots.spec.js` | Req 7 |

Several of these files are at 149 lines. When a change would pass 150, move the new part into a new file next to it (for example `src/ui/components/drillLabel.js`, `src/ui/screens/howWeCountDrills.js`). That is allowed without asking; list each split in KIRO-NOTES.

## Weighted pick (one random number, as today)

`a = next(rng)`. Uniform today: `pool[floor(a.value × pool.length)]`. Weighted: walk the pool adding weights until the running sum passes `a.value × total`. Same `a` and `b` draws as today, so slot choice and the rest of the round are unchanged.

## Mock-to-build map (binding)

| Mock element | Build |
|---|---|
| Falling HUD `[ DRILL: BUILT-IN ]` (3px double rule, `#142225` fill, after SECTOR) | Keep, drill rounds only. Practice HUD has no SECTOR, so the badge sits after the practice note |
| Falling HUD `LIVES`, `SECTOR: WAVE 04 · 12 LEFT` | Drop for a drill (drills play as Practice) |
| Results header `[ DRILL: BUILT-IN ]` under the MODE line | Keep, drill rounds only |
| Results `MODE: FALLING // PACK: GENERAL` | Real: a drill reads `MODE: PRACTICE // PACK: GENERAL` |
| Results breakdown `DRILL SOURCE  BUILT-IN` | Keep, drill rounds only, last row |
| Progress `DRILL READY // YOUR TOP WEAK KEYS`, `Targeting your 6 weakest keys:` | Drop: the built panel's "Your top weak keys" heading and "Keys to practice" line stay (Block 6 decision) |
| Progress weak key caps | Keep as built |
| Progress `[ DRILL THESE KEYS ]` | Real: the existing `Drill these keys` button, now working |
| Progress `[ LESSON 1 ]`, `Next lesson: ...` | Keep as built in 8a (the `Lessons` button) |
| Mock's AI-generated badge (four-corner screen) | Block 10 |

## Copy table (binding)

| Where | Words |
|---|---|
| HUD badge, results badge | `[ DRILL: BUILT-IN ]` |
| Results row | `DRILL SOURCE` / `BUILT-IN` |
| Results h1 line for a drill | as Practice: `ROUND_OVER // PRACTICE` |
| Progress button | `Drill these keys` |
| Progress, no weak keys | `Play a few rounds first. Drills aim at the keys you miss.` |
| Live region, drill start | `Drill: built-in.` |
| Screen h1 (screen readers) | `Drill` |
| How we count heading | `Drills` |
| How we count lines | `A drill uses only words with at least one of your weak keys, when the pack has {DRILL_MIN_WORDS} or more of them. Each letter adds its miss rate plus {DRILL_BASE} to the word's score, so a word full of keys you miss comes up more often.` / `Every drill says where its words came from.` |

## Decisions

1. Weights only in drills; one random number per pick, so non-drill rounds replay exactly as before.
2. Keys under 10 attempts weigh as 0 miss rate, matching the heat map's enough-data bar.
3. Mode stays `practice` with `drillSource: "built-in"`: no contract change.
4. Weights are taken once when the drill starts, not updated mid-round.
5. **Drill pool, decided by Shara, Nov 12 (built by Claude).** Kiro's flag 1 showed weights alone barely move one weak key (about 1 drill in 5 showed a q-word early). A drill now draws only from words with at least one of the player's weak keys (Progress's up-to-6), when the pack has at least `DRILL_MIN_WORDS` (8) of them; otherwise from the whole pack. The G5 weights still order the pool. Weights live on the item copies (Kiro's flag 2), which does the same job as `state.weights`.
