# Design: Block 4, storage

**Spec:** `storage`. **Requirements:** `requirements.md` (approved Nov 11). **Rigor:** Full.
**Status:** Approved by Shara Nov 11.

## Shape

Storage is passed in (`window.localStorage` in the app, a stand-in in tests), so every path runs under `node --test`. Every storage call sits in try/catch. Functions return `{ progress, notice, ... }`; `notice` is a notice id or null. Nothing here draws, confirms or reads a clock: `now` and `localDay` are passed in.

```
app start   -> load(storage, now)            -> { progress, notice, persist }
round ends  -> record(progress, result, day) -> progress        (engine, pure)
            -> save(storage, progress)       -> { notice }       (only if persist)
settings    -> exportText(progress)          -> string
            -> importText(text, now)         -> { ok, progress } | { ok: false, reason }
            -> clear(storage, now)           -> { progress, notice }
            -> readCorrupt(storage)          -> string | null
```

`persist` is false when storage is blocked or holds a newer version, so the app never writes over data it can't read.

## Files

| File | Job | Exports |
|---|---|---|
| `contract/schemas.js` | (changed) load schemas without `node:fs` | unchanged API |
| `src/storage/notices.js` | The five approved notices: id, line, button | `NOTICES` |
| `src/storage/vet.js` | Checks the schema subset can't express (Req 3) | `vet(progress)` returning errors |
| `src/storage/migrate.js` | Old saves to current, one step per version | `migrate(value)` |
| `src/storage/store.js` | Load, save, clear, read the corrupt copy | `load`, `save`, `clear`, `readCorrupt`, `freshProgress`, `KEY`, `CORRUPT_KEY` |
| `src/storage/exportImport.js` | Backup text out and in | `exportText`, `importText`, `MAX_IMPORT_BYTES` |
| `src/engine/record.js` | Fold one round into Progress | `record(progress, result, localDay)` |
| one `*.test.js` per file | | |

## Decisions

1. **Spike first (task 1, 15 minutes).** Try `import x from "./schemas/x.json" with { type: "json" }` in `schemas.js`. PASS when all three hold: `npm test` is green; a throwaway Vite build of an entry that calls `validate` succeeds; and the built output validates a fixture. Throwaway files live outside the repo and are deleted. FAIL means plan B: `scripts/bundle-schemas.js` writes `contract/schemas.bundle.js` from the JSON files, plus a test that fails if the bundle is out of date. Stop and report either way before task 2. **Result (Nov 11): PASS.** All three criteria held, so plan B is not built. `schemas.js` keeps a hand-kept `FILES` list, guarded by a test in `contract.test.js` that fails if the list and the directory differ. `package.json` declares `engines.node >= 22`, because import attributes need it.
2. **One source of truth.** Whatever the spike picks, the JSON files in `contract/schemas/` stay the only place a shape is written.
3. **Migration.** A table of steps, `{ from, to, run }`. Current version is 1. The only step is 0 to 1: keep what is recognizable (rounds that pass the RoundResult contract), fill every other field fresh, drop the rest. No real player has a v0 save; the step exists so the path is tested before it's needed.
4. **Corrupt copy.** One slot. A newer corruption overwrites the older copy. Known limit, logged.
5. **Fresh progress.** `freshProgress(now)`: schemaVersion 1, `createdAt` now, empty lists, `bests` {}, `settings` {}, `dayStreak` { lastDay: null, count: 0 }.
6. **Import.** Size checked on the string first (2 MB, measured in UTF-8 bytes). Then `JSON.parse`, then migrate, then contract and vet. Returns a reason in plain words for the screen; the player sees the `importFailed` line.
7. **Prototype keys.** `vet` rejects `__proto__`, `constructor` and `prototype` anywhere in the tree, which closes the gap left by map-like fields (`keyDeltas`, `bests`).
8. **Record order.** keys, then bests, then day streak, then milestones (which read the updated streak), then append and cap at 200.
9. **No new shapes.** The contract stays frozen; `vet` adds checks, not fields.

## Tests

| Test | Kind | Catches |
|---|---|---|
| Export then import equals the original | property | Lossy backups |
| Random text into `load` and `importText` never throws | property | Crashes on junk |
| `migrate` output always passes contract and vet | property | Bad upgrades |
| `record` never exceeds 200 rounds, never mutates | property | Unbounded saves |
| Each Req 2 branch with a stand-in storage (empty, junk, old, newer, throwing on get, on set) | examples | Lost data, missing notices |
| Clear removes both keys | example | Leftover data |
| Each vet rule, including `__proto__` | examples | Prototype pollution, bad keys |
| Import over 2 MB is refused before parsing | example | Memory spikes |
