# Design: Block 15 part 2, MCP server

## Files

| File | Job |
|---|---|
| `mcp/server.js` | The stdio server: lists the tools and routes calls to their handlers |
| `mcp/tools.js` | The two handlers, the path check and the tool list (no transport, so tests need no network) |
| `mcp/tools.test.js` | Handler tests with no network |
| `.kiro/settings/mcp.json` | Registers `dead-keys`: `node mcp/server.js` |
| `package.json`, `package-lock.json` | `@modelcontextprotocol/sdk` 1.32.2, dev dependency, exact |

## Decisions

1. **SDK 1.32.2**, the latest stable on npm (dist-tag `latest`, published Oct 23, 2026, MIT). No beta or v2 pre-release. 1.32.0 and later carry the fixes for the SDK advisories published this year (the experimental-tasks session binding and the shared-transport data leak, which affects HTTP transports; this server uses stdio). It is a dev dependency: the server is a local tool, never in the build.
2. **Low-level `Server` with JSON Schema**, not `McpServer` with zod shapes, so the repo imports no zod of its own (zod is only the SDK's own dependency).
3. **Handlers in `tools.js`**, transport in `server.js`, so tests call the handlers directly.
4. **Path check**: `resolve(repoRoot, path)`, then `relative(packs, abs)` must not be empty, start with `..`, or be absolute, and the file must end in `.json`.
5. **Bedrock gate**: `run_golden_set` requires `confirm === true` (a boolean), so a stray call can't spend money. Its output is run.js's own lines, which hold counts only.
6. **The two optional `@emnapi` lockfile entries** are put back after `npm install` drops them (npm ci on Linux, where Vercel builds, needs them).
