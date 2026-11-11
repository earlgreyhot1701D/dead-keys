// One file, one responsibility (PRD G12 H1). Warn at 150 lines, error at 250.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIRS = ["src", "api", "scripts", "mcp", "evals", "contract"];
const EXT = /\.(js|mjs|css|html)$/;
const SOFT = 150;
const HARD = 250;

let over = 0;
for (const dir of DIRS.filter((d) => existsSync(d))) {
  for (const name of readdirSync(dir, { recursive: true })) {
    const path = join(dir, String(name));
    if (!EXT.test(path)) continue;
    const lines = readFileSync(path, "utf8").split("\n").length;
    if (lines > HARD) {
      console.error(`OVER ${HARD}: ${path} has ${lines} lines. Split it before anything else.`);
      over++;
    } else if (lines > SOFT) {
      console.warn(`warn: ${path} has ${lines} lines (soft cap ${SOFT}).`);
    }
  }
}
process.exit(over ? 1 : 0);
