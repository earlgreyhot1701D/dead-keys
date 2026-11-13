# Requirements: Block 9, built-in drills

**Spec:** `drills` (PRD G5 weighted sampling, G8 layer 1, G10 live region). **Rigor:** Full for sampling and recording, Working for layout.
**Status:** Approved by Shara, Nov 12 (the three choices below).
**Sources:** `mock/index.html` screens "Play: falling targets" (the `[ DRILL: BUILT-IN ]` HUD badge), "Results" (header badge and the DRILL SOURCE row) and "Progress + heat map" (the drill panel). The mock-to-build map and copy table in `design.md` are binding: anything they don't cover, stop and ask.

## Introduction

A drill is a calm round whose falling words lean toward the keys you miss. It is the built-in layer of PRD G8: always on, offline, no AI. Block 10 adds the AI layer on the same round and swaps the label to AI-generated.

## Shara's choices (Nov 12)

1. Weighted sampling applies to drill rounds only. Play, Practice, Play these keys and lessons do not change.
2. A drill plays like Practice: falling layout, no lives, no waves, end it from the pause menu.
3. With no weak keys yet, the Drill these keys button still shows, with one line under it (copy table).

## Scope

**In:** item weights (G5), weighted spawning when weights are given, the drill round, the drill label in the HUD and on results, Play again for a drill, the Progress drill button and its no-weak-keys line, the drill line in the live region, the "Drills" section of How we count.
**Out (STUB):** AI drills (Block 10), the daily drill (Block 12), the main menu Daily drill item (stays "Not built yet").
**Never:** changing the contract. A drill records as mode `practice` with `drillSource: "built-in"`, which the contract already allows.

---

## Requirement 1: Item weights

1. `src/drills/weights.js` SHALL give each item a weight: the sum, over its characters, of that key's miss rate plus `DRILL_BASE` (0.05, PRD G5).
2. A key's miss rate is misses ÷ attempts from the saved key stats. A key with fewer than `MIN_KEY_ATTEMPTS` (10) attempts, or no stats, counts as 0, the same bar the heat map uses.
3. Keys match the way the heat map matches them (same case rule). Every weight is finite and greater than 0.
4. Pure, no DOM, no storage. Property tests: every weight > 0; a word made only of a 100%-missed key outweighs the same-length word of unseen keys; with no stats every weight is `DRILL_BASE` × length.

## Requirement 2: Weighted spawning

1. `createRound` SHALL accept an optional `weights` (one per item, same order). Without it, spawning is exactly as today: the same seed gives the same targets as before this block (regression test against a recorded sequence).
2. With weights, `spawn` picks from the same first-letter-free pool, by weight, using the same one random number it uses now. The one-word-per-first-letter rule still holds.
3. Property tests: picks always come from the pool; same seed and weights give the same sequence; over 2,000 seeded picks, an item with 10× the weight of the others is picked at least 5× as often.

## Requirement 3: The drill round

1. `ROUND_KINDS` SHALL gain `drill`: mode `practice`, falling layout, title `Drill`, `drillSource: "built-in"`.
2. Starting a drill computes the weights from the saved key stats at that moment and passes the general pack's words with them.
3. The finished round records with `drillSource: "built-in"`; everything else records as Practice does today (heat map, bests, milestones unchanged).
4. When the drill starts, the live region says `Drill: built-in.` once.
5. Play again on a drill's results starts a new drill, with weights from the stats as they are now.

## Requirement 4: Labels

1. During a drill the HUD SHALL show the `[ DRILL: BUILT-IN ]` badge where the mock draws it. Other rounds show no badge.
2. A drill's results show the same badge in the header and a `DRILL SOURCE` / `BUILT-IN` row in the round breakdown. Other rounds show neither.

## Requirement 5: Progress

1. The Progress screen's `Drill these keys` button SHALL start a drill (it stops saying "Not built yet").
2. With no weak keys, the button still works (a drill with no stats is weighted by length only) and the copy-table line shows under it.

## Requirement 6: How we count

1. A `Drills` section SHALL be added last, after "What leaves your browser", word for word from the copy table, with 0.05 read from `DRILL_BASE`.
2. How we count still fits one screen at 1440x900, 1366x768 and 1280x720 (fit.spec.js). Claude checked it fits as the last panel.

## Requirement 7: Checks

1. Unit and property tests for Requirements 1 to 3. e2e (`e2e/drills.spec.js`): with saved stats that make `q` weak, Drill these keys starts a drill, the HUD badge shows, at least one falling word has a `q` within the first 8 words, ending from pause shows the results badge and row, Play again starts another drill; with no stats the line shows and the drill still starts.
2. axe on the drill HUD and drill results: 0 serious or critical. No page scrolls at three sizes.
3. Screenshot pairs: drill HUD and drill results against the mock's falling and results screens, at 1440x900 and 1366x768.
