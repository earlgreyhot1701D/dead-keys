# Ghost race: requirements (Block 13a)

PRD: "Ghost race: race your own best run replayed keystroke by keystroke." Contract: `GhostRun` (mode, packId, wpm, keystrokes up to 2,000), one per mode and pack. Locked mock: main menu (screen 2), the Daily drill panel's ghost line. Rigor tier: Full. Attract mode is Block 13b.

## Req 1: saving a ghost

1.1 Falling words, Four corners and the daily drill have a ghost. Practice, drills, lessons and test outs do not.
1.2 A round that sets a new personal best in its mode (90% accuracy or better, the existing best rule) saves its keystrokes as that mode's ghost, replacing the old one. Saved in this browser, like every round.
1.3 A ghost keeps at most 2,000 keystrokes, each with only t, expected, typed and ok, so it passes the contract.
1.4 Play these keys never saves or races a ghost: its words are not the pack's.

## Req 2: racing it

2.1 A round in a mode with a ghost shows a GHOST box in the HUD, after TERMINAL 84: the ghost's speed, and your lead in letters typed right at the same moment of active play ("+12 AHEAD", "5 BEHIND", "LEVEL"). Pausing stops both clocks.
2.2 The first time you pull ahead after being behind, once the ghost has typed 10 letters, the live region says "You passed your ghost." once.
2.3 The box fits both HUDs at 1280 x 720.

## Req 3: results

3.1 After a raced round, results say "You beat your ghost: 41 WPM to 36.", "You tied your ghost at 36 WPM." or "Your ghost was faster: 36 WPM to your 33."
3.2 When a new ghost was saved they add "New ghost saved. Race it next time."
3.3 The line sits under the mode line. No ghost, no line.

## Req 4: the menu's daily panel

4.1 With a daily ghost, the panel says "Race your ghost: 36 WPM" and "TARGET PACE: 180 CPM // SAME WORDS FOR EVERYONE TODAY" (5 letters a word).
4.2 Without one, it keeps Block 12's lines (today's best, or today's words are ready).
