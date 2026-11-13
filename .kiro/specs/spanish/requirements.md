# Spanish pack and pack validator: requirements (Block 15)

PRD G2 and G6: "Spanish dead-keys pack: á é í ó ú ñ ¿ ¡ ... Community pack format plus validator." Scope chosen by Shara (Nov 13): the pack as a Words choice on the Play screen; Spanish lessons S1 to S3 move to v2. The MCP server is Kiro's half of Block 15. Rigor tier: Full.

## Req 1: the pack

1.1 `packs/spanish.json`: the 1,400 most frequent Spanish words from FrequencyWords (OpenSubtitles 2018, CC BY-SA 4.0) that are 3 to 9 letters of a to z plus á é í ó ú ñ ü, pass the Spanish spelling list, and are not on `packs/blocklist-es.txt`; plus 21 short ¿…? and ¡…! words written for the game.
1.2 Every dead key the PRD names appears: á é í ó ú ñ ü ¿ ¡.
1.3 The blocklist follows the English pack's rule: no profanity, slurs, sexual terms, curses, or words about violence, death, illness or drugs; no names or places.
1.4 The pack is built by `node scripts/build-pack-es.js`, deterministically, from sources kept in `packs/source/` with their licenses in `es_COPYRIGHT.txt`. The pack is shared under CC BY-SA 4.0, as its source requires.
1.5 About credits the Spanish list and its license.

## Req 2: picking it

2.1 The Play screen has a Words choice: English or Español, saved at once as the `pack` setting (English by default).
2.2 The choice applies to Falling words, Four corners and Practice. Drills, lessons, the daily drill and Spec Wave keep their own words.
2.3 A hint says Español needs a layout that types á, ñ, ¿ and ¡, such as US-International.
2.4 A composed character (one keydown whose key is á, after a dead key) types like any letter.
2.5 Results say "PACK: ESPAÑOL". Ghosts are kept per pack.
2.6 The Play screen still fits 1280 x 720 with no serious or critical axe issue.

## Req 3: the validator

3.1 `node scripts/check-pack.js [files]` checks packs (all of `packs/*.json` that are packs, when none is named), prints OK or FAIL with every problem and where, and exits 0 or 1.
3.2 It checks the contract, then: a language code; no charset character twice; a words pool of at least 20; unique ids; no word twice in a pool; at most 14 characters, no spaces; an attribution whenever any item is borrowed.
3.3 `docs/pack-format.md` explains the format and the checks for community pack authors.
3.4 Hook H4 (`.kiro/hooks/pack-check.json`) runs it when a pack file is saved.
