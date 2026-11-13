# Design: Block 8a, lessons (letters)

**Spec:** `lessons`. **Requirements:** `requirements.md`. **Status:** Approved by Shara, Nov 12.

## Read this first: no guessing

Everything a screen shows is decided below. The map says what each mock element becomes; the copy table says every new word, exactly. If something on a mock is not in the map, or a screen needs a word that is not in the copy table, **stop and ask**. Do not invent copy, numbers or labels. Do not approximate the mock: read `mock/lessons.html` (its markup and its `<style>`) and carry it over as CSS classes in `src/styles/desk.css`. The lesson screens use the **desk look**; the play screens keep the arcade look and must not change.

## Mock-to-build map (binding)

### Lesson screen (`mock/lessons.html` screen C, `docs/screens/mock-lesson.png`)

| Mock element | Build |
|---|---|
| Header: wordmark, `[ MAIN MENU ]` top right | Keep, the shared header (`chrome.js`). Main menu asks first (pause dialog) |
| Pill `LESSON 03 // FULL HOME ROW` | Real: lesson number (two digits) and name, upper case. Test out: `TEST OUT // LESSON 03` |
| Four steps `[✓] 1. WARM-UP`, `[▶] 2. NEW KEYS`, `3. MIX`, `4. CHECK` | Real: done parts get `[✓]`, the current part `[▶]` and the paper fill. Lesson 0 uses its own four names. Test out shows one step, `[▶] CHECK` |
| Coach line `Left index finger reaches right for G. Come back to F after.` | Real: the part's coach line from the copy table. Key letters in the line are drawn bold teal, as the mock does |
| `LINE 2 OF 3` | Real: line in this part, of lines in this part |
| Paper typing line: typed part underlined teal, red struck wrong key, amber underlined waiting letter, grey to-do | Keep, as drawn, driven by `line.js` state. No caret glyph |
| `TYPE "g" TO FIX. Backspace clears the red key.` | Real: shown only while a wrong key is showing; the letter is the waiting one |
| `ACCURACY 94%` | Real: accuracy so far in this lesson |
| `KEYS 14 / 28` | Real: correct keys in this part / keys in this part |
| Keyboard: finger-colored outlines, learned keys bright and bold, other keys dimmed, next key filled, bumps on F and J, space key | Keep, as drawn. Learned = the lesson's learned keys. Next = the waiting key (space fills the space bar) |
| Legend `PINKY RING MIDDLE INDEX THUMB (SPACE) ■ NEXT KEY` | Keep |
| Footer left `NO LIVES. NO TIMER. LESSONS PASS ON ACCURACY, NOT SPEED.` | Keep |
| Footer right `[ESC] PAUSE   FINGER COLORS: ON` | Keep (true: always on in Lessons 0 to 6) |

### Lessons menu (`mock/lessons.html` screen D, `docs/screens/mock-lessons.png`)

| Mock element | Build |
|---|---|
| Header pill `NODE: 0x84-LESSONS`, `[ BACK ]`, `[ MAIN MENU ]` | Keep |
| `// HOME ROW FIRST. ONE ROW AT A TIME.` and `LESSONS` | Keep |
| `Why these lessons` link | Drop in 8a (the page is Block 8b) |
| Group headings `HOME ROW`, `TOP ROW`, `BOTTOM ROW`, `BEYOND LETTERS` | Keep |
| Group counts `3 OF 4 PASSED`, `0 OF 2`, `0 OF 1`, `LATER` | Real: `n OF m PASSED` for each built group (tested out counts); `LATER` for Beyond letters |
| Lesson rows: number, name, keys, state | Real: from `ladder.js` and saved progress. Keys as the mock writes them (lower case, spaced; space as `␣`, Shift as `⇧`) |
| States `✓ PASSED`, `✓ TESTED OUT`, `▶ NEXT`, `OPEN`, `LATER` | Real |
| The paper-highlighted row with outline | The selected row (starts on the recommended lesson). `▶ NEXT` marks the recommended row wherever the selection is |
| Learned-keys keyboard, `LEARNED 8`, `NEXT: G H`, `TO COME` | Real: lit = keys of passed or tested-out lessons; outlined = the recommended lesson's new letter keys; count = lit keys |
| Paper card: `LESSON 03`, `NEXT UP`, name, key caps, the four parts | Real: the selected lesson. Right label: `NEXT UP`, `PASSED`, `TESTED OUT` or `OPEN` |
| `[ START LESSON ]`, `[ TEST OUT ]` | Keep. Lesson 0: Start only. Later lessons: no buttons, `Not built yet` instead |
| (not in mock) one line under the buttons: `Test out: one check line. 95% skips the lesson.` | **Add** (approved by Shara, Nov 12): there is room under the buttons and Test out needs explaining |
| Footer `SYS.84 // SAVE: THIS BROWSER`, `[UP / DOWN] SELECT  [ENTER] START  [T] TEST OUT  [ESC] BACK` | Keep (save part real, as on other screens) |

### Lesson done (`mock/lessons.html` screen E, `docs/screens/mock-lesson-done.png`)

| Mock element | Build |
|---|---|
| Steps, all `[✓]` | Keep |
| Card top `LESSON 03`, `SAVED IN THIS BROWSER` | Real: the same save wording the results screen uses when saving is off |
| `Passed.` | Real: `Passed.`, `Not yet.` or `Tested out.` |
| `CHECK ACCURACY 97%`, `95% passes` | Real |
| `SPEED 18 WPM`, `any speed is fine` | Real WPM (lesson timing, Req 3.4) |
| `KEEP PRACTICING h g`, `your most-missed keys here` | Real: up to two keys with the most misses in this lesson; none: the copy-table line |
| Dip line | Real: only when Req 9 says |
| `[ NEXT: LESSON 04 ]`, `[ AGAIN ]`, `[ ALL LESSONS ]` | Passed: as drawn, with `[ PLAY THESE KEYS ]` after Next (decision 10; no next built lesson: drop Next). Not yet: `[ AGAIN ]` first, `[ ALL LESSONS ]` |
| Footer | Real per state (copy table) |

### Main menu, recommended lesson panel (`mock/index.html` screen 2, right column top)

| Mock element | Build |
|---|---|
| `RECOMMENDED NEXT LESSON` | Keep |
| `[STG_04]` | Real: `[L04]` (lesson id) |
| `Lesson 4: Top row, index fingers` | Real |
| Key caps `R T Y U` | Real: the lesson's new letter keys, upper case |
| `Reach up from home row with your index fingers. Eyes stay on the screen.` | Real: the lesson's "New keys" coach line (Lesson 0: its card line) |
| `[WHY] "r" and "t" are shaky on your heat map` | Real: one of the three Why lines in the copy table |
| `[TEST OUT] 95% to skip` | Keep for Lessons 1 to 6; hide for Lesson 0 |
| The panel is information only; Lessons in the menu opens the ladder on this lesson | Decision |

## Copy table (every new word, binding)

| Where | Exact text |
|---|---|
| Menu item | `Lessons` loses its `Not built yet` |
| Ladder sub-title | `// HOME ROW FIRST. ONE ROW AT A TIME.` |
| Group headings | `HOME ROW`, `TOP ROW`, `BOTTOM ROW`, `BEYOND LETTERS` |
| Group count | `{n} OF {m} PASSED`; Beyond letters: `LATER` |
| Row states | `✓ PASSED`, `✓ TESTED OUT`, `▶ NEXT`, `OPEN`, `LATER` |
| Map legend | `LEARNED {n}`, `NEXT: {KEYS}`, `TO COME` |
| Card labels | `LESSON {nn}`; `NEXT UP`, `PASSED`, `TESTED OUT`, `OPEN` |
| Card parts, Lessons 1 to 6 | `1. Warm-up. Keys you know.` / `2. New keys. Which finger, then a drill.` / `3. Mix. New and old keys, real words.` / `4. Check. 95% accuracy passes, any speed.` (the word before each first period is bold) |
| Card parts, Lesson 0 | `1. Your keyboard. Is it this one?` / `2. Home keys. Find F and J.` / `3. Fingers. One color, one finger.` / `4. Eyes up. Passes when you finish.` |
| Card, Later lessons | `Not built yet` |
| Buttons | `[ Start lesson ]`, `[ Test out ]` |
| Under the buttons | `Already type these keys? Test out: one line. 95% marks the lesson done.` |
| Ladder footer | `[UP / DOWN] SELECT`, `[ENTER] START`, `[T] TEST OUT`, `[ESC] BACK` |
| Step names, Lessons 1 to 6 | `1. WARM-UP`, `2. NEW KEYS`, `3. MIX`, `4. CHECK` |
| Step names, Lesson 0 | `1. YOUR KEYBOARD`, `2. HOME KEYS`, `3. FINGERS`, `4. EYES UP` |
| Coach, Warm-up | `Warm up on keys you know.` |
| Coach, New keys, L01 | `Left hand on the home row: pinky on A, ring on S, middle on D, index on F.` |
| Coach, New keys, L02 | `Right hand on the home row: index on J, middle on K, ring on L, pinky on ;.` |
| Coach, New keys, L03 | `Index fingers reach in: left for G, right for H. Thumbs press Space.` |
| Coach, New keys, L04 | `Index fingers reach up: left for R and T, right for Y and U.` |
| Coach, New keys, L05 | `Reach up from home: Q, W, E with your left hand; I, O, P with your right.` |
| Coach, New keys, L06 | `Reach down: Z, X, C, V, B with your left hand; N, M, comma and period with your right.` |
| Coach, Mix | `New and old keys together, then real words.` |
| Coach, Check | `One check. 95% accuracy passes, at any speed.` |
| L00 part 1 question | `Does your keyboard look like this?` with buttons `[ Yes ]`, `[ No ]` |
| L00 part 1, after No | `Dead Keys teaches the US keyboard for now. Some keys may sit in other places on yours. You can still go on.` with `[ Go on ]` |
| L00 part 2 coach and line | `Find the two keys with a small bump: F and J. Rest your index fingers on them.` / `fff jjj fjf jfj` |
| L00 part 3 coach and line | `Each color is one finger. Middle fingers rest on D and K.` / `ddd kkk dfd kjk` |
| L00 part 4 coach and line | `Keep your eyes on the screen, not your hands. Sit up, wrists loose.` / `fj dk fd jk fjdk` |
| Line counter | `LINE {n} OF {m}` |
| Wrong-key hint | `TYPE "{key}" TO FIX. Backspace clears the red key.` (space written `SPACE`, no quotes) |
| Meta | `ACCURACY {n}%`, `KEYS {a} / {b}` |
| Legend | `PINKY`, `RING`, `MIDDLE`, `INDEX`, `THUMB (SPACE)`, `■ NEXT KEY` |
| Lesson footer | `NO LIVES. NO TIMER. LESSONS PASS ON ACCURACY, NOT SPEED.` / `[ESC] PAUSE`, `FINGER COLORS: ON` |
| Pill | `LESSON {nn} // {NAME}`, `TEST OUT // LESSON {nn}` |
| Pause dialog | Title `Paused`. Body `Your lesson is waiting. If you leave now, it is not saved.` Buttons `[ Resume ]`, `[ Leave lesson ]` |
| Done titles | `Passed.`, `Not yet.`, `Tested out.` |
| Done stats | `CHECK ACCURACY` / `95% passes`; `SPEED` / `{n} WPM` / `any speed is fine`; `KEEP PRACTICING` / `your most-missed keys here`; no misses: `—` / `no misses in this lesson` |
| Done, Lesson 0 accuracy sub-line | `finishing passes Lesson 0` |
| Done, Not yet line | `Close. Try it again; going slower helps.` |
| Done, test out Not yet line | `The full lesson will get you there.` |
| Done, tested out line | `You already know these keys. This lesson counts as done.` |
| Dip line | `Speed often dips while your fingers relearn. It comes back faster.` |
| Done buttons | `[ Next: Lesson {nn} ]`, `[ Play these keys ]`, `[ Again ]`, `[ All lessons ]` |
| Done footers | `[ENTER] NEXT LESSON  [ESC] ALL LESSONS`; not yet: `[ENTER] AGAIN  [ESC] ALL LESSONS` |
| Live region | New line: `Line {n} of {m}: {text}`. Wrong key: `Wrong key. Type {key}.` Done: `Lesson {n} passed. Check accuracy {a}%.` / `Not yet. Check accuracy {a}%. 95% passes.` / `Tested out of lesson {n}.` |
| Menu panel tag | `[L{nn}]` |
| Menu panel title | `Lesson {n}: {Name}` |
| Why lines | `[WHY] You miss "{a}" and "{b}" most.` (one key: `[WHY] You miss "{a}" most.`) / `[WHY] Next in order.` / `[WHY] New to typing? Start here.` |
| Menu panel, all built lessons passed | Title `All letter lessons passed.` Line `Capitals, punctuation and numbers are next.` |
| How we count, new section | Heading `Lessons`. Lines: `A lesson passes when its check is 95% accurate or better, at any speed. Lesson 0 passes when you finish it.` / `Test out is the check on its own. It passes the same way.` / `Lesson speed counts only the time between keys, at most 5 seconds each, and never while paused.` / `If your second or third lesson is more than 15% slower than your first, we tell you: that dip is normal, and it comes back.` / `Every key you type in a lesson counts toward your heat map.` |
| Results carry-in | The accuracy bar panel's name becomes `Accuracy bar` (the tile stays `Accuracy`) |
| Results, after Play these keys | The mode line's pack part reads `PACK: YOUR KEYS` in place of `PACK: GENERAL` (Shara, Batch C) |

## Lesson words (`packs/lessonWords.json`, approved by Shara, Nov 12)

| Lesson | Words |
|---|---|
| L01 (a s d f) | ad, add, as, dad, fad, sad, sass, dads, fads, adds |
| L02 (+ j k l ;) | all, ask, fall, lad, lads, flask, salad, alas, falls, asks, flasks, salads |
| L03 (+ g h) | glad, half, hall, shall, flash, dash, has, had, gas, glass, flag, flags, gala, salsa, alfalfa, lag, halls, ash, hash |

All are in SCOWL en_US and none is on the blocklist (checked Nov 12). Each lesson also uses the words of the lessons before it.

## Desk look (`src/styles/desk.css`)

Values from `mock/lessons.html`, as tokens: `--desk #0d1719`, `--desk-rule #22302f`, `--paper #ece6d6`, `--paper-ink #1f2a2c`, `--paper-rule #c9c1ad`, `--paper-soft #4b5551`, `--paper-label #5d6763`, `--paper-todo #5f655f`, `--paper-done #2c8f84`, `--paper-wrong #b3261e`, `--paper-wait #7a4f00`; finger tints `--f-pinky #b49ad8`, `--f-ring #7fa8e0`, `--f-middle #9fd28a`, `--f-index #4fe3d1`, `--f-thumb #9bb0ad`. A test checks every text pair against WCAG AA (4.5:1 for text, 3:1 for key outlines); if one fails, stop and report, do not pick a new color.

## Fingers (`src/lessons/fingers.js`)

Left pinky `q a z`; left ring `w s x`; left middle `e d c`; left index `r f v t g b`; right index `y h n u j m`; right middle `i k ,`; right ring `o l .`; right pinky `p ;`; thumbs: space.

## Files

| File | Job |
|---|---|
| `src/lessons/ladder.js` | Lessons 0 to 13: id, number, name, group, new keys, built; `learnedKeys(id)` |
| `src/lessons/fingers.js` | Key to finger |
| `src/lessons/generate.js` | The parts and lines of a lesson or a test out, seeded and pure |
| `src/lessons/line.js` | The typing-line engine: key, backspace, keystrokes, timing |
| `src/lessons/result.js` | Lesson state to RoundResult, Check accuracy, pass, most-missed keys |
| `src/lessons/recommend.js` | Recommended lesson and its Why |
| `src/lessons/dip.js` | Whether to show the dip line |
| `packs/lessonWords.json` + `packs/lessonWords.test.js` | The early lessons' words |
| `src/engine/record.js` | Optional pass argument (Req 4.4) |
| `src/ui/roundRecord.js` | Passes the pass through (`finishRound(result, day, pass)`) |
| `src/ui/screens/lessons.js` | Lessons menu; `chooseLesson` / `nextLesson` like `play.js` does for rounds |
| `src/ui/screens/lesson.js` + `src/ui/components/lessonView.js` | Lesson screen: control and drawing kept apart |
| `src/ui/components/lessonKeyboard.js` | The finger-colored keyboard (reuses `keyboardLayout.js` rows) |
| `src/ui/components/lessonDone.js` | The Lesson done card |
| `src/ui/components/menuSide.js` | Recommended lesson panel in place of the "Not built yet" panel |
| `src/ui/screens/menu.js`, `src/ui/screens/howWeCountText.js`, `src/ui/screens/results.js`, `src/ui/components/resultsPanels.js`, `src/a11y/announce.js` | Menu item, How we count, carry-ins |
| `src/styles/desk.css` | The desk look |
| `src/main.js` | Screens `lessons` and `lesson` |
| `e2e/lessons.spec.js`, `e2e/screenshots.spec.js` | Req 11 |

Every file under 150 lines, tests under 250. One job per file.

## Decisions

1. **The ladder lives in code, not in the pack.** `pack.json`'s `lessons` stays an empty list; the contract is not changed.
2. **One RoundResult per lesson**, covering all four parts; the pass is decided from the Check part and handed to `record()` separately. This keeps the contract as it is and lets the heat map learn from every key.
3. **Patterns.** A pattern is a group of 2 to 4 keys, groups separated by one space. New-key patterns alternate the new key with its home key (`fgf gfg`); mix patterns draw from all learned keys, new keys at least half the time.
4. **Lines end on a group, never mid-group**, and never with a space.
5. **Lesson ids** are `L00` to `L13`. `lessonsPassed` stores these ids.
6. **Mode ids.** A lesson round is mode `lesson`; a test out is mode `testout`. Both are in the contract already.
7. **Lesson screens have no scanlines** (desk look); `chrome.js`'s scanlines are left out on these two screens only.
8. **Main menu panel.** Information only (as drawn); Lessons opens the menu on the recommended lesson.
9. **Batch A flags, decided by Shara and Claude, Nov 12.** Lesson 0's keys are F and J (its D and K lines are practice, not learned keys). Lesson 0 is never recommended for a weak key; it comes first only in order or for a new player. A home key's anchor is its hand's index key; F and J anchor each other. The Check is real words only when the lesson has at least 6 words (patterns like "sury" read as misspellings). `--paper-todo` is `#5f655f` (4.80:1; the mock's `#8a8f88` was 2.65:1). A lesson milestone reads "Lesson 3 passed", not the id (`src/engine/milestones.js`, one line). Dip counts lesson rounds only.
10. **Play these keys, decided by Shara, Nov 12 (built by Claude).** After a passed lesson or test out, the done card offers `[ Play these keys ]`: a Practice round (falling, no lives lost to waves) whose words use only the keys learned so far (`wordsFor(id)`, `src/lessons/keysRound.js`; no button under 6 words, so never for Lesson 0). Play again on its results keeps the same words. Any other way into a round uses the pack. A passed test out also says `You already know these keys. This lesson counts as done.`, and the test out note under the menu buttons says what test out is for. Why: lessons taught keys the game never asked for, so a new typist went from F and J straight to every letter falling.
11. **Batch C blockers and flags, ruled by Claude for Shara, Nov 12 (built by Claude).** How we count keeps the one-screen rule: four columns and 13px body text (`pages.css`), no copy cut. Dimmed things are dimmed by color, never opacity, so every word keeps 4.5:1: Later groups and rows use `--dim` with a dashed row edge (`deskMenu.css`); keys not learned yet use `--dim` with a dashed edge (`deskLesson.css`). The Lessons menu starts on the recommended lesson on every visit (Req 5.5; `lessons.js` clears the selection when a lesson starts). The Progress screen's Lessons button opens the Lessons menu. Kiro's other flags stand as built: Lesson 0's panel line is its first card part; the lesson keyboard is the keyboard picture; `lessonAsk.js` is split out; the done card's hover keeps the button's own fill; the heading count tests go from 8 to 9.
