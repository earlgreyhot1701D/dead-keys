// Job: validate pack files and print every problem (CLI and library).
// The pack validator (spanish Req 3; PRD G2, hook H4). Checks one or more pack files and prints
// every problem with where it is. Exit code 0 when all pass, 1 when any fails.
//   node scripts/check-pack.js packs/spanish.json [more.json ...]
// With no file named, it checks every packs/*.json that is a pack (has "pools").
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checkPack } from "../src/packs/checkPack.js";

/**
 * Check one file. Never throws: a file that can't be read or parsed is a problem like any other.
 * @returns {{ file: string, problems: { path: string, message: string }[], items: number }}
 */
export function checkFile(file) {
  let pack;
  try {
    pack = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    return {
      file,
      problems: [{ path: "", message: `can't read it as JSON: ${err.message}` }],
      items: 0,
    };
  }
  const items = Object.values(pack?.pools ?? {}).reduce(
    (n, p) => n + (Array.isArray(p) ? p.length : 0),
    0,
  );
  return { file, problems: checkPack(pack), items };
}

/** Every pack file in packs/ (files with a "pools" object). */
export function packFiles(dir = fileURLToPath(new URL("../packs/", import.meta.url))) {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => `${dir}${f}`)
    .filter((f) => {
      try {
        return typeof JSON.parse(readFileSync(f, "utf8")).pools === "object";
      } catch {
        return true; // broken JSON: let checkFile report it
      }
    });
}

function main(args) {
  const results = (args.length ? args : packFiles()).map(checkFile);
  for (const r of results) {
    if (r.problems.length === 0) console.log(`OK   ${r.file}: ${r.items} items`);
    else {
      console.log(`FAIL ${r.file}: ${r.problems.length} problem(s)`);
      for (const p of r.problems) console.log(`     ${p.path || "(file)"}: ${p.message}`);
    }
  }
  process.exitCode = results.every((r) => r.problems.length === 0) ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
