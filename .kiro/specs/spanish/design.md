# Spanish pack and pack validator: design (Block 15)

## Files

| File | Job |
| --- | --- |
| `scripts/build-pack-es.js` | Builds `packs/spanish.json` |
| `packs/source/es_frequencywords_top8000.txt`, `es_spelled.txt`, `es_COPYRIGHT.txt` | The source list, the spelling list made from it, and their licenses |
| `packs/blocklist-es.txt` | What the Spanish pack leaves out |
| `src/packs/registry.js` | The packs a player can pick, their labels, and which rounds the pick applies to |
| `src/packs/checkPack.js`, `scripts/check-pack.js` | The validator and its CLI |
| `src/ui/components/packPick.js` | The Play screen's Words choice |
| `src/storage/settings.js` | The `pack` setting |
| `src/ui/screens/drillRound.js`, `round.js` | A round's words and `packId` from the pick |
| `src/ui/screens/resultsDrill.js`, `about.js` | PACK: ESPAÑOL; the Spanish credit |
| `docs/pack-format.md` | The format, for pack authors |

## Decisions

1. Source: FrequencyWords (CC BY-SA 4.0), the open Spanish frequency list the PRD asked for in G6. The pack is shared under the same license; the code stays MIT.
2. Spelling list: the Spanish Hunspell dictionary (dictionary-es 4.0.0) through nspell, run once, kept as `es_spelled.txt` the way `scowl_en_US.txt` is for English. Neither is a dependency of the game.
3. Subtitle words mean everyday spoken Spanish, which suits a typing game, but also curses and crime; the blocklist removes those, by the English pack's rule.
4. ü ranks too low for the top 1,400, so "¿bilingüe?" carries it.
5. Spanish lessons S1 to S3 move to v2 (Shara, Nov 13).
6. The keyboard heat map stays QWERTY; Spanish keys are counted and saved but only letters on the drawn keyboard are colored.
7. Built by Claude to save Kiro credits; Kiro commits, deploys and builds the MCP server.

## Copy table (binding)

| Where | Words |
| --- | --- |
| Play, label | Words |
| Play, choices | English / Español |
| Play, hint | Español needs a layout that types á, ñ, ¿ and ¡, such as US-International. |
| Results mode line | MODE: {MODE} // PACK: ESPAÑOL |
| About | The Spanish word list comes from FrequencyWords (github.com/hermitdave/FrequencyWords), built from OpenSubtitles 2018, under CC BY-SA 4.0; that pack is shared under the same license. |
