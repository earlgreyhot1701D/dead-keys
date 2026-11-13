# Sound sets: requirements (Block 14)

PRD G2: "Sound sets: Off (default), Typewriter (clack, carriage return, bell), Arcade (laser on clear, thud on hit, chime on wave up). All synthesized with the Web Audio API, so there are no audio files to license." Rigor tier: Full.

## Req 1: what plays

1.1 Off is the default and plays nothing.
1.2 Typewriter: a clack for every key typed in a round, a carriage return for each word cleared, a bell on each new wave, a thunk when a word lands.
1.3 Arcade: a laser for each word cleared, a thud when a word lands, a chime on each new wave. No sound per key.
1.4 Every sound is made with the Web Audio API. No audio files. Quiet by design.
1.5 Where Web Audio is missing or refused, the game is silent and nothing breaks.
1.6 The attract demo is always silent.

## Req 2: Settings

2.1 The Sound setting works: it no longer says "Not built yet".
2.2 Its hint says what each set sounds like.
2.3 Picking Typewriter or Arcade plays one sample (bell or chime) so the player hears what they chose.
