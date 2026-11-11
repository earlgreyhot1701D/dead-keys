---
inclusion: always
---

# Dead Keys: structure

One file, one responsibility. Soft cap 150 lines, hard cap 250. Over 250, split before anything else (hook `line-cap` checks after every task).

| Folder | Holds | Rule |
|---|---|---|
| `contract/` | `schemas/*.json`, `types.js` | Data shapes only (PRD G4) |
| `fixtures/` | `normal/`, `ugly/` | Sample data both tracks build against |
| `src/engine/` | match, score, rng, round, heatmap, diagnose, sample, daily, ghost, milestones, recommend | Pure functions. No DOM, no storage, no network. |
| `src/storage/` | store, migrate, exportImport | localStorage only, every call in try/catch |
| `src/packs/` | load, validate | Validator also runs as a CLI |
| `src/net/` | drillClient | The only fetch. Timeout, try/catch, built-in fallback |
| `src/ui/` | one file per screen or component | Rendering only, `textContent` only |
| `src/render/` | corners, falling, playback | The two mechanics and replay |
| `src/a11y/` | announce, motion | Live region, reduced motion |
| `src/audio/` | sounds | Synthesized sound sets |
| `packs/` | general.json, spanish.json, README.md | Content and the pack format |
| `api/` | drill, limits, bedrock, validate | The AI route. `bedrock.js` is the only file that talks to AWS. |
| `evals/` | golden.json, run.js | Golden set for AI drills |
| `mcp/` | server.js | `run_golden_set`, `validate_pack` |
| `scripts/` | hook scripts and CLIs | Small, single-purpose |
| `docs/` | prd, research, prior-work, current-block, start-here | Planning, not code |

Contracts are referenced, not copied: point at `contract/schemas/<name>.json` with a file reference instead of pasting the shape into a spec.

Names: files in camelCase (`exportImport.js`), one exported concern per file, JSDoc on every export.
