# Daily drill: requirements (Block 12)

PRD G5: seed = the local date as YYYYMMDD, 2 minutes, general pack. Locked mock: main menu (screen 2), the Daily drill panel. Rigor tier: Full.

## Req 1: today's round

1.1 The menu item Daily drill and the panel's Start both open a daily round at once, on the falling layout, with mode `daily`.
1.2 The seed is the player's local date as YYYYMMDD. The same day gives the same words in the same order on every device; the speed setting changes timing only.
1.3 Words come from the general pack. Lives, waves and the free continue work as in Falling words. There is no warm-up.
1.4 Starting says, in the live region: "Daily drill: two minutes. Same words for everyone today."
1.5 Play again on results starts today's daily round again.

## Req 2: the clock

2.1 The HUD shows TIME LEFT, counting down from 2:00 by active play. Pausing, and the out-of-lives dialog, stop the clock.
2.2 At 30 seconds left the live region says "30 seconds left." once.
2.3 At 0:00 the live region says "Time's up." and the round ends, is saved and shows results, once.
2.4 Ending from the pause dialog or running out of lives ends it early, as in any round.

## Req 3: the menu panel

3.1 The panel shows DAILY DRILL, a TODAY tag and LIMIT: 02:00, as the mock.
3.2 It shows today's best daily speed from saved rounds ("Today's best: 37 WPM"), or "Today's words are ready." when there is none today.
3.3 It says SAME WORDS FOR EVERYONE TODAY. Its Start button is named "Start daily drill".
3.4 Nothing is made up: the mock's ghost line and target pace wait for the ghost race (Block 13). The ghost icon stays, hidden from screen readers.
3.5 The menu still fits 1280 x 720 and has no serious or critical axe issue.
