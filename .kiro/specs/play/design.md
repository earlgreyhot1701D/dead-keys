# Design: Block 7, play

**Spec:** `play`. **Requirements:** `requirements.md` (approved Nov 11). **Status:** Approved by Shara Nov 11.

## Read this first: no guessing

Everything a screen shows is decided below: the map says what each mock element becomes, and the copy table says every new word. If something on the mock is not in the map, or a screen needs a word that is not in the copy table, **stop and ask**. Do not invent copy, numbers or labels. Do not approximate the mock: read its markup and styles and carry them over as CSS classes in `src/styles/`.

## Mock-to-build map (binding)

### Falling words (mock screen 3)

| Mock element | Build |
|---|---|
| Lanes, falling word cards, locked card with typed and remaining parts, danger zone band, station on the baseline, the beam from the station to the locked word, INPUT_STREAM and TARGET bar | Keep, as drawn |
| `[ ♥ ♥ ♡ ]` lives | Real: one heart per life, 5 at most, filled for lives left |
| `WAVE 04 · 12 LEFT` | Real: wave number (two digits), words left in this wave |
| `34 WPM`, `95%` with bar, `TIME: 1:12` | Real, live |
| `SPEED: 0.8x` | Real: the round's speed, written "0.8×" |
| `[!]` on words in the danger zone | Real: words past 80% of the way down |
| `[·]` on other words | Keep |
| `STATION_ID: TER-84`, `TERMINAL 84`, `SYS.84 // SAVE ... // CRT-SCAN ...`, `[ESC] PAUSE` | Keep (all true) |
| `LOCK: COLUMN_3` | Real: the locked word's lane number, or omit when nothing is locked |
| Word codes (`MAPL_51`, `LANT_42`), `BASELINE: 3.2s`, `SHIELD: 2 OF 3`, `CAPACITOR: ARMED`, `SOUND: OFF` | Drop |
| `[ DRILL: BUILT-IN ]` | Drop (Block 9) |

### Four corners (mock screen 4)

| Mock element | Build |
|---|---|
| Four quadrants with names `QUADRANT // ALPHA [NW]` and so on, the danger ring, the core, the locked word, `TARGET_LOCKED`, `VECTOR SW // CHAR BUFFER: 4/7`, `ACTIVE_BUFFER >` | Keep; CHAR BUFFER and VECTOR are real (typed/length, the locked word's corner) |
| `[LOCKED]` after a quadrant name | Real: on the locked word's quadrant |
| `D:05` per word, `DIST: 04` on the lock | Real: `round((1 - progress) * 10)`, two digits |
| `HOSTILES ACTIVE: 06` | Real: words on screen |
| WAVE_REGISTER, LIVES, SPEED (WPM), ACCURACY, TIME | Real, live |
| `CORE 84` | Keep (flavor) |
| `DEF: ON`, `OPERATIVE // 01`, `SHIELD 2/3`, `SYS_RDY`, `MATCH RATE: 100%`, `[ DRILL: AI-GENERATED ]` | Drop |
| `SPEED: 0.8x` | Real, written "0.8×" |

### Results (mock screen 5)

| Mock element | Build |
|---|---|
| Header, `ROUND_OVER // WAVE_04_REACHED`, `DEAD KEYS // ROUND RESULTS` | Keep; the wave is real (practice: `ROUND_OVER // PRACTICE`) |
| `MODE: FALLING`, `PACK: GENERAL` | Real |
| Stat tiles WPM, ACCURACY, CLEARED, TIME | Real. The mock's sublines become plain explanations (copy table), always visible. "+n WPM over your last ... round" is a pill by the WPM number, only when faster |
| `PASS LINE 95%` on accuracy, `SESSION: 15`, `NODE: 0x84-RESULTS` | Drop SESSION and PASS LINE; NODE is flavor, keep |
| Milestones panel with the new-best line and milestone cards | Real, from `updateBests` and `newMilestones`; the panel shows "No new records this round." when there are none |
| System coach / dip notice | Drop (Block 8) |
| Round breakdown: keystrokes, correct characters, missed keys `16 [TOP: a, q]`, target breaches, accuracy bar | Real. Drop the DRILL SOURCE row and the pass-line row |
| Word log | Real: the last 8 words, cleared as `[·] word CLEARED`, a word that reached the bottom as `[!] word BREACHED`; then "+ n more" |
| `[ PLAY AGAIN ]`, `[ VIEW PROGRESS ]` | Keep |
| `[ SHARE CARD ]` | "Not built yet" (same disabled style as progress's future buttons) |
| Feedback link | Drop (Block 16) |
| Footer `[ENTER] PLAY AGAIN [TAB] MOVE [ESC] MAIN MENU` | Keep |
| New: free continue line | Add, only when it was used |

## Copy table (every new word in this block, approved)

| Where | Text |
|---|---|
| Mode picker h1 and line | h1 "Play". Line under it: "Pick how the words come at you." |
| Mode picker, Falling words | Name "Falling words". How it plays: "Words drop down six lanes toward your station. Type the first letter to lock a word, then finish it before it lands." |
| Mode picker, Four corners | Name "Four corners". How it plays: "Words close in from four corners toward the core. Type the first letter to lock the closest one, then finish it before it reaches the ring." |
| Mode picker, both (one panel under the choices) | "Lives are the arcade part. A word that lands costs one; a wrong key never does. Words speed up each wave, and you get one free continue. Running out just ends the round, and it's still saved. Want no pressure? Try Practice from the menu." Then: "Escape pauses." |
| Mode picker, speed (Shara, Nov 11) | A speed slider on the picker, labelled "Speed", same range and steps as Settings (0.5× to 2×), showing the value like "1.2×". It starts at the saved speed, and changing it saves it (the same setting Settings shows). Hint under it: "Slower words give you more time. You can change this any time." |
| Mode picker badge | SELECT |
| Practice h1 | Practice |
| Practice HUD note | No lives, no clock pressure. End the round from the pause menu. |
| Pause dialog | Title "Paused". Buttons "Resume", "End round". |
| Out-of-lives dialog, continue left | Title "Out of lives". Line under the title: "That's the arcade part. Nothing is lost." Then line 1, real numbers: "So far: <wpm> WPM, <n> words cleared, wave <w>." Line 2: "Continue: your 5 lives come back and you keep going from wave <w>, with this score. You get one continue per round." Line 3: "End round: see your results. Either way, this round is saved." Buttons "Continue", "End round". |
| Results, continue used | Free continue used this round. |
| Results stat explanations (always visible, small, under each number; no hover tooltips) | WPM: "Words per minute. Every 5 correct letters count as 1 word." / Accuracy: "Keys you got right, out of every key you pressed." / Cleared: "Words you finished." / Time: "Time played. Pauses don't count." |
| Results, faster than last time | "+<n> WPM over your last <mode> round" (shown as a small pill next to the WPM number, only when faster) |
| Results breakdown explanations (small, after each label) | Keystrokes: "every key you pressed" / Correct characters: "keys that matched" / Missed keys: "the keys you missed most" / Breaches: "words that reached your station" (corners: "words that reached the core") |
| Results link under the stats | "How we count every number" (opens How we count) |
| Results, no records | No new records this round. |
| Results, new best | New best: <n> WPM. Your old best was <m>. (first best: "New best: <n> WPM.") |
| Wave banner | WAVE <nn> |
| Live region | Cleared <word>. / Life lost. <n> left. / Wave <n>. / Out of lives. / Paused. |
| Share card button | Share card, with "Not built yet" under it |

## Files

| File | Job |
|---|---|
| `scripts/build-pack.js`, `packs/general.json`, `packs/blocklist.txt`, `packs/general.test.js` | The word pack (Req 1) |
| `src/engine/config.js`, `targets.js`, `round.js`, `lifecycle.js`, `score.js`, `diagnose.js`, `progressConfig.js` and tests | Deferrals (Req 8); engine stays pure |
| `src/render/loop.js` | requestAnimationFrame loop, dt clamp, visibility auto-pause, stop on close |
| `src/render/falling.js`, `src/render/corners.js` | Draw one frame of each mechanic from engine state (DOM, `textContent`, transforms) |
| `src/render/hud.js` | The HUD values, as pure functions of state (unit-tested) |
| `src/render/moments.js` | Miss, clear, wave-up effects; reduced-motion versions |
| `src/a11y/announce.js` | Event to spoken line, pure and unit-tested |
| `src/ui/screens/play.js` | Mode picker |
| `src/ui/screens/round.js` | The play screen: engine + loop + renderer + keys + dialogs; ends at results |
| `src/ui/screens/results.js` + `src/ui/components/resultsPanels.js` | Results |
| `src/ui/app.js` | New action `finishRound(result, localDay)`: record, save (never when `persist` is false), return what changed (new best, new milestones) |
| `src/styles/play*.css`, `src/styles/results*.css` | Locked look, one job per file, under 150 lines each |
| `e2e/play.spec.js`, `e2e/screenshots.spec.js` (add pairs) | Req 9 |

## Decisions

1. **Positions.** Falling: x from `slot` (6 lanes across the play area, as the mock draws; Shara, Nov 12), y from `progress`. Corners: each slot is a corner; a word moves along the line from its corner to the core by `progress`. Use CSS transforms; only `transform` and `textContent` change per frame.
2. **Danger.** Falling `[!]` from progress 0.8. Corners `[!]` inside the ring, also progress 0.8.
3. **Live WPM and accuracy** come from `score.js` with the round's counts so far (same math as results).
4. **Round end.** `endRound` then `toResult(state, { id: "round-" + now, date: now, packId: "general", lessonId: null, drillSource: null })`, then `app.finishRound`. Local day is `YYYY-MM-DD` from the player's clock.
5. **Mode ids.** Falling words: mode `falling`, mechanic `falling`. Four corners: mode `corners`, mechanic `corners`. Practice: mode `practice`, mechanic `falling`.
6. **Fit.** Play screens use the same fit as Block 6 (`src/ui/fit.js`): designed at 1440x900, no page scroll.
7. **Focus during play.** The play area takes focus when the round starts; keys go to the engine only while no dialog is open.
8. **Router.** Add screens `play` (mode picker), `round`, `results`, `practice` to `main.js`. The menu's Play and Practice items then show as built.
