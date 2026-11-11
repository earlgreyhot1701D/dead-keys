# Requirements: Block 4, storage

**Spec:** `storage` (PRD G9, backlog item 4: store, migrate, export/import). **Rigor:** Full (`tech.md`: `src/storage/` is Full). Every input checked, every failure path handled.
**Status:** Approved by Shara Nov 11 (notice wording rewritten from the player's side; download for the damaged copy added).
**Sources:** `docs/prd.md` G9 (one key, migration, corrupt backup, cap, export/import/clear), G2 (local progress), G10 and G11 (one-line notices). `KIRO-NOTES.md` rows "Deferred to Block 4". Contract: `progress.json` and everything it references (frozen after Block 3; this block adds no shapes).

## Introduction

Progress lives only in the player's browser, under one key. This block loads it, checks it, upgrades old saves, saves after each round, and lets the player export, import and clear it. Nothing a player does to their saved data, and nothing a browser does to it, may crash the game or lose good data without saying so.

## Scope

**In:** `src/storage/store.js` (load, save, clear), `migrate.js`, `exportImport.js`, `vet.js` (checks the schema can't express), `src/engine/record.js` (fold one finished round into Progress). The browser switch for `contract/schemas.js`. Tests.
**Out:** the Settings screen, confirm dialogs and notice styling (Block 6). Settings fields (Block 6). Ghost saving (Block 13).

## Glossary

- **Storage:** anything with `getItem`, `setItem`, `removeItem` (the browser's localStorage, or a stand-in in tests). Passed in, never reached for.
- **Notice:** one plain line the screen shows. The storage code returns it; it never draws it.

---

## Requirement 1: The contract runs in the browser

1. `contract/schemas.js` SHALL load schemas without `node:fs`, so `validate` works in the browser build and in `node --test`.
2. Task 1 SHALL be a 15-minute spike with pass/fail criteria before any other change (see design).
3. Everything Block 1 to 3 proved SHALL still pass.

## Requirement 2: Load

1. THE SYSTEM SHALL read exactly one key, `deadkeys:v1`.
2. IF nothing is saved, THE SYSTEM SHALL start fresh progress with no notice.
3. IF the saved text is not JSON, or fails the contract or the vet checks, THE SYSTEM SHALL copy the raw text to `deadkeys:v1:corrupt`, start fresh, and return the corrupt notice.
4. IF the save is an older `schemaVersion`, THE SYSTEM SHALL migrate it, check the result, save it, and return no notice. IF migration fails, treat it as corrupt.
5. IF the save is a newer `schemaVersion`, THE SYSTEM SHALL not overwrite it, SHALL run in memory, and return the newer-version notice.
6. IF storage throws or is missing, THE SYSTEM SHALL run in memory and return the blocked notice.
7. WHEN a corrupt copy exists, THE SYSTEM SHALL return its raw text on request, so the screen can offer it as a download.

## Requirement 3: Vet checks

THE SYSTEM SHALL reject a save where any of these is false (the Deferred-to-Block-4 rows):
1. every `keyDeltas` and `keys` key is exactly one character;
2. every `bests` key is a real mode and not `practice`;
3. `dayStreak.lastDay` is null or a real calendar date as `YYYY-MM-DD`;
4. no object key is `__proto__`, `constructor` or `prototype`.

## Requirement 4: Record a round

1. `record(progress, result, localDay)` SHALL merge key stats, update bests, update the day streak (every round, practice included), add new milestones, and append the round.
2. WHEN rounds pass 200, THE SYSTEM SHALL drop the oldest.
3. It SHALL be pure, never change its input, and its output SHALL pass the contract and the vet checks.

## Requirement 5: Save and clear

1. THE SYSTEM SHALL save the whole Progress to `deadkeys:v1` after each recorded round.
2. IF a save throws (quota, blocked), THE SYSTEM SHALL keep the game running in memory and return the not-saved notice.
3. Clear SHALL remove `deadkeys:v1` and `deadkeys:v1:corrupt` and return fresh progress. The confirm step is the screen's job.

## Requirement 6: Export and import

1. Export SHALL produce JSON text that import accepts and that round-trips to equal Progress.
2. Import SHALL accept text up to 2 MB, parse it with `JSON.parse` only, migrate if older, and check it with the contract and vet checks.
3. IF import fails, THE SYSTEM SHALL change nothing and return a reason in plain words. IF it passes, it SHALL return the new Progress for the screen to confirm before saving.

## Requirement 7: Tests

1. Every requirement SHALL have a property test or a named example, using a stand-in storage that can be set to throw.
2. Property tests SHALL cover at least: export then import round-trips, migration output always passes the contract, `record` never exceeds 200 rounds, random junk text never crashes load or import.
3. `npm test`, `npm run lint` and `node scripts/check-fixtures.js` SHALL pass.

---

## Notice wording (approved)

Every notice answers three things, in order: what happened (no blame), what is still safe, and one thing to do, with a button for it.

| Id | When | Line the player sees | Button |
|---|---|---|---|
| `blocked` | Browser won't save | This browser isn't saving progress right now. Private browsing or a browser setting can do this. You can still play. To keep today's rounds, download a backup before you close the tab. | Download backup |
| `corrupt` | Saved data damaged | We couldn't read your saved progress, so this is a fresh start. You didn't do anything wrong. We kept a copy of the old data. | Download old data |
| `newer` | Save from a newer version | Your progress was saved by a newer version of Dead Keys, so we left it untouched. Refresh to get the latest version. Until then, today's rounds aren't saved. | Refresh |
| `saveFailed` | One save failed | That round didn't save. Your browser's storage may be full. Everything before it is still safe. | Download backup |
| `importFailed` | Import failed | That file couldn't be loaded, so nothing changed. Your current progress is safe. Try a backup downloaded from Dead Keys. | Choose another file |
