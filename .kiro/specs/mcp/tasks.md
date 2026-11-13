# Tasks: Block 15 part 2, MCP server

- [x] 1. Longevity check for `@modelcontextprotocol/sdk`: latest stable, publish date, advisories. Install exact as a dev dependency; re-add the two `@emnapi` lockfile entries.
- [x] 2. `mcp/tools.js` and `mcp/tools.test.js` (Req 2, 3, 4.1).
- [x] 3. `mcp/server.js` (Req 1.1 to 1.3).
- [ ] 4. Register in `.kiro/settings/mcp.json` (Req 1.4). Kiro's file tools can't write `.kiro/settings/`, so Shara adds the entry.
- [ ] 5. Lint, unit, check-pack, check:build, e2e. Call `validate_pack` through MCP (Req 4.3). KIRO-NOTES. Commit "Block 15: MCP server (Kiro)". Preview deploy.
