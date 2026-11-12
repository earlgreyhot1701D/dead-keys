# Requirements: Block 7, play

**Spec:** `play` (PRD G2 core play, G5, G10, G11; backlog item 7: renderers, pause, speed, live region, practice). **Rigor:** Working for layout, Full for anything that records or saves a round.
**Status:** Approved by Shara Nov 11 (mock-to-build map and defaults approved before this spec was written).
**Sources:** `mock/index.html` screens 3 (falling), 4 (corners), 5 (results) are the spec for how play looks. `docs/design-brief.md` (locked look, copy rule). The mock-to-build map in `design.md` is binding: it says, element by element, what to keep, what shows real data, what is "Not built yet" and what is dropped. Engine API: `src/engine/` (Block 2). Record and save: `src/engine/record.js`, `src/storage/saveClear.js` (Block 4). `KIRO-NOTES.md` rows "Deferred to Block 7".

## Introduction

This is the first block where Dead Keys plays. A player picks falling words or four corners from Play, or opens Practice, types, sees results, and the round is saved. Nothing in this block is new math: the engine, scoring, progress and storage already exist and are tested. This block draws them, drives them with a clock and the keyboard, and records the result.

## Scope

**In:** the general word pack, a mode picker, the falling and corners play screens, practice, the pause and out-of-lives dialogs, the results screen, the three moments (miss, clear, wave up), the live region for play, the game loop, and the Block 7 deferrals.
**Out (STUB, never half-built):** drills and the drill label (Block 9), lessons, test out, dip notice and coach note (Block 8), share card (Block 11), daily drill (Block 12), ghost race and attract mode (Block 13), sound and Spec Wave (Block 14), feedback link (Block 16).

---

## Requirement 1: The general word pack

1. `packs/general.json` SHALL be a valid Pack (contract) with id `general`, built by `scripts/build-pack.js` from the top-english-wordlists list (github.com/david47k/top-english-wordlists, CC BY 3.0), with the attribution line from PRD G6.
2. Its `words` pool SHALL hold 1,500 words, most frequent first, each 3 to 8 letters, lowercase a to z only, in **US English spelling only** (no British spellings such as labour, colour, centre, defence, programme, organise).
3. The build SHALL drop every word on `packs/blocklist.txt`, which has five sections: offensive words; common proper nouns that appear lowercase in the source; non-words (abbreviations, numerals, acronyms, and foreign words not in the US list); words about sex, violence, death, illness or drugs, so the game stays encouraging for every player; and British spellings. The build SHALL stop if any word is not in SCOWL's en_US speller list (`packs/source/scowl_en_US.txt`, pinned commit, notice kept beside it). The pack's charset is `abcdefghijklmnopqrstuvwxyz`. (Updated Nov 12, Shara.)
4. A test SHALL check the pack passes the contract, every word is in the charset and 3 to 8 letters, no word is on the blocklist, and there are no duplicates.

## Requirement 2: Choosing a round

1. Play SHALL open a mode picker with two choices, "Falling words" and "Four corners", each with a one-line "how it plays", and a shared panel with the rules both games use and the current speed. Enter on a choice starts that round. Escape goes back.
2. Practice SHALL start a practice round on the falling layout straight away: words stay still, there are no lives and no waves, and the round ends only when the player ends it.
3. The player SHALL choose the speed on the mode picker before starting (it starts at the saved speed and saves the choice). Every round SHALL use that speed, the general pack's words, and a seed from the clock.

## Requirement 3: Falling words and four corners

1. Each play screen SHALL match its mock screen's layout and look, with every element following the map in `design.md`.
2. The HUD SHALL show only true values: lives (5 hearts at most), wave and words left in the wave, live WPM, accuracy with its bar, time, and speed (for example "0.8×").
3. Words in the danger zone (falling) or danger ring (corners) SHALL carry `[!]`. In corners, each word shows its distance as "D:nn", and the HUD shows "HOSTILES ACTIVE: nn".
4. The locked word SHALL show its typed part and remaining part, and the input stream and target SHALL match it.
5. Words SHALL be drawn with `textContent`. Positions SHALL come from the engine's `progress` and `slot`, never from the renderer's own idea of time.

## Requirement 4: The game loop

1. The loop SHALL call `tick` once per animation frame with the time since the last frame, clamped to at most 100 ms, and never with NaN or a negative number.
2. WHEN the tab is hidden or the window loses focus, THE SYSTEM SHALL pause the round (keeping the lock) and show the pause dialog.
3. Keys SHALL go to the engine one character at a time. Backspace, Shift, Tab and other non-character keys SHALL never reach `key`.
4. The loop SHALL stop when the screen closes. No timer or frame request may outlive its screen.

## Requirement 5: Pause, out of lives, end

1. Escape SHALL follow the layered rule: drop the lock first; with nothing locked, pause. A wrong key SHALL never move a word on. It SHALL show in red on the word, and the letter it waits on SHALL be marked amber, until the right key. Backspace SHALL clear the red key and nothing else (Shara, Nov 12: strict but clear).
2. Pause SHALL open a real dialog (native `<dialog>`, focus inside, Escape resumes) with "Resume" and "End round".
3. WHEN the engine emits `outOfLives`, THE SYSTEM SHALL open a dialog that shows the round so far (WPM, words cleared, wave) and says plainly what Continue and End round each do, and that the round is saved either way.
4. Ending the round, by choice or by running out, SHALL go to results.

## Requirement 6: The three moments

1. Miss: the locked word's border flashes coral for 200 ms. Clear: the word shrinks away with a "✓" over 250 ms. Wave up: a "WAVE nn" banner for 1 second. Breach (Shara, Nov 12): when a word lands and costs a life, the field's edge flashes coral for 400 ms. When the locked word lands, its leftover letters are swallowed for up to 1.5 s as the player finishes typing them, so they never lock another word.
2. Under reduced motion, each moment keeps its color and words and drops the movement.
3. The live region SHALL speak: "Cleared <word>.", "Life lost. <n> left.", "Wave <n>.", "Out of lives." and "Paused." It SHALL NOT speak each keystroke or each miss.

## Requirement 7: Results

1. WHEN a round ends, THE SYSTEM SHALL build the RoundResult with `toResult`, fold it into progress with `record` (local day from the player's clock), and save it through `app.js`, never when `persist` is false.
2. Results SHALL match the mock's results screen, following the map: WPM, accuracy, cleared, time, mode, keystrokes, correct characters, missed keys (top 2), breaches, the word log (8 words, then "+ n more cleared"), a new-best line and milestone cards when there are any, and "+n WPM over last" only when the player is faster than their last round in the same mode.
3. WHEN the free continue was used, results SHALL say so.
4. Enter plays again (same mode), Escape goes to the main menu, a "Main menu" button sits top right in the header (Shara, Nov 12), and "View progress" opens progress. Share card is a "Not built yet" button.
5. Every stat on results SHALL carry a short plain explanation, always visible (no hover-only tooltips), and a link to How we count.

## Requirement 8: Block 7 deferrals

1. Waves stop speeding up after wave 10 (`WAVE_SPEEDUP_MAX_WAVE` in config; was 12, changed Nov 12 with the gentler curve).
2. A space is ignored, not counted, whether or not a word is locked (engine, with a test; widened Nov 12).
3. Characters per word (5), most diagnosis sentences (3) and most weak keys (6) move into config, and "How we count" reads them. A test ties the 3 and 6 to the contract's `maxItems`.
4. The settings hint class `later` is renamed `later-hint`, so it no longer shares progress's `.later` styles.
5. The engine gains `pause(state)`, which pauses without dropping the lock (for auto-pause).

## Requirement 9: Checks

1. `npm test`, `npm run lint`, `npm run test:e2e` (axe 0 serious or critical), `node scripts/check-fixtures.js` and `npm run check:build` SHALL pass.
2. e2e SHALL include keyboard-only flows: start falling, type the locked word, see it cleared and announced; pause and resume with Escape; play to results through "End round"; the same for corners; practice ends from the pause dialog.
3. No page scrolls at 1440x900, 1366x768 and 1280x720 on the mode picker, both play screens and results.
4. Screenshots of falling, corners and results at 1440x900 and 1366x768 are saved next to their mock screens in `docs/screens/`, and each pair matches the map.
