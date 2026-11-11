// Prints docs/current-block.md at session start (hook H2).
import { readFileSync } from "node:fs";

try {
  console.log(readFileSync("docs/current-block.md", "utf8"));
} catch {
  console.log("docs/current-block.md is missing. Ask Shara which block is current.");
}
