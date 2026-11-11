# Design: Block 3, progress math

**Spec:** `progress`. **Requirements:** `requirements.md` (approved Nov 11). **Rigor:** Full.
**Status:** Approved by Shara Nov 11.

## Shape

Same rules as the engine: pure functions, no clock, no randomness, never change their input. Each function takes saved data in and returns new data out. Storage (Block 4) and the screens (Blocks 6, 8, 11) call them.

```
round ends -> toResult (Block 2)
           -> mergeRound(keys, result)            keystats.js
           -> updateBests(bests, result)          milestones.js  -> { bests, newBest }
           -> newMilestones(progress, result, localDay) milestones.js -> Milestone[]
heat map   -> bandFor(keyStat) / heatmap(keys)    heatmap.js
results    -> diagnose(keys)                      diagnose.js    -> Diagnosis
```

## Files

| File | Job | Exports |
|---|---|---|
| `src/engine/progressConfig.js` | Every Block 3 threshold and key group, named | `MIN_KEY_ATTEMPTS` 10, `BANDS` (cutoffs, glyphs, labels), `GROUP_MIN_ATTEMPTS` 20, `GROUP_RATIO` 2, `HIGH_RATIO` 3, `GROUP_FLOOR` 0.05, `ENOUGH_DATA` 100, `BEST_ACCURACY` 0.9, `STREAK_ROUNDS` 3, `STREAK_ACCURACY` 0.95, `STREAK_DAYS` 7, `WPM_BAND` 10, `GROUPS` |
| `src/engine/keystats.js` | Merge a round's keyDeltas into saved KeyStats | `mergeRound(keys, result)` |
| `src/engine/heatmap.js` | Band per key | `bandFor(stat)`, `heatmap(keys)` returning `{ key, band, glyph, label, missRate }[]` |
| `src/engine/diagnose.js` | Groups, sentences, weak keys | `diagnose(keys)` returning a Diagnosis |
| `src/engine/milestones.js` | Personal bests and milestones | `updateBests(bests, result)`, `newMilestones(progress, result, localDay)` |
| one `*.test.js` per file | | |

## Decisions

1. **Groups (US QWERTY, PRD G7).** Top row `qwertyuiop`, home row `asdfghjkl;`, bottom row `zxcvbnm,./`. Left hand `qwertasdfgzxcvb12345` plus their shifted forms, right hand the rest of the letters, digits and `;,./`. Shift: capitals and shifted symbols. Digits `0-9`. Symbols: everything else in the charset except space. A key can sit in more than one group (row and hand). Space is in no group.
2. **Shifted keys** count toward the shift group and toward their row and hand by their base key, so `A` counts for home row and left hand too.
3. **Sentence text** comes from one template per group with the rate written as "about 1 in N" (N rounded), so no percentages that read like grades. Example: "Your top row misses about 1 in 6 keys, twice your usual rate."
4. **Weak keys** come from all keys with 10+ attempts, not only flagged groups, so drills (Block 9) still get targets when no group is flagged.
5. **Local day** is passed in as `"YYYY-MM-DD"`. Rounds are matched to days by a `dayOf(ms)` function the caller passes too, so time zones never live in the engine.
6. **Milestone ids** are stable strings (`wpm-30`, `acc-streak-3`, `day-streak-7`, `lesson-4`), so "already earned" is a lookup by id.
7. **Personal bests** skip practice and need 90%+ accuracy. A tie isn't a new best.
8. **Contract changes:** `Diagnosis.severity` enum high/medium, `Milestone.kind` enum, `Progress.bests` shape. No version bump; nothing has shipped.

## Tests

| Test | Kind | Catches |
|---|---|---|
| Merging is order-independent and never mutates | property | Lost or doubled attempts |
| More misses never gives a better band | property | Band cutoffs in the wrong order |
| Under 10 attempts is always "no data" | property | Shaky verdicts from 2 keystrokes |
| Diagnosis passes the contract, max 3, worst first, empty when not enough data | property | Drift, wrong order |
| Zero overall misses flags nothing | example | 2× of zero |
| Sentences never contain "bad", "slow", "worse" | property | Tone slipping |
| Bests ignore practice and low accuracy | property | Speed beating accuracy |
| Milestones never repeat and never mention slowing down | property | Duplicate cards |
| 7-day streak across a month end | example | Date math |
