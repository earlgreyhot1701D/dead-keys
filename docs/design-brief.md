# Dead Keys: design brief (UI track, PRD G11)

**For:** the first mock round, Nov 11 2026. Three tools get this same brief (Claude Design, Google Stitch, ChatGPT) so Shara can compare and pick a direction. The winner becomes the static mock in the repo, which later loads the real fixtures.

AI assisted. Human approved. Powered by NLP.

## The product in one line

A typing game, back from the dead. The 1980s typing games MasterType and Type Attack, rebuilt as a real trainer for anyone starting or rebuilding keyboard skills. Desktop browser, keyboard required. No accounts.

## Look: phosphor terminal, restrained

Teal-black ground, glowing-teal type without bloom, condensed uppercase headings, monospace body, double rules, zero border radius, faint static scanlines (off under reduced motion). Warm colors only for status. Typewriter warmth, arcade energy, plain words. Halloween is a light touch: one small ghost, no cobwebs, no blood.

| Token | Value | Role |
|---|---|---|
| bg | #0A1214 | Page ground |
| panel | #0E1C1F | Panels, keycaps at rest |
| rule | #3CA89C | Rules, outlines |
| text | #4FE3D1 | Text; heat band "steady" |
| label | #79C7C5 | Labels |
| muted | #9BB0AD | Secondary text; "no data" hatch |
| missed | #FF7A6B | Heat band "missed" |
| shaky | #F2C14E | Heat band "shaky" |
| head font | Arial Narrow, Roboto Condensed | Headings, labels, uppercase |
| mono font | ui-monospace, Cascadia Mono, Consolas | Body, typed text |

A fourth heat band sits between steady and shaky; the mock may propose a color for it.

## Rules the design must keep

- Never color alone: heat bands also carry a pattern (hatch, dots, solid) and a word. The locked target changes shape and weight, not just color.
- Visible keyboard focus on every control. Every menu works by keyboard.
- Attract mode shows a visible Pause control.
- No brand logos (no Kiro logo, no MasterType or Type Attack art). Our own small ghost is the only mascot.
- Sample text is invented. No real names, addresses, or phone numbers.

## Screens for this round (6)

1. **Title + attract mode.** "DEAD KEYS" wordmark, tagline "a typing game, back from the dead," the game playing itself behind a dim overlay, "Press any key," a Pause control.
2. **Main menu.** Play, Lessons, Practice, Daily drill, Progress, How we count, Settings, About. One item focused.
3. **Play: falling targets** (Type Attack style). Words fall toward a baseline. One word locked (first letters typed, heavier outline). Lives, wave number, WPM, accuracy. A small label: "Drill: built-in".
4. **Play: four-corner defense** (MasterType style). A center base, words approaching from four corners, one locked. Same status bar as screen 3.
5. **Results.** WPM 38, accuracy 96%, a "New best" line, one milestone card, the dip notice ("Speed often dips while your fingers relearn. It comes back faster."), buttons: Play again, Share, Feedback.
6. **Progress with heat map.** A full QWERTY keyboard drawn as keycaps, each colored by heat band with its pattern, some keys hatched as "not enough data," a legend, up to three plain diagnosis sentences (for example "Your left pinky misses about twice as often as your other fingers."), and a progress line over 14 sessions.

## What to hand back

Desktop artboards at 1440 × 900. Static is fine. No real data wiring.

---

## Locked Nov 11 2026 (round 2, Stitch screens translated)

Shara picked the Stitch direction and locked it. The static mock lives at `mock/index.html` (all six screens, keys 1 to 6 to switch). `mock/` is never imported by `src/` and never shipped.

| Decision | Detail |
|---|---|
| Look | "DEAD KEYS // TERMINAL 84": bracket labels, double rules, square corners, scanlines over the background and panels. Solid fills and block characters sit above the scanlines so they stay crisp. |
| Glow | None. D4 stands (Shara compared side by side and chose no glow). |
| Fonts | Roboto Condensed for headings. JetBrains Mono for body and typed text (replaces the ui-monospace stack in G11's starting tokens). |
| Fourth heat band | "Uneven": teal dashed border with a vertical stripe pattern and the `?` mark. Bands: missed `!` stripes coral, shaky `~` dots amber, uneven `?`, steady `✓`, no data `·` hatch. Exact cutoffs set in Block 3. |
| Play screens | One HUD bar (no top header during play). Danger zone (falling) and danger ring (corners) in amber with `[!]` on words inside. Locked target has the strongest treatment; a beam or fire line joins it to the ship or base. Far words smaller and dimmer. Words always lowercase, exactly as typed. |
| Title | Live attract demo behind a 680px panel: lanes, falling cards, a locked demo word, station on the baseline, Pause demo works, reduced motion shows a still frame. |
| Copy rule | Only true numbers and real features. No ranks, grades, fake telemetry or shortcuts that don't exist. Personality lives in flavor labels (TERMINAL 84, PID 0xDEAD, STATION_ID). |

**Open for the engine block:** PRD G2 says Escape pauses; G5 says Escape drops the lock. The mock shows Escape as pause. Decide before Block 2. Also still to design as moments, not screens: miss feedback, word cleared, wave up (each with a reduced-motion version).
