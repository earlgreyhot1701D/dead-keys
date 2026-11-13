// Job: the Dead Keys MCP server over stdio, exposing validate_pack and run_golden_set (PRD G12) to Kiro.
// Run: node mcp/server.js (Kiro starts it from .kiro/settings/mcp.json). The handlers live in
// tools.js. Nothing is written to stdout except the protocol, and no env value is ever returned.

import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { TOOLS } from "./tools.js";

/** A server with the two tools registered (exported so a test can check the list). */
export function createServer() {
  const server = new Server(
    { name: "dead-keys", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
  }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = TOOLS.find((t) => t.name === req.params.name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${req.params.name}` }],
        isError: true,
      };
    }
    try {
      return await tool.handler(req.params.arguments ?? {});
    } catch (err) {
      // A tool failure is a message, never a stack or an env value.
      return {
        content: [{ type: "text", text: `${tool.name} failed: ${err?.name ?? "Error"}` }],
        isError: true,
      };
    }
  });
  return server;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await createServer().connect(new StdioServerTransport());
}
