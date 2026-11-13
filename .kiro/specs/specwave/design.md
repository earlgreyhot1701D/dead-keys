# Spec Wave: design (Block 14)

## Files

| File | Job |
| --- | --- |
| `src/specwave/specwave.js` | Pure: the words, the one-wave watch, the title's key watcher |
| `src/drills/limits.js` | A round's limits after every frame: the daily clock and the wave limit (`clockFor` moved here from daily.js) |
| `src/ui/screens/roundKinds.js` | Every round kind (moved from play.js at the line cap), with `specwave` added |
| `src/ui/screens/title.js` | Feeds start keys to the watcher |
| `src/ui/screens/drillRound.js` | A kind's start line (`say`), for the daily drill and Spec Wave |
| `src/ui/screens/resultsDrill.js` | PACK: SPEC WAVE |
| `src/ui/screens/round.js` | `packId` from the kind |

## Decisions

1. The wait is only on keys that could begin `kiro`, so most first keys start at once.
2. The privacy card is never skipped, egg or not.
3. Built by Claude to save Kiro credits; Kiro commits and deploys.

## Copy table (binding)

| Where | Words |
| --- | --- |
| Live, start | Spec Wave. A bonus wave of words from the spec. |
| Live, end | Spec Wave cleared. |
| Round h1 (screen reader) | Spec Wave |
| Results mode line | MODE: SPECWAVE // PACK: SPEC WAVE |
