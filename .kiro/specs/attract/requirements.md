# Attract mode: requirements (Block 13b)

PRD: "after ~15s idle on the title screen, a recorded run plays (alternating mechanics). DEMO label, any input stops it, silent, visible Pause (WCAG 2.2.2), still frame under reduced motion, live region silent." Locked mock: title (screen 1), header "[Demo playing]" and "Pause demo". Rigor tier: Full. Also ghost Req 5 (how a player learns about the ghost race).

## Req 1: the demo

1.1 The title shows the still frame first. After 15 seconds with no key, click or scroll, the real game plays itself behind the panel.
1.2 While it plays, the header shows "[Demo playing]" and a "Pause demo" button. Before and after, both are hidden.
1.3 Any key (except on the demo's own button), click or scroll stops the demo, puts the still frame back and starts the 15-second wait again. A start key still starts the game.

## Req 2: what plays

2.1 A typist plays the real engine on the general pack: it locks the word nearest to danger, types one key every 250 ms (about 48 WPM) and never misses.
2.2 Rounds alternate Falling words and Four corners, 40 seconds each, or sooner if the round ends.
2.3 The field carries "STATION_ID: TER-84 // DEMO".

## Req 3: access

3.1 Pause demo stops it and becomes "Resume demo", with `aria-pressed`, and the status says "[Demo paused]" (WCAG 2.2.2).
3.2 The demo is hidden from screen readers and says nothing in the live region. It makes no sound.
3.3 Under reduced motion it never starts: the still frame stays.
3.4 No serious or critical axe issue while it plays.

## Ghost Req 5: how a player learns about the ghost

5.1 The Play screen's rules add: "Beat your best at 90% accuracy or better and it becomes your ghost. Next round, you race it."
5.2 How we count's Bests section adds: "Each new best becomes your ghost: AHEAD and BEHIND count letters typed right at the same moment." (A section of its own made the page scroll at 1440 x 900.)
