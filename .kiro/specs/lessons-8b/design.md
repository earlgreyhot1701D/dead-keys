# Design: Block 8b, lessons beyond the letters

Builds on `.kiro/specs/lessons/design.md` (Block 8a). Its map, desk look and rules still hold; this file adds to them and wins where the two differ. Decisions by Shara, Nov 13: Lesson 7 teaches the opposite Shift and does not check it.

## Files

| File | Job |
|---|---|
| `src/lessons/ladder.js` | All 14 lessons built; Lesson 7 adds the 26 capitals to the learned keys |
| `src/lessons/fingers.js` | The finger table with the number row, punctuation and symbols; `baseKey`, `needsShift`, `shiftFor` |
| `src/lessons/lineKit.js` | The seeded random function, `pick`, `size`, `fill` and MAX_LINE, shared by both generators (moved out of generate.js) |
| `src/lessons/beyond.js` | The line makers for Lessons 7 to 13 |
| `src/lessons/generate.js` | Picks the letters makers (1 to 6) or `beyond.js` (7 to 13) |
| `src/lessons/copy.js` | The new coach lines and the glossary words |
| `src/ui/components/lessonKeyboard.js` | Number row and Shift keys when a lesson uses them, finger initials, colors off |
| `src/ui/components/glossary.js` | The "What's this?" button and its dialog |
| `src/styles/deskKeys.css` | The number row, Shift keys, initials and colors-off styles (deskLesson.css is at its cap) |

## Fingers

Left pinky `q a z 1 !`; left ring `w s x 2 @`; left middle `e d c 3 #`; left index `r f v t g b 4 5 $ %`; right index `y h n u j m 6 7 &`; right middle `i k , 8`; right ring `o l . 9 (`; right pinky `p ; 0 ) ' " - : ? /`; thumbs: space. A capital uses its letter's finger.

## Lines, Lessons 7 to 13

Warm-up: one line of real words. New keys: two lines of the lesson's pattern. Mix: pattern and use, taking turns, then a line of use. Check: use and a real word, taking turns, closed by a short word so two lines reach 50 characters.

| Lesson | Pattern | Use |
|---|---|---|
| 7 Capitals | `Ff Jj Aa` | a capitalized word |
| 8 Punctuation | the key between its home key: `;?; a!a ;-;` | a contraction (`it's`, `don't`), `word?`, `word!`, `word:`, `"word"`, `re-do` |
| 9 and 10 Numbers | `a1a f4f` / `j6j ;0;` | a number (new digits at least half the time, never a leading 0), or `42 cats` |
| 11 Symbols | `f$f s@s ;/;` | `$37`, `50%`, `Tea & Toast`, `(see)`, `and/or`, `@home`, `#1` |
| 12 Real-world strings | a date `11/13/2026` or money `$12.50` | an address `1428 Elm St.` or a code `AB-1234`, all made up |
| 13 Common pairs | `thth`, or a short word starting with a pair | a word with two or more pairs, more pairs more often |

## Keyboard

The number row shows once a lesson has a key on it (Lesson 8's `-` on), so Lessons 0 to 6 look as before. Both Shift keys sit at the ends of the bottom row from Lesson 7 on. A shifted character fills the key it sits on and the Shift for the other hand. Each key shows its finger's initial in the corner. With Finger colors off (Lessons 7 to 13 only), keys keep their initials and lose their colors.

## Glossary

A small text button, `What's this?`, after the term. Its accessible name is `What's this: {term}`. It opens a `<dialog>` like the pause dialog: the term as its heading, the words below, and Close. Escape or Close returns focus to the button.

## Copy table (binding)

| Where | Words |
|---|---|
| Coach, New keys, L07 | `Hold Shift with the other hand's pinky: right Shift for A, left Shift for J.` |
| Coach, New keys, L08 | `Right pinky reaches for ' - : ? and ". Left pinky holds Shift for ! with A's finger.` |
| Coach, New keys, L09 | `Reach up to the number row from home: 1 is A's finger, 4 and 5 are F's.` |
| Coach, New keys, L10 | `Right hand reaches up: 6 and 7 are J's finger, 0 is your pinky's.` |
| Coach, New keys, L11 | `Symbols are Shift plus a number or a key you know: $ is Shift and 4.` |
| Coach, New keys, L12 | `Real-world strings: addresses, dates, money and codes. Slow is fine.` |
| Coach, New keys, L13 | `Common pairs: let one key roll into the next, like a drumroll.` |
| Legend | `P PINKY`, `R RING`, `M MIDDLE`, `I INDEX`, `T THUMB (SPACE)`, `■ NEXT KEY` |
| Lesson footer, colors | `FINGER COLORS: ON`, `FINGER COLORS: OFF` |
| Settings, Finger colors hint | `Lessons 0 to 6 always show finger colors. This switch is for Lessons 7 to 13.` |
| Glossary button | `What's this?` |
| Glossary, home row | `The middle row of letters: A S D F for your left hand, J K L ; for your right. Your fingers rest there and come back after each reach.` |
| Glossary, WPM | `Words per minute. Every five characters you type correctly count as one word, and time spent paused is left out.` |
| Glossary, accuracy | `The keys you got right out of every key you pressed. Backspace doesn't count as a key.` |
| Glossary, dead key | `A key that types nothing until you press the next one. On US-International, ' then e types é.` |
| Glossary, close | `Close` |
| Main menu, every lesson passed | `All lessons passed.` / `Keep your keys sharp with the daily drill.` |
| Lesson 0, picture text | `The picture shows a US keyboard: the number row on top, then Q W E R T Y, then A S D F G H J K L, then Z X C V B N M.` |
