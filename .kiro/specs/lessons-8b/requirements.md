# Requirements: Block 8b, lessons beyond the letters

**Spec:** `lessons-8b` (PRD G7 lesson ladder, G2 glossary taps, G10 accessibility). Builds on `.kiro/specs/lessons/` (Block 8a); every 8a rule still holds unless this file changes it. **Rigor:** Working for layout, Full for anything that records a lesson or decides a pass.
**Status:** Approved by Shara, Nov 13 (Lesson 7: teach the opposite Shift, don't check it). Built by Claude the same day.
**Look:** no new mock. Lessons 7 to 13 use the locked lessons mock (`mock/lessons.html` screens C, D, E) unchanged; the only new pieces are the number row and Shift caps on the lesson keyboard and the glossary dialog, both built from the existing tokens and the dialog style the pause dialog already uses.

## Introduction

Block 8a built Lessons 0 to 6, the letters. Block 8b builds Lessons 7 to 13 (capitals, punctuation, numbers, symbols, real-world strings, common pairs), the "What's this?" glossary, the Finger colors switch, and the accessibility items 8a deferred.

## Scope

**In:** Lessons 7 to 13 playable with test out; the finger table for every key they use; the number row and Shift on the lesson keyboard; the Finger colors switch; the glossary; the 8a deferrals (KIRO-NOTES, Block 8a gate).
**Out (STUB):** enforcing which Shift was pressed (Lesson 7 teaches it, see Req 2.2); rollover timing in Lesson 13 (it teaches pairs, it does not time them); Spanish lessons S1 to S3 (v2, Shara Nov 13).

---

## Requirement 1: The ladder

1. Lessons 7 to 13 SHALL be `built: true`. Every lesson 0 to 13 is open, as in 8a Req 1.3.
2. Learned keys SHALL grow as PRD G7 lists them: Lesson 7 adds the 26 capitals; 8 adds `' ? ! : " -`; 9 adds `1 2 3 4 5`; 10 adds `6 7 8 9 0`; 11 adds `$ % & ( ) / @ #`. Lessons 12 and 13 add no keys.
3. The Lessons menu's "beyond" group SHALL count its passed lessons like the other groups.

## Requirement 2: Lesson 7, Capitals

1. Lines SHALL be real words from the learned letters, with capitals in natural places (the first word of a line, names-like words from the pack, one ALL-CAPS word at most per Check line), plus New keys lines of capital pairs anchored on home keys (`Ff Jj Aa ;`).
2. The coach line SHALL teach Shift with the opposite hand. The lesson keyboard SHALL draw both Shift keys and fill the opposite Shift while a capital is next. Which Shift was pressed is not checked or scored.

## Requirement 3: Lessons 8 to 11, punctuation, numbers and symbols

1. Every new key SHALL have a finger in `fingers.js`: `'`, `-` and `:` right pinky; `"` right pinky; `?` right pinky; `!` left pinky; `1` left pinky, `2` left ring, `3` left middle, `4` and `5` left index, `6` and `7` right index, `8` right middle, `9` right ring, `0` right pinky; `$` and `%` left index, `@` left ring, `#` left middle, `&` right index, `(` right ring, `)` and `/` right pinky. Shifted keys use the same finger as their base key.
2. New keys lines SHALL be patterns anchored on the finger's home key (`f4f 4f4 j7j`). Mix and Check SHALL use the keys where they belong: punctuation after or inside words (`it's`, `why?`, `yes!`, `note:`, `"hi"`, `re-do`), numbers as amounts and counts (`42 cats`, `1990`), symbols in their real use (`$5`, `50%`, `A & B`, `(see)`, `and/or`, `@home`, `#1`).
3. Every character in every line SHALL be a learned key of that lesson (8a Req 2.3 still holds), lines at most 28 characters.

## Requirement 4: Lesson 12, Real-world strings

1. Lines SHALL be made-up strings of four kinds, generated from templates with the seeded RNG: addresses (`1428 Elm St.`), dates (`11/13/2026`), money (`$12.50`), codes (`AB-1234`). No real address or real person.
2. Each part uses every kind at least once across the lesson. Every character is a learned key.

## Requirement 5: Lesson 13, Common pairs

1. New keys lines SHALL be the pairs `th he in er an re on` as patterns (`th the then`); Mix and Check SHALL be real words from the pack with two or more of the pairs, weighted toward words with more pairs.
2. The coach line SHALL explain rolling from one key to the next. Nothing is timed beyond the 8a lesson timing.

## Requirement 6: The lesson keyboard

1. The keyboard SHALL show the number row once a lesson has a key on it (Lesson 8's `-` on) and both Shift keys from Lesson 7 on, so Lessons 0 to 6 look exactly as they do now. The Lessons menu's map keeps the mock's three letter rows.
2. No lesson screen scrolls at 1440x900, 1366x768 or 1280x720 with the extra rows.
3. A key's finger SHALL show without color too: each lit key carries its finger's initial as small text in the key's corner, the legend says what the initials mean (8a deferral: finger identity color only, 1.4.1).

## Requirement 7: The Finger colors switch

1. Settings' Finger colors SHALL work (no longer "Not built yet"). On by default.
2. Lessons 0 to 6 SHALL always show finger colors (PRD G7). Lessons 7 to 13 SHALL follow the switch; with it off, keys show the finger initials only.

## Requirement 8: The glossary ("What's this?")

1. A "What's this?" button SHALL sit next to four terms (PRD G2): home row (the Lessons menu's Home row heading), WPM (the main menu's Best speed), accuracy (the Lesson done card's Check accuracy), dead key (the Spanish hint on Play). Results already explain WPM and accuracy under each tile, so they get none.
2. It SHALL open a small dialog with the term, one or two plain sentences from the copy table, and Close. Escape closes it and focus goes back to the button. Nothing is sent anywhere.

## Requirement 9: The Block 8a deferrals

1. Lesson 0's keyboard question SHALL have a text equivalent of the picture (the picture stays decorative), and focus SHALL land on Yes after the screen is attached.
2. The waiting letter and the typed run SHALL differ by more than color (a box around the waiting letter).
3. Unlit letters on the Lessons key map SHALL reach 3:1.
4. Group headings on the Lessons menu SHALL be headings, and the lesson h1 SHALL sit in `<main>` (the header keeps a visible pill). `[WHY]` and `[TEST OUT]` stay as the locked mock writes them: plain text, never focusable.
5. Reflow at 200% zoom: fit.js scales the whole 1440x900 page, so nothing is cut off; it gets smaller rather than reflowing. Logged as a v2 item, not changed here.
6. Part changes SHALL be announced once, after the heading focus.

## Requirement 10: Checks

1. Unit tests for every changed module in `src/lessons/`, every new copy-table line, and a generator property test: for every lesson 0 to 13 and 50 seeds, every character is a learned key and no line is over 28 characters.
2. e2e (keyboard only): play Lessons 7, 9 and 12 to Passed; test out of Lesson 11 with misses and see Not yet; open and close each glossary dialog with the keyboard; turn Finger colors off and see Lesson 8 without colors.
3. axe on Lessons 7 to 13 (lesson screen), the glossary dialog, and Settings. 0 serious or critical.
4. No page scrolls at the three sizes on any lesson screen.
