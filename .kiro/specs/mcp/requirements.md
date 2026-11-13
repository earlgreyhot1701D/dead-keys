# Requirements: Block 15 part 2, MCP server

**Spec:** `mcp` (PRD G12: "`mcp/server.js` exposes `run_golden_set` and `validate_pack` as tools Kiro can call"). **Rigor:** Working, Full for the path check and the Bedrock gate.
**Status:** Written by Kiro, Nov 13, from Shara's instructions.

## Introduction

A small local MCP server lets Kiro check word packs and run the AI drill golden set as tools, instead of shell commands. It runs on the developer's machine over stdio. It is never deployed and never part of the build.

## Requirement 1: The server

1. `mcp/server.js` SHALL be an MCP server over stdio, built on the MCP TypeScript SDK at its latest stable release, pinned exactly, as a dev dependency.
2. It SHALL list exactly two tools, `validate_pack` and `run_golden_set`, with plain JSON Schema inputs.
3. An unknown tool, or a tool that throws, SHALL answer with an error message and never a stack trace or an env value.
4. It SHALL be registered in `.kiro/settings/mcp.json` next to the Vercel entry, with no secrets in that file.

## Requirement 2: validate_pack

1. Input `{ path?: string }`. It SHALL call `checkFile` and `packFiles` from `scripts/check-pack.js`.
2. With no path it SHALL check every pack in `packs/`.
3. A path SHALL be resolved from the repo root and accepted only if it is a `.json` file inside `packs/`. Anything else (`..`, an absolute path elsewhere, another folder, another file type, a NUL byte, a non-string) is refused.
4. It SHALL return OK or FAIL per file, with each problem, as `check-pack.js` prints them.

## Requirement 3: run_golden_set

1. It runs `evals/run.js` (`runGolden` on `evals/golden.json`) and returns its pass or fail lines and total.
2. It calls real Bedrock, so it SHALL refuse unless the input is exactly `{ confirm: true }`.
3. It SHALL never print or return credentials, tokens or env values, and never the drill text (run.js prints counts only).

## Requirement 4: Checks

1. Unit tests for the handlers with no network: the path refusal, `validate_pack` on the real packs, `run_golden_set` refusing without confirm (and, with a fake Bedrock call, returning only run.js's lines).
2. Every file under 150 lines, with a one-sentence "Job:" header comment.
3. Kiro calls `validate_pack` through the MCP connection and reports what it returned. `run_golden_set` is called only when Shara says so.
