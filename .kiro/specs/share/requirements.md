# Share card: requirements (Block 11)

PRD G10 (share a round). Mock approved by Shara, Nov 13 2026 (`design.md` has the map). Rigor tier: Full.

## Req 1: the card

1.1 Results has a Share card button. It opens a window with a 1200 x 630 card of the round, drawn in the browser.
1.2 The card shows: WPM and accuracy (whole numbers), best speed, rounds played, the day streak, a meta line (mode, wave unless Practice, time, date), and the top milestone earned this round, only when one was earned.
1.3 The card shows nothing personal: no name, no keys, no words typed, no key stats.
1.4 The card is drawn in the app's own colors and fonts. It waits for the fonts, at most 1.5 seconds.

## Req 2: the window

2.1 A native modal dialog, named SHARE CARD. Focus lands on Download PNG. Escape or Close shuts it and focus returns to the Share card button. Escape does not also leave the results screen.
2.2 The card in the window is an image with a text alternative carrying the card's numbers.
2.3 One window at a time: a second click while one is opening does nothing.
2.4 The window fits a 1280 x 720 screen and has no serious or critical axe issue.
2.5 Each button's outcome is said in a live line inside the window.

## Req 3: the buttons

3.1 Download PNG saves `dead-keys-<wpm>wpm.png`. If the browser can't make the image, it says so.
3.2 Copy text puts the share line on the clipboard. If the clipboard refuses, it says so and points to Download PNG.
3.3 Share opens the system share sheet with the PNG and the line. It shows only where the browser can share files. A cancel is quiet; a failure says so.
3.4 Nothing is uploaded. No network call is made by any button.
