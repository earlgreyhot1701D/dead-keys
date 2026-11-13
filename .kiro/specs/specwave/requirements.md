# Spec Wave: requirements (Block 14)

PRD G2: "type `kiro` on the title screen and a bonus Spec Wave starts: a wave of words like spec, steering, hook, requirements, design, tasks, agent. Drawn with our own ghost, never Kiro's logo or brand art." Rigor tier: Full.

## Req 1: the egg

1.1 On the title, typing k, i, r, o starts the Spec Wave. Caps Lock still counts.
1.2 A key that could begin the word waits 600 ms for the next; any other key, or the wait running out, starts the game as always.
1.3 The first time, the privacy card still comes first; the egg works once it has been seen.

## Req 2: the wave

2.1 One wave of Falling words on the spec words (mode `specwave`), with lives, no warm-up.
2.2 It ends itself right after the first wave, saved, on results. The live region says "Spec Wave. A bonus wave of words from the spec." at the start and "Spec Wave cleared." at the end.
2.3 Words: lowercase letters only, at least 10, including spec, steering, hook, requirements, design, tasks and agent. The word "kiro" is not one of them, and no Kiro logo or art appears.
2.4 No ghost is saved or raced. Play again plays the Spec Wave again.

## Req 3: results

3.1 Results say "MODE: SPECWAVE // PACK: SPEC WAVE".
