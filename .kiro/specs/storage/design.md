# Design: Block 4, storage

**Spec:** `storage`. **Requirements:** `requirements.md` (approved Nov 11). **Rigor:** Full.
**Status:** Approved by Shara Nov 11.

## Shape

Storage is passed in (`window.localStorage` in the app, a stand-in in tests), so every path runs under `node --test`. Every storage call sits in try/catch. Functions return `{ progress, notice, ... }`; `notice` is a notice id or null. Nothing here draws, confirms or reads a clock: `now` and `localDay` are passed in.

```
app start   -> load(storage, now)            -> { progress, notice, persist }
round ends  -> record(progress, result, day) -> progress        (engine, pure)
            -> save(storage, progress)       -> { notice } | { notice, reason }   (only if persist; reason "invalid" or "storage")
settings    -> exportText(progress)          -> string
            -> importText(text, now)         -> { ok, progress } | { ok: false, reason }
            -> clear(storage, now)           -> { progress, notice, persist }
            -> readCorrupt(storage)          -> string | null
```

`persist` is false when storage is blocked or holds a newer version, so the app never writes over data it can't read.

## Files

| File | Job | Exports |
|---|---|---|
| `contract/schemas.js` | (changed) load schemas without `node:fs` | unchanged API |
| `src/storage/notices.js` | The five approved notices: id, line, button | `NOTICES` |
| `src/storage/vet.js` | Checks the schema subset can't express (Req 3) | `vet(progress)` returning errors |
| `src/storage/migrate.js` | Old saves to current, one step per version; also the one place the fresh shape is written | `migrate(value, now)` (an optional third argument is the step table, for tests), `freshProgress(now)`, `STEPS` |
| `src/storage/store.js` | Load, read the corrupt copy | `load`, `readCorrupt`, `KEY`, `CORRUPT_KEY`, and a re-export of `freshProgress` |
| `src/storage/saveClear.js` | Write and remove the save (split from `store.js` at the line cap, Nov 11) | `save`, `clear` |
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
10. **Corrupt copy that cannot be written** (decided Nov 11). Nothing is touched: the damaged text stays under `deadkeys:v1`, the game runs in memory with `persist` false, and the notice is `blocked`. Otherwise the `corrupt` notice would promise a copy that does not exist, and a later save would destroy the only one. After a good copy, fresh progress is written at once so the notice is not repeated on every load.
11. **`save` refuses invalid progress** (decided Nov 11). Progress that fails the contract or the vet checks is never written and returns `{ notice: "saveFailed", reason: "invalid" }`; a storage that refuses returns `reason: "storage"`. The player sees the same line, but a bug cannot pass as a full disk.
12. **An upgraded save that cannot be written** still loads, with the `saveFailed` notice (decided Nov 11).
13. **`migrate(value, now)`** takes the clock, for the fresh `createdAt` of an upgraded save, and returns `{ ok: true, progress }` only for results that pass the contract and the vet checks (decided Nov 11).
14. **`clear` returns `persist`** (decided Nov 11): false when storage refused the removal, since the old data may still be there.
15. **One fresh shape** (decided Nov 11). `freshProgress` is written once, in `migrate.js`; `store.js` re-exports it and the version 0 upgrade starts from it, so they cannot drift. `load` writes only data `migrate` or `freshProgress` just produced, so it needs no `save`, and `saveClear.js` imports `store.js` without a cycle.
16. **`record` ignores a duplicate and copies the round** (decided Nov 11). A round whose id is already in `progress.rounds` returns `progress` unchanged (it was first built to throw; a double-fired results screen must not crash or double count). The appended round is a `structuredClone`. Known limit: an id that has already fallen out of the last 200 rounds is not seen, which a double-fire cannot reach. `record` returns only the progress; an explicit "new best" return is Deferred to Block 11.
17. **An upgrade keeps the original first** (decided Nov 11). Version 0 keeps only valid rounds, so before `load` writes an upgraded save over `deadkeys:v1` it copies the raw text to `deadkeys:v1:corrupt`. If that copy cannot be written, nothing is touched, the upgraded progress runs in memory (`persist` false) and the notice is `blocked`, as in decision 10. A successful upgrade shows no notice. Import does not copy: the backup file is still on the player's disk. Known limit: the copy shares the one slot, so it replaces an earlier damaged copy that was never downloaded.
18. **`migrate` failures carry a code** (decided Nov 11): `notASave`, `newer`, `noPath`, `badStep`, `stepFailed`, `format` or `unsafe`. `importText` reads the code, never the message text, so rewording a reason cannot change what the player sees.
19. **A throwing upgrade is a damaged save** (decided Nov 11). `load` wraps the `migrate` call in try/catch; a throw takes the corrupt path. `load` takes an optional third argument (the migrate function) that only tests pass.

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


