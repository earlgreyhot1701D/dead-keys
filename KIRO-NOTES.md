# Kiro notes

Running log for the Kiroween write-up: what each hook caught, where specs beat vibe coding, what Ponytail changed, what the property tests found, how Vercel was driven from the IDE. Newest entries at the bottom.

## Nov 11 2026: Block 0, repo setup (Claude, before Kiro)

- Checked the setup against Kiro's own docs. Added what the plan was missing: `.kiroignore`, `.kiro/settings/sandbox.json`, `.kiro/settings/mcp.json`, and a read-only `reviewer` custom agent.
- Ponytail ships its own Kiro steering file, so it lives at `.kiro/steering/ponytail.md` instead of AGENTS.md.
- Hook trigger names verified against the v1 schema: `PostTaskExec` for the line cap (fires once per task, not on every save), `SessionStart` for the block scope.
- Vercel MCP is in `mcp.json` but disabled. Kiro isn't on Vercel's list of supported MCP clients, so authorization may fail. Plan A is the Vercel CLI in Kiro's terminal. Try enabling the MCP server once; record what happens here.
- Pinned versions at least two weeks old: Vite 8.3.5 (Oct 21), Biome 2.6.4 (Oct 28), fast-check 4.10.2 (Sep 19). Vite 8.3.8 came out the same morning.
- Foundation steering written by hand from the PRD instead of Kiro's "Generate Steering Docs" button, which would write generic files.

## Nov 11 2026: sandbox dropped, setup by hand

- Kiro couldn't run `npm install`: PowerShell and the sandbox blocked it. Shara ran it herself.
- `.kiro/settings/sandbox.json` was removed and never committed. Kiro's own delete was blocked by a permission rule on `.kiro/settings/`, so Shara deleted it. This is the fallback PRD G12 already allows ("if unavailable, Kiro says so and runs without it"). Agent shell commands still need per-session approval in the IDE.
- Kiro handled `git init`, the remote, and staging. Lesson: keep setup prompts light; Kiro handles the basics.
